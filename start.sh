#!/bin/bash
set -e

echo "============================================"
echo "  MedShield Unified Server Starting..."
echo "============================================"

# Start FastAPI backend in the background
echo "[1/2] Starting FastAPI backend on port 8003..."
cd /app
uvicorn backend_api:app --host 0.0.0.0 --port 8003 --log-level info &
BACKEND_PID=$!

# Wait for backend to be healthy
echo "[*] Waiting for backend to initialize..."
sleep 5

# Verify backend is alive
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "[✓] FastAPI backend is running (PID: $BACKEND_PID)"
else
    echo "[✗] FastAPI backend FAILED to start! Check logs above."
    exit 1
fi

# Start Next.js frontend on Render's assigned PORT
echo "[2/2] Starting Next.js frontend on port ${PORT:-3000}..."
cd /app/frontend
npx next start -p ${PORT:-3000}
