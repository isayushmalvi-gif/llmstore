
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import hardware, models, deployments, chat, monitoring
import subprocess
import threading
import time

def start_ollama_background():
    """Auto-start Ollama when LLMStore starts"""
    time.sleep(3)
    try:
        import requests
        r = requests.get("http://localhost:11434", timeout=2)
        print("✅ Ollama already running!")
        return
    except:
        pass

    print("🤖 Auto-starting Ollama...")
    try:
        subprocess.Popen(
            ["ollama", "serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True
        )
        print("✅ Ollama started!")
    except FileNotFoundError:
        print("⚠️ Ollama not installed!")
    except Exception as e:
        print(f"⚠️ Ollama start error: {e}")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Enterprise AI Model Deployment Platform"
)

@app.on_event("startup")
async def startup_event():
    thread = threading.Thread(
        target=start_ollama_background,
        daemon=True
    )
    thread.start()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hardware.router, prefix="/api/v1", tags=["Hardware"])
app.include_router(models.router, prefix="/api/v1", tags=["Models"])
app.include_router(deployments.router, prefix="/api/v1", tags=["Deployments"])
app.include_router(chat.router, prefix="/api/v1", tags=["Chat"])
app.include_router(monitoring.router, prefix="/api/v1", tags=["Monitoring"])

@app.get("/")
async def root():
    return {
        "product": "LLMStore",
        "version": settings.VERSION,
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
