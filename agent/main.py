from livekit.agents import JobContext, WorkerOptions, cli, JobProcess, AutoSubscribe
from livekit.agents.llm import (
    ChatContext,
    ChatMessage,
)
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import silero, groq

from dotenv import load_dotenv
import os
import asyncio
import time
from groq import Groq
import base64
from queue import Queue
import dataclasses
from google.cloud import secretmanager

@dataclasses.dataclass
class ImageAnalysisMessage:
    message_to_say: str
    filename: str
    analysis: str

# Create a global queue for passing image analysis between threads
image_analysis_queue = Queue()

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Chat assistant reference - will be initialized in the entrypoint
global_assistant = None

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def analyze_image(image_path):
    """
    Analyze an image using Groq API
    
    Args:
        image_path (str): Path to the uploaded image
        
    Returns:
        str: Analysis result as text
    """
    # Read the current API key
    api_key = get_api_key()
    if not api_key:
        return "Sorry, I couldn't analyze the image because the API key isn't set."
    
    base64_image = ""
    try:
        with open(image_path, "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')
        
        client = Groq(api_key=api_key)
        completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Describe the image and where everything is in the image."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}",
                            }
                        }
                    ]
                }
            ],
            temperature=1,
            max_completion_tokens=1024,
            top_p=1,
            stream=False,
            stop=None,
        )
        result = completion.choices[0].message
        print(result.content)
        return result.content
    except Exception as e:
        print(f"Error analyzing image: {e}")
        return f"Sorry, I encountered an error while analyzing the image: {str(e)}"

def get_api_key():
    """
    Get the API key from environment or Secret Manager.
    """
    # First check environment
    api_key = os.getenv("GROQ_API_KEY")
    if api_key:
        return api_key

    try:
        project_id = os.environ.get("GCP_PROJECT_ID")
        secret_id = "groq-api-key"
        print(project_id, secret_id)
        name = f"projects/{project_id}/secrets/{secret_id}/versions/latest"

        client = secretmanager.SecretManagerServiceClient()
        response = client.access_secret_version(request={"name": name})
        print("this is the response from the secret manager:", response)
        api_key = response.payload.data.decode("UTF-8")
        print("this is the api key:", api_key)
        # Optionally cache in environment
        os.environ["GROQ_API_KEY"] = api_key
        return api_key

    except Exception as e:
        print(f"Error retrieving API key from Secret Manager: {e}")
        return None
    
def check_for_new_images():
    """
    Check if new images have been uploaded and process them
    """
    if os.path.exists('last_uploaded_image.txt'):
        try:
            with open('last_uploaded_image.txt', 'r') as f:
                image_path = f.read().strip()
            
            # Only process if the file exists
            if os.path.exists(image_path):
                # Remove the file so we don't process it again
                os.remove('last_uploaded_image.txt')
                
                # Analyze the image
                analysis_result = analyze_image(image_path)
                
                # Get the filename from the path
                filename = os.path.basename(image_path)
                
                # Add to queue for processing
                if global_assistant:
                    message_to_say = f"I received an image upload. {analysis_result}"
                    image_analysis_queue.put(ImageAnalysisMessage(
                        message_to_say=message_to_say,
                        filename=filename,
                        analysis=analysis_result
                    ))
                
                return True
        except Exception as e:
            print(f"Error processing new image: {e}")
            # Remove the file if there was an error
            if os.path.exists('last_uploaded_image.txt'):
                os.remove('last_uploaded_image.txt')
    
    return False

def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

async def entrypoint(ctx: JobContext):
    global global_assistant, image_analysis_queue
    
    # Wait for API key file
    print("Waiting for API key to be set...")
    key_set_time = time.time()
    key_timeout = 300  # 5 minutes timeout
    
    while time.time() - key_set_time < key_timeout:
        api_key = get_api_key()
        if api_key:
            print("API key loaded")
            break
        await asyncio.sleep(1)
        
    if not get_api_key():
        print("No API key received after timeout. Using default key if available.")
    
    # Connect to the room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    
    # Initialize chat context
    initial_ctx = ChatContext(
        messages=[
            ChatMessage(
                role="system",
                content="You are an image analyst assistant that answers questions. Be nice. Respond in full words and plain text, without styling words or special characters.",
            )
        ]
    )

    # Initialize voice assistant
    assistant = VoiceAssistant(
        vad=ctx.proc.userdata["vad"],
        stt=groq.STT(api_key=get_api_key()),
        llm=groq.LLM(
            model="llama3-8b-8192",
            api_key=get_api_key()
        ),
        tts=groq.TTS(
            voice="Chip-PlayAI",
            api_key=get_api_key()
        ),
        chat_ctx=initial_ctx,
    )
    
    # Store the assistant in the global variable
    global_assistant = assistant

    # Start the assistant
    assistant.start(ctx.room)
    await assistant.say("Hi there, how are you doing today? You can upload images and I'll analyze them for you.", allow_interruptions=True)
    
    # Main loop to process image analyses and check for new uploads
    while True:
        # Check for messages in the queue
        if not image_analysis_queue.empty():
            message = image_analysis_queue.get()
            
            # Add to chat context
            assistant.chat_ctx.messages.append(
                ChatMessage(
                    role="system",
                    content=f"[Image uploaded: {message.filename}] Analysis: {message.analysis}"
                )
            )
            
            # Say the message
            await assistant.say(message.message_to_say, allow_interruptions=True)
        
        # Check for new uploaded images
        check_for_new_images()
        
        # Sleep a short time to avoid CPU hogging
        await asyncio.sleep(0.1)
        
if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))