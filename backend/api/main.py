"""
api/main.py  —  FastAPI backend for AI Video Assistant
Endpoints:
  POST /api/process        — start pipeline (returns session_id)
  GET  /api/stream/{sid}   — SSE stream of pipeline events
  GET  /api/result/{sid}   — get full result
  POST /api/chat/{sid}     — RAG chat
  GET  /api/chunks/{sid}   — get source chunks for last answer
  DELETE /api/session/{sid} — cleanup
"""
import os
import json
import uuid
import asyncio
import threading
from typing import Dict, Any, Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# ── Import core modules ────────────────────────────────────────────────────────
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from utils.audio_processor import process_input
from core.transcriber import transcribe_all
from core.summarizer import summarize, generate_title
from core.extractor import (
    extract_action_items,
    extract_key_decisions,
    extract_questions,
    safe_parse_json,
)
from core.rag_engine import build_rag_chain, ask_question, get_relevant_chunks

app = FastAPI(title="AI Video Assistant API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory session store ────────────────────────────────────────────────────
sessions: Dict[str, Dict[str, Any]] = {}
event_queues: Dict[str, asyncio.Queue] = {}


# ── Request models ─────────────────────────────────────────────────────────────
class ProcessRequest(BaseModel):
    source: str
    language: str = "english"


class ChatRequest(BaseModel):
    question: str
    include_sources: bool = False


# ── SSE helper ────────────────────────────────────────────────────────────────
def _emit(queue: asyncio.Queue, event_type: str, data: Any, loop=None):
    payload = json.dumps({"type": event_type, "data": data})
    if loop:
        asyncio.run_coroutine_threadsafe(queue.put(payload), loop)
    else:
        queue.put_nowait(payload)


# ── Pipeline runner (runs in thread) ──────────────────────────────────────────
def _run_pipeline(session_id: str, source: str, language: str, loop):
    q = event_queues[session_id]

    def emit(event_type, data):
        _emit(q, event_type, data, loop)

    try:
        # ── Step 1: Audio processing ──────────────────────────────────────────
        emit("step_start", {"step": "audio", "label": "Downloading & Processing Audio"})
        chunks = process_input(source)
        emit("step_done", {"step": "audio", "info": f"{len(chunks)} chunk(s) ready"})

        # ── Step 2: Transcription ─────────────────────────────────────────────
        emit("step_start", {"step": "transcript", "label": "Transcribing Audio"})
        total_chunks = len(chunks)

        def progress_cb(current, total):
            emit("progress", {"step": "transcript", "current": current, "total": total,
                              "pct": round(current / total * 100)})

        transcript = transcribe_all(chunks, language, progress_callback=progress_cb)
        emit("step_done", {
            "step": "transcript",
            "info": f"{len(transcript.split())} words transcribed"
        })
        emit("transcript", {"text": transcript})

        # ── Step 3: Title generation ──────────────────────────────────────────
        emit("step_start", {"step": "title", "label": "Generating Title"})
        title = generate_title(transcript)
        emit("step_done", {"step": "title", "info": title})
        emit("title", {"text": title})

        # ── Step 4: Summarisation ─────────────────────────────────────────────
        emit("step_start", {"step": "summary", "label": "Summarising Content"})
        summary = summarize(transcript)
        emit("step_done", {"step": "summary", "info": "Summary ready"})
        emit("summary", {"text": summary})

        # ── Step 5: Extraction ────────────────────────────────────────────────
        emit("step_start", {"step": "extract", "label": "Extracting Insights"})
        action_items_raw = extract_action_items(transcript)
        decisions_raw = extract_key_decisions(transcript)
        questions_raw = extract_questions(transcript)

        action_items = safe_parse_json(action_items_raw)
        decisions = safe_parse_json(decisions_raw)
        questions = safe_parse_json(questions_raw)

        emit("step_done", {"step": "extract", "info":
             f"{len(action_items)} actions, {len(decisions)} decisions, {len(questions)} questions"})
        emit("extractions", {
            "action_items": action_items,
            "key_decisions": decisions,
            "open_questions": questions,
        })

        # ── Step 6: RAG Engine ────────────────────────────────────────────────
        emit("step_start", {"step": "rag", "label": "Building Knowledge Base"})
        rag_chain = build_rag_chain(transcript)
        emit("step_done", {"step": "rag", "info": "RAG engine ready"})

        # ── Store result ──────────────────────────────────────────────────────
        sessions[session_id]["result"] = {
            "title": title,
            "transcript": transcript,
            "summary": summary,
            "action_items": action_items,
            "key_decisions": decisions,
            "open_questions": questions,
            "rag_chain": rag_chain,
        }
        sessions[session_id]["status"] = "done"
        emit("done", {"session_id": session_id})

    except Exception as e:
        sessions[session_id]["status"] = "error"
        emit("error", {"message": str(e)})
    finally:
        emit("__end__", {})


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.post("/api/process")
async def start_process(req: ProcessRequest):
    """Start the processing pipeline, return session_id."""
    if not req.source.strip():
        raise HTTPException(400, "source is required")

    session_id = str(uuid.uuid4())
    sessions[session_id] = {"status": "running", "result": None}
    event_queues[session_id] = asyncio.Queue()

    loop = asyncio.get_event_loop()
    thread = threading.Thread(
        target=_run_pipeline,
        args=(session_id, req.source, req.language, loop),
        daemon=True
    )
    thread.start()

    return {"session_id": session_id}


@app.get("/api/stream/{session_id}")
async def stream_events(session_id: str):
    """SSE endpoint — streams pipeline events to the frontend."""
    if session_id not in event_queues:
        raise HTTPException(404, "Session not found")

    queue = event_queues[session_id]

    async def event_generator():
        while True:
            try:
                payload = await asyncio.wait_for(queue.get(), timeout=60.0)
                if payload == json.dumps({"type": "__end__", "data": {}}):
                    yield f"data: {payload}\n\n"
                    break
                yield f"data: {payload}\n\n"
            except asyncio.TimeoutError:
                yield "data: {\"type\":\"ping\",\"data\":{}}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


@app.get("/api/result/{session_id}")
async def get_result(session_id: str):
    """Return the full result (minus the rag_chain object)."""
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    if session["status"] != "done":
        raise HTTPException(202, "Processing not complete")

    r = session["result"]
    return {
        "title": r["title"],
        "transcript": r["transcript"],
        "summary": r["summary"],
        "action_items": r["action_items"],
        "key_decisions": r["key_decisions"],
        "open_questions": r["open_questions"],
    }


@app.post("/api/chat/{session_id}")
async def chat(session_id: str, req: ChatRequest):
    """RAG chat with the session transcript."""
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    if session["status"] != "done" or not session.get("result"):
        raise HTTPException(400, "Pipeline not complete yet")

    rag_chain = session["result"]["rag_chain"]
    answer = ask_question(rag_chain, req.question)

    sources = []
    if req.include_sources:
        sources = get_relevant_chunks(rag_chain, req.question)

    return {"answer": answer, "sources": sources}


@app.delete("/api/session/{session_id}")
async def delete_session(session_id: str):
    sessions.pop(session_id, None)
    event_queues.pop(session_id, None)
    return {"deleted": True}


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)