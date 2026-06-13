#!/usr/bin/env bash
# start_backend.sh — Start the FastAPI backend server
set -e
cd "$(dirname "$0")/backend"

if [ ! -f ".env" ]; then
  echo "⚠️  No .env found. Copying from .env.example..."
  cp .env.example .env
  echo "📝 Please edit backend/.env and add your API keys, then re-run."
  exit 1
fi

echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo "🚀 Starting FastAPI backend on http://localhost:8000"
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
