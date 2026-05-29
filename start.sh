#!/bin/bash

# ============================================
# LLMStore - One Command Startup Script
# ============================================

echo ""
echo "🏪 Starting LLMStore..."
echo "================================"

# Kill old processes
pkill -f uvicorn 2>/dev/null
pkill -f vite 2>/dev/null
sleep 2

# Fix .env
cd /workspaces/llmstore/frontend
echo "VITE_API_URL=https://$(echo $CODESPACE_NAME)-8000.$(echo $GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN)" > .env
echo "VITE_OLLAMA_URL=https://$(echo $CODESPACE_NAME)-11434.$(echo $GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN)" >> .env
echo "✅ .env updated!"

# Start Ollama
if curl -s http://localhost:11434 > /dev/null 2>&1; then
    echo "✅ Ollama already running!"
else
    ollama serve &
    sleep 3
    echo "✅ Ollama started!"
fi

# Start Backend
cd /workspaces/llmstore/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
sleep 3

# Check Backend
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend running!"
else
    echo "❌ Backend failed!"
fi

# Start Frontend
cd /workspaces/llmstore/frontend
npm run dev &
sleep 5

# Check Frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend running!"
else
    echo "❌ Frontend failed!"
fi

echo ""
echo "================================"
echo "🎉 LLMStore is Ready!"
echo "================================"
echo ""
echo "🌐 Open this URL in browser:"
echo "https://$(echo $CODESPACE_NAME)-3000.$(echo $GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN)"
echo ""
echo "📚 API Docs:"
echo "https://$(echo $CODESPACE_NAME)-8000.$(echo $GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN)/docs"
echo ""
echo "================================"
echo "Make sure Port 3000 is PUBLIC!"
echo "PORTS tab → 3000 → Right click → Public"
echo "================================"

# Keep script running
wait
