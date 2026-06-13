# 🎬 AI Video Assistant v2

A production-grade full-stack AI application that **transcribes**, **summarises**, and lets you **chat** with any YouTube video or local audio/video file using a full agentic RAG pipeline.

---

## ✨ What's New vs Original

| Feature | Original | v2 |
|---|---|---|
| Frontend | Streamlit | React + Tailwind + Framer Motion |
| Transcription | Local Whisper (heavy) | **Groq Whisper API (free, fast)** |
| Embeddings | HuggingFace sentence-transformers | **Google Gemini Embedding 2 Preview** |
| LLM | Mistral | Mistral (same, kept) |
| Vector Store | ChromaDB | ChromaDB (same, kept) |
| Backend | Streamlit only | **FastAPI + SSE streaming** |
| Outputs | Raw text | **Structured JSON** (owner, deadline, priority, rationale…) |
| Pipeline visibility | Sidebar dots | **Live streaming pipeline dashboard** |
| Chat | Basic Q&A | **RAG chat with source chunk visibility** |

---

## 🏗️ Architecture

```
┌─────────────────────────────────┐    ┌──────────────────────────────────┐
│         React Frontend          │    │          FastAPI Backend          │
│  Landing · Analysis · Chat      │◄──►│                                   │
│  Framer Motion animations       │    │  POST /api/process  → session_id  │
│  Real-time SSE pipeline         │    │  GET  /api/stream/{id} → SSE      │
│  Tabbed structured insights     │    │  POST /api/chat/{id} → RAG answer │
└─────────────────────────────────┘    └──────────────────────────────────┘
                                                       │
                         ┌─────────────────────────────┼──────────────────────────┐
                         ▼                             ▼                          ▼
              ┌──────────────────┐         ┌──────────────────┐       ┌──────────────────┐
              │ utils/            │         │ core/             │       │ core/             │
              │ audio_processor  │         │ transcriber       │       │ rag_engine        │
              │ yt-dlp + ffmpeg  │         │ Groq Whisper API  │       │ Gemini Embed 2    │
              │ → WAV chunks     │         │ → transcript      │       │ + ChromaDB + MMR  │
              └──────────────────┘         └──────────────────┘       └──────────────────┘
                                                       │
                                           ┌──────────────────────┐
                                           │ core/summarizer       │
                                           │ core/extractor        │
                                           │ Mistral large-latest  │
                                           │ → JSON insights       │
                                           └──────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- `ffmpeg` installed system-wide  
  → macOS: `brew install ffmpeg`  
  → Ubuntu: `sudo apt install ffmpeg`  
  → Windows: [ffmpeg.org](https://ffmpeg.org/download.html)

### 1. Get API Keys (all free tier)

| Key | Where to get | Purpose |
|---|---|---|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) | Whisper transcription (free, fast) |
| `MISTRAL_API_KEY` | [console.mistral.ai](https://console.mistral.ai) | Summarisation + RAG LLM |
| `GOOGLE_API_KEY` | [aistudio.google.com](https://aistudio.google.com/apikey) | Gemini Embedding 2 Preview |

### 2. Configure backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your three API keys
```

### 3. Start backend

```bash
# From project root
bash start_backend.sh
# → running on http://localhost:8000
```

### 4. Start frontend

```bash
# In a new terminal, from project root
bash start_frontend.sh
# → running on http://localhost:3000
```

### 5. Open the app

Visit **http://localhost:3000** and paste a YouTube URL.

---

## 📁 Project Structure

```
ai-video-assistant/
├── backend/
│   ├── api/
│   │   └── main.py           FastAPI app + SSE streaming
│   ├── core/
│   │   ├── transcriber.py    Groq Whisper API
│   │   ├── summarizer.py     Mistral summarisation
│   │   ├── extractor.py      JSON insight extraction
│   │   └── rag_engine.py     Gemini Embedding + ChromaDB RAG
│   ├── utils/
│   │   └── audio_processor.py  yt-dlp + ffmpeg audio handling
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx   Hero, features, how it works
│   │   │   └── AnalysisPage.jsx  Main app page
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── PipelinePanel.jsx
│   │   │   ├── SummaryCard.jsx
│   │   │   ├── ActionItemsCard.jsx
│   │   │   ├── InsightCards.jsx  (Decisions + Questions)
│   │   │   └── ChatPanel.jsx
│   │   ├── hooks/
│   │   │   └── useVideoAnalysis.js  Pipeline + SSE + chat state
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── start_backend.sh
├── start_frontend.sh
└── README.md
```

---

## 🔧 API Reference

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/process` | Start pipeline `{source, language}` → `{session_id}` |
| `GET` | `/api/stream/{id}` | SSE stream of pipeline events |
| `GET` | `/api/result/{id}` | Full result JSON |
| `POST` | `/api/chat/{id}` | RAG chat `{question, include_sources}` → `{answer, sources}` |
| `DELETE` | `/api/session/{id}` | Cleanup session |
| `GET` | `/api/health` | Health check |

### SSE Event Types

| Type | Data | Description |
|---|---|---|
| `step_start` | `{step, label}` | A pipeline step started |
| `step_done` | `{step, info}` | A step finished |
| `progress` | `{step, current, total, pct}` | Transcription progress |
| `transcript` | `{text}` | Full transcript ready |
| `title` | `{text}` | Generated title |
| `summary` | `{text}` | Summary ready |
| `extractions` | `{action_items, key_decisions, open_questions}` | Structured JSON |
| `done` | `{session_id}` | All done, RAG ready |
| `error` | `{message}` | Pipeline error |

---

## 🎨 Tech Stack

**Frontend:** React 18 · React Router · Tailwind CSS · Framer Motion · Vite  
**Backend:** FastAPI · Uvicorn · Python 3.10+  
**Transcription:** Groq Whisper large-v3 (free API)  
**LLM:** Mistral large-latest via LangChain  
**Embeddings:** Google Gemini text-embedding-004 (Gemini Embedding 2 Preview)  
**Vector Store:** ChromaDB (in-memory, session-scoped)  
**Audio:** yt-dlp + ffmpeg + pydub  
**RAG:** LangChain LCEL · MMR retrieval · ChromaDB  

---

## 💡 Tips

- For Hinglish, select "Hinglish → English" — Groq transcribes in Hindi and the app auto-translates to English before RAG indexing.
- The transcript is chunked into 1000-token pieces with 200-token overlap for optimal retrieval.
- The RAG uses **MMR (Maximum Marginal Relevance)** to avoid repetitive context in answers.
- Session data is in-memory; restart the backend to clear all sessions.
