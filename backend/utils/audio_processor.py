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

CHUNK_MB = 24
CHUNK_BYTES = CHUNK_MB * 1024 * 1024

WARP_PROXY = "http://warp:8080"


def _is_youtube(source: str) -> bool:
    return "youtube.com" in source or "youtu.be" in source


def _run_yt_dlp(extra_args: list, out_template: str, audio_format: str, url: str):
    cmd = [
        "yt-dlp",
        *extra_args,
        "--socket-timeout", "30",
        "--retries", "3",
        "--extract-audio",
        "--audio-format", audio_format,
        "--audio-quality", "0",
        "--output", out_template,
        "--no-playlist",
        url,
    ]
    return subprocess.run(cmd, capture_output=True, text=True, timeout=120)


def _download_youtube(url: str, out_dir: str) -> str:
    """Download best audio from YouTube via WARP proxy."""
    out_template = os.path.join(out_dir, "audio.%(ext)s")
    out_template_mp3 = os.path.join(out_dir, "audio_dl.%(ext)s")

    # WARP proxy routes through Cloudflare IPs — bypasses YouTube's cloud IP block
    strategies = [
        ["--proxy", WARP_PROXY, "--extractor-args", "youtube:player_client=web"],
        ["--proxy", WARP_PROXY, "--extractor-args", "youtube:player_client=tv"],
        ["--proxy", WARP_PROXY, "--extractor-args", "youtube:player_client=ios"],
        # fallback without proxy (works locally, may fail on cloud)
        ["--extractor-args", "youtube:player_client=tv"],
        ["--extractor-args", "youtube:player_client=ios"],
    ]

    errors = []
    for strategy in strategies:
        try:
            result = _run_yt_dlp(strategy, out_template, "wav", url)
            if result.returncode == 0 and list(Path(out_dir).glob("audio.*")):
                break
            result2 = _run_yt_dlp(strategy, out_template_mp3, "mp3", url)
            if result2.returncode == 0 and list(Path(out_dir).glob("audio_dl.*")):
                mp3_path = str(list(Path(out_dir).glob("audio_dl.*"))[0])
                wav_path = os.path.join(out_dir, "audio.wav")
                subprocess.run(
                    ["ffmpeg", "-y", "-i", mp3_path, "-ar", "16000", "-ac", "1", wav_path],
                    check=True, capture_output=True
                )
                break
            errors.append(result.stderr + "\n" + result2.stderr)
        except subprocess.TimeoutExpired:
            errors.append(f"Timeout for strategy: {strategy}")
    else:
        raise RuntimeError("yt-dlp failed:\n" + "\n---\n".join(errors))

    wav_files = list(Path(out_dir).glob("audio.*"))
    if not wav_files:
        raise RuntimeError("yt-dlp produced no output file.")
    wav_path = str(wav_files[0])
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
    return _split_wav(wav_path, tmp_dir)