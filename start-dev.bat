@echo off
title LLMStore Development

echo Starting LLMStore Development Mode...
echo.

start "Ollama" cmd /k "ollama serve"
timeout /t 3 /nobreak >nul

start "LLMStore Backend" cmd /k "cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 3 /nobreak >nul

start "LLMStore Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ╔══════════════════════════════════════╗
echo ║   LLMStore Development Mode Ready   ║
echo ╠══════════════════════════════════════╣
echo ║  Frontend:  http://localhost:3000   ║
echo ║  Backend:   http://localhost:8000   ║
echo ║  Ollama:    http://localhost:11434  ║
echo ╚══════════════════════════════════════╝
echo.
echo 3 windows opened - close them to stop
pause
