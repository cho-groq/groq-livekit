from livekit.agents import JobContext, WorkerOptions, cli, JobProcess, AutoSubscribe
from livekit.agents.llm import (
    ChatContext,
    ChatMessage,
)
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import silero, groq

from dotenv import load_dotenv
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import uuid
import threading
import asyncio
import time
from groq import Groq
import base64

from queue import Queue
import dataclasses

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

# Flask app for handling image uploads
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Configure allowed extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def analyze_image(image_path):
    """
    Placeholder function for image analysis.
    Replace this with your actual image analysis code.
    
    Args:
        image_path (str): Path to the uploaded image
        
    Returns:
        str: Analysis result as text
    """
    # This is where you would implement your image analysis logic
    # For example, using a machine learning model to analyze the image
    

    base64_image = ""

    with open(image_path, "rb") as image_file:
        base64_image = base64.b64encode(image_file.read()).decode('utf-8')
    # print(base64_image)
    
    client = Groq(api_key=GROQ_API_KEY)
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

@app.route('/upload', methods=['POST'])
def upload_image():
    global global_assistant, image_analysis_queue
    
    # Check if the post request has the file part
    if 'image' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    files = request.files.getlist('image')
    responses = []

    for file in files:
        if file and allowed_file(file.filename):
            original_filename = secure_filename(file.filename)
            extension = original_filename.rsplit('.', 1)[1].lower()
            unique_filename = f"{uuid.uuid4().hex}.{extension}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(file_path)

            analysis_result = analyze_image(file_path)

            if global_assistant:
                message_to_say = f"I received an image upload. {analysis_result}"
                image_analysis_queue.put(ImageAnalysisMessage(
                    message_to_say=message_to_say,
                    filename=original_filename,
                    analysis=analysis_result
                ))

            responses.append({
                'success': True,
                'filename': unique_filename,
                'original_filename': original_filename,
                'file_path': file_path,
                'analysis': analysis_result
            })
        else:
            responses.append({'error': f'File type not allowed: {file.filename}'})

    return jsonify(responses), 200
    
    # If user does not select file, browser also
    # submit an empty part without filename
    # if file.filename == '':
    #     return jsonify({'error': 'No selected file'}), 400
    
    # if file and allowed_file(file.filename):
    #     # Generate a unique filename to prevent overwriting
    #     original_filename = secure_filename(file.filename)
    #     extension = original_filename.rsplit('.', 1)[1].lower()
    #     unique_filename = f"{uuid.uuid4().hex}.{extension}"
        
    #     file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    #     file.save(file_path)
        
    #     # Analyze the image
    #     analysis_result = analyze_image(file_path)
        
    #     # If we have an active assistant, queue the message to be processed in the main loop
    #     if global_assistant:
    #         message_to_say = f"I received an image upload. {analysis_result}"
            
    #         # Add message to queue to be processed by main loop
    #         image_analysis_queue.put(ImageAnalysisMessage(
    #             message_to_say=message_to_say,
    #             filename=original_filename,
    #             analysis=analysis_result
    #         ))
        
    #     # Return the file information and analysis
    #     return jsonify({
    #         'success': True,
    #         'filename': unique_filename,
    #         'original_filename': original_filename,
    #         'file_path': file_path,
    #         'analysis': analysis_result
    #     }), 200
    
    return jsonify({'error': 'File type not allowed'}), 400

@app.route('/status', methods=['GET'])
def status():
    return jsonify({'status': 'API is running'})

def start_flask_app():
    """Start Flask app in a separate thread"""
    app.run(debug=False, host='0.0.0.0', port=5000)

def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()
async def entrypoint(ctx: JobContext):
    global global_assistant, image_analysis_queue
    
    # Start Flask server in a separate thread
    flask_thread = threading.Thread(target=start_flask_app)
    flask_thread.daemon = True  # Daemon thread will be terminated when main thread exits
    flask_thread.start()
    
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    initial_ctx = ChatContext(
        messages=[
            ChatMessage(
                role="system",
                content="You are an image analyst assistant that answers questions. Be nice. Respond in full words and plain text, without styling words or special characters.",
            )
        ]
    )

    assistant = VoiceAssistant(
        vad=ctx.proc.userdata["vad"],
        stt=groq.STT(),
        llm=groq.LLM(
            model="llama3-8b-8192",
            # tool_choice=""
        ),
        tts=groq.TTS(
            voice="Chip-PlayAI",
        ),
        chat_ctx=initial_ctx,
    )
    
    # Store the assistant in the global variable
    global_assistant = assistant

    assistant.start(ctx.room)
    await assistant.say("Hi there, how are you doing today? You can upload images and I'll analyze them for you.", allow_interruptions=True)
    
    # Main loop to process image analyses
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
            
        # Sleep a short time to avoid CPU hogging
        await asyncio.sleep(0.1)
        
if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))