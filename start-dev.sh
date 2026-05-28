#!/bin/bash
# LLMStore Development Start Script

echo "Starting LLMStore in development mode..."

# Start Ollama
ollama serve &
OLLAMA_PID=$!
echo "✅ Ollama started (PID: $OLLAMA_PID)"
sleep 2

# Start Backend
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"
sleep 2

# Start Frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   LLMStore Development Mode Ready   ║"
echo "╠══════════════════════════════════════╣"
echo "║  Frontend:  http://localhost:3000   ║"
echo "║  Backend:   http://localhost:8000   ║"
echo "║  API Docs:  http://localhost:8000/docs ║"
echo "║  Ollama:    http://localhost:11434  ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait and cleanup on exit
trap "kill $OLLAMA_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo Stopped!" INT
wait
