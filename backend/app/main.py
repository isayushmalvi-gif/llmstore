from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.api.routes import hardware, models, deployments, chat, monitoring
import subprocess, threading, time, os

def auto_start_ollama():
    time.sleep(3)
    try:
        import requests
        requests.get("http://localhost:11434", timeout=2)
        return
    except: pass
    try:
        subprocess.Popen(
            ["ollama", "serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True
        )
    except: pass

app = FastAPI(title=settings.APP_NAME, version=settings.VERSION)

@app.on_event("startup")
async def startup():
    threading.Thread(target=auto_start_ollama, daemon=True).start()

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

frontend_dist = "/opt/llmstore/frontend/dist"

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/")
async def index():
    index_path = frontend_dist + "/index.html"
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"status": "running"}

if os.path.exists(frontend_dist + "/assets"):
    app.mount(
        "/assets",
        StaticFiles(directory=frontend_dist + "/assets"),
        name="assets"
    )

@app.get("/{path:path}")
async def spa(path: str):
    f = frontend_dist + "/" + path
    if os.path.exists(f):
        return FileResponse(f)
    return FileResponse(frontend_dist + "/index.html")
