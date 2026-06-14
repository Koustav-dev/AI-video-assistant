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


def get_youtube_transcript(url: str, language: str = "en") -> tuple[str | None, str | None]:
    """
    Try to fetch existing YouTube captions via youtube-transcript-api.
    Returns (text, None) on success, or (None, error_message) on failure
    so the caller can decide whether to fall back to audio download and
    can log/show *why* it failed.
    """
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError:
        return None, "youtube-transcript-api not installed"

    # Extract video ID from various YouTube URL formats
    video_id = None
    if "youtu.be/" in url:
        video_id = url.split("youtu.be/")[1].split("?")[0].split("&")[0]
    elif "v=" in url:
        video_id = url.split("v=")[1].split("&")[0]
    if not video_id:
        return None, f"Could not extract video ID from URL: {url}"

    try:
        proxies = _get_proxies()
        ytt = YouTubeTranscriptApi(
            proxies={"http": proxies[0], "https": proxies[0]} if proxies else None
        )
        # Prefer requested language, fall back to any available, then auto-translate to English
        errors_inner = []
        proxy_list = proxies if proxies else [None]
        for proxy in proxy_list:
            try:
                ytt = YouTubeTranscriptApi(
                    proxies={"http": proxy, "https": proxy} if proxy else None
                )
                try:
                    fetched = ytt.fetch(video_id, languages=[language, "en"])
                except Exception:
                    transcript_list = ytt.list(video_id)
                    try:
                        t = transcript_list.find_transcript([language, "en"])
                    except Exception:
                        t = next(iter(transcript_list))
                        if t.is_translatable:
                            t = t.translate("en")
                    fetched = t.fetch()
                text = " ".join(snippet.text for snippet in fetched).strip()
                if text:
                    return text, None
                return None, "Transcript was empty"
            except Exception as e:
                errors_inner.append(f"proxy={proxy}: {type(e).__name__}: {e}")
        return None, " | ".join(errors_inner)
    except Exception as e:
        return None, f"{type(e).__name__}: {e}"


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


def _get_proxies() -> list:
    """Read comma-separated proxy URLs from env var WEBSHARE_PROXIES.
    Format: http://user:pass@host:port,http://user:pass@host2:port2,...
    """
    raw = os.getenv("WEBSHARE_PROXIES", "")
    if not raw:
        # fallback: single proxy env var
        single = os.getenv("WEBSHARE_PROXY", "")
        return [single] if single else []
    return [p.strip() for p in raw.split(",") if p.strip()]


def _strategies() -> list:
    """Different yt-dlp client/cookie/proxy combos to try in order."""
    cookies = _cookie_args()
    proxies = _get_proxies()
    base_clients = [
        ["--extractor-args", "youtube:player_client=tv"],
        ["--extractor-args", "youtube:player_client=ios"],
        *([cookies + ["--extractor-args", "youtube:player_client=web"]] if cookies else []),
    ]
    if proxies:
        # for each proxy, try web client
        proxy_strategies = [
            ["--proxy", p, "--extractor-args", "youtube:player_client=web"]
            for p in proxies
        ]
        return proxy_strategies + base_clients
    return base_clients


def _run_yt_dlp(extra_args: list, out_template: str, audio_format: str, url: str):
    cmd = [
        "yt-dlp",
        *extra_args,
        "--extract-audio",
        "--audio-format", audio_format,
        "--audio-quality", "0",
        "--output", out_template,
        "--no-playlist",
        url,
    ]
    return subprocess.run(cmd, capture_output=True, text=True)


def _download_youtube(url: str, out_dir: str) -> str:
    """Download best audio from YouTube as a WAV file.
    Tries several client strategies since YouTube's bot-detection is inconsistent."""
    out_template = os.path.join(out_dir, "audio.%(ext)s")
    out_template_mp3 = os.path.join(out_dir, "audio_dl.%(ext)s")

    errors = []
    for strategy in _strategies():
        # try wav directly
        result = _run_yt_dlp(strategy, out_template, "wav", url)
        if result.returncode == 0 and list(Path(out_dir).glob("audio.*")):
            break
        # try mp3 fallback with same strategy
        result2 = _run_yt_dlp(strategy, out_template_mp3, "mp3", url)
        if result2.returncode == 0 and list(Path(out_dir).glob("audio_dl.*")):
            mp3_files = list(Path(out_dir).glob("audio_dl.*"))
            mp3_path = str(mp3_files[0])
            wav_path = os.path.join(out_dir, "audio.wav")
            subprocess.run(
                ["ffmpeg", "-y", "-i", mp3_path, "-ar", "16000", "-ac", "1", wav_path],
                check=True, capture_output=True
            )
            break
        errors.append(result.stderr + "\n" + result2.stderr)
    else:
        raise RuntimeError("yt-dlp failed with all client strategies:\n" + "\n---\n".join(errors))

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