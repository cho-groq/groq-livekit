from livekit.agents import JobContext, WorkerOptions, cli, JobProcess, AutoSubscribe
from livekit.agents.llm import (
    ChatContext,
    ChatMessage,
)
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import silero, cartesia, openai

from dotenv import load_dotenv

load_dotenv()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    initial_ctx = ChatContext(
        messages=[
            ChatMessage(
                role="system",
                content="You are the Groq voice assistant. Be nice.",
            )
        ]
    )

    assistant = VoiceAssistant(
        vad=ctx.proc.userdata["vad"],
        stt=openai.stt.STT.with_groq(),
        llm=openai.LLM.with_groq(),
        # you would have to edit this one somehow to use playht on groq
        tts=cartesia.TTS(
            voice="248be419-c632-4f23-adf1-5324ed7dbf1d",
        ),
        chat_ctx=initial_ctx,
    )

    assistant.start(ctx.room)
    await assistant.say("Hi there, how are you doing today?", allow_interruptions=True)


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
