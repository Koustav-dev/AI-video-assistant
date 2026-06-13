"""
core/transcriber.py
Transcribes audio chunks using Groq's Whisper API (free tier, fast).
Falls back to AssemblyAI free tier if GROQ_API_KEY is not set.
"""
import os
from typing import List
from deep_translator import GoogleTranslator


GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY", "")


def _transcribe_groq(chunk_path: str, language: str) -> str:
    """Use Groq's Whisper large-v3 via their API."""
    from groq import Groq
    client = Groq(api_key=GROQ_API_KEY)
    with open(chunk_path, "rb") as f:
        response = client.audio.transcriptions.create(
            file=(os.path.basename(chunk_path), f),
            model="whisper-large-v3",
            response_format="text",
            language="hi" if language == "hinglish" else "en",
        )
    return str(response)


def _transcribe_assemblyai(chunk_path: str) -> str:
    """Fallback: AssemblyAI free tier transcription."""
    import requests
    headers = {"authorization": ASSEMBLYAI_API_KEY}

    # Upload
    with open(chunk_path, "rb") as f:
        upload_resp = requests.post(
            "https://api.assemblyai.com/v2/upload",
            headers=headers,
            data=f
        )
    upload_url = upload_resp.json()["upload_url"]

    # Request transcript
    transcript_resp = requests.post(
        "https://api.assemblyai.com/v2/transcript",
        json={"audio_url": upload_url},
        headers=headers
    )
    transcript_id = transcript_resp.json()["id"]

    # Poll
    import time
    while True:
        poll = requests.get(
            f"https://api.assemblyai.com/v2/transcript/{transcript_id}",
            headers=headers
        )
        status = poll.json()["status"]
        if status == "completed":
            return poll.json()["text"]
        if status == "error":
            raise RuntimeError(f"AssemblyAI error: {poll.json()['error']}")
        time.sleep(3)


def _translate_to_english(text: str) -> str:
    """Translate Hindi/Hinglish text to English."""
    try:
        translated = GoogleTranslator(source="hi", target="en").translate(text)
        return translated or text
    except Exception:
        return text


def transcribe_chunk(chunk_path: str, language: str = "english") -> str:
    """Transcribe a single audio chunk."""
    if GROQ_API_KEY:
        text = _transcribe_groq(chunk_path, language)
    elif ASSEMBLYAI_API_KEY:
        text = _transcribe_assemblyai(chunk_path)
    else:
        raise RuntimeError(
            "No transcription API key found. Please set GROQ_API_KEY or ASSEMBLYAI_API_KEY in .env"
        )

    if language == "hinglish":
        text = _translate_to_english(text)

    return text


def transcribe_all(
    chunks: List[str],
    language: str = "english",
    progress_callback=None
) -> str:
    """
    Transcribe all audio chunks and concatenate.
    Optional progress_callback(current, total) for streaming updates.
    """
    parts = []
    total = len(chunks)
    for i, chunk in enumerate(chunks):
        text = transcribe_chunk(chunk, language)
        parts.append(text.strip())
        if progress_callback:
            progress_callback(i + 1, total)

    return "\n\n".join(parts)
