#!/usr/bin/env bash
# start_frontend.sh — Start the React frontend dev server
set -e
cd "$(dirname "$0")/frontend"

echo "📦 Installing Node dependencies..."
npm install

echo "🚀 Starting React frontend on http://localhost:3000"
npm run dev
