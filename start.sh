#!/bin/bash

# Start FastAPI backend in the background on the internal port
echo "Starting FastAPI backend..."
uvicorn backend_api:app --host 127.0.0.1 --port 8003 &

# Wait briefly for backend to initialize
sleep 3

# Start Next.js frontend in the foreground
echo "Starting Next.js frontend..."
cd frontend
export PORT=${PORT:-3000}
npm start
