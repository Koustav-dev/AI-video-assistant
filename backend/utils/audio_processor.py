"""
utils/audio_processor.py
Downloads or reads a media source and splits it into ≤25 MB WAV chunks
for the Groq Whisper API (max 25 MB per request).
"""
import os
import math
import tempfile
import subprocess
from pathlib import Path
from typing import List

CHUNK_MB = 24          # keep just under the 25 MB Groq limit
CHUNK_BYTES = CHUNK_MB * 1024 * 1024


def _is_youtube(source: str) -> bool:
    return "youtube.com" in source or "youtu.be" in source


def _cookie_args() -> list:
    """If a YouTube cookies file exists (set via Render secret file), copy it
    to a writable location since yt-dlp needs to rewrite the cookie jar on exit."""
    src = "/etc/secrets/cookies.txt"
    if os.path.exists(src):
        dst = "/tmp/cookies.txt"
        try:
            import shutil
            shutil.copyfile(src, dst)
        except Exception:
            dst = src
        return ["--cookies", dst]
    return []


def _common_args() -> list:
    """Common yt-dlp args: cookies + use android client to avoid JS/n-challenge."""
    return _cookie_args() + [
        "--extractor-args", "youtube:player_client=android,-tv,-web",
    ]


def _download_youtube(url: str, out_dir: str) -> str:
    """Download best audio from YouTube as a WAV file."""
    out_template = os.path.join(out_dir, "audio.%(ext)s")
    cmd = [
        "yt-dlp",
        *_common_args(),
        "--extract-audio",
        "--audio-format", "wav",
        "--audio-quality", "0",
        "--output", out_template,
        "--no-playlist",
        url,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        # Try mp3 fallback
        out_template_mp3 = os.path.join(out_dir, "audio_dl.%(ext)s")
        cmd2 = [
            "yt-dlp",
            *_common_args(),
            "--extract-audio",
            "--audio-format", "mp3",
            "--output", out_template_mp3,
            "--no-playlist",
            url,
        ]
        result2 = subprocess.run(cmd2, capture_output=True, text=True)
        if result2.returncode != 0:
            raise RuntimeError(f"yt-dlp failed: {result.stderr}\n{result2.stderr}")
        # Convert mp3 → wav
        mp3_files = list(Path(out_dir).glob("audio_dl.*"))
        if not mp3_files:
            raise RuntimeError("yt-dlp produced no output file.")
        mp3_path = str(mp3_files[0])
        wav_path = os.path.join(out_dir, "audio.wav")
        subprocess.run(
            ["ffmpeg", "-y", "-i", mp3_path, "-ar", "16000", "-ac", "1", wav_path],
            check=True, capture_output=True
        )
        return wav_path

    wav_files = list(Path(out_dir).glob("audio.*"))
    if not wav_files:
        raise RuntimeError("yt-dlp produced no output file.")
    wav_path = str(wav_files[0])
    # Re-encode to 16 kHz mono WAV for Whisper compatibility
    normalized = os.path.join(out_dir, "audio_norm.wav")
    subprocess.run(
        ["ffmpeg", "-y", "-i", wav_path, "-ar", "16000", "-ac", "1", normalized],
        check=True, capture_output=True
    )
    return normalized


def _to_wav(source: str, out_dir: str) -> str:
    """Convert any local audio/video file to 16 kHz mono WAV."""
    out_path = os.path.join(out_dir, "audio_norm.wav")
    subprocess.run(
        ["ffmpeg", "-y", "-i", source, "-ar", "16000", "-ac", "1", out_path],
        check=True, capture_output=True
    )
    return out_path


def _split_wav(wav_path: str, out_dir: str) -> List[str]:
    """Split a WAV into chunks ≤ CHUNK_BYTES using ffmpeg segment."""
    file_size = os.path.getsize(wav_path)
    if file_size <= CHUNK_BYTES:
        return [wav_path]

    # Get duration in seconds
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", wav_path],
        capture_output=True, text=True
    )
    duration = float(probe.stdout.strip())
    n_chunks = math.ceil(file_size / CHUNK_BYTES)
    segment_duration = math.ceil(duration / n_chunks)

    chunk_pattern = os.path.join(out_dir, "chunk_%03d.wav")
    subprocess.run(
        ["ffmpeg", "-y", "-i", wav_path,
         "-f", "segment",
         "-segment_time", str(segment_duration),
         "-ar", "16000", "-ac", "1",
         chunk_pattern],
        check=True, capture_output=True
    )
    chunks = sorted(Path(out_dir).glob("chunk_*.wav"))
    return [str(c) for c in chunks]


def process_input(source: str) -> List[str]:
    """
    Entry point: accepts a YouTube URL or local file path.
    Returns a list of WAV chunk file paths ready for Whisper.
    """
    tmp_dir = tempfile.mkdtemp(prefix="ai_video_")

    if _is_youtube(source):
        wav_path = _download_youtube(source, tmp_dir)
    else:
        if not os.path.exists(source):
            raise FileNotFoundError(f"File not found: {source}")
        wav_path = _to_wav(source, tmp_dir)

    chunks = _split_wav(wav_path, tmp_dir)
    return chunks