from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import httpx
import json

router = APIRouter()

OLLAMA_URL = "http://localhost:11434"

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str
    prompt: str
    stream: Optional[bool] = False
    system: Optional[str] = None

class ModelsResponse(BaseModel):
    models: list

@router.post("/chat/generate")
async def generate(request: ChatRequest):
    try:
        prompt = ""
        if request.system:
            prompt = request.system + "\n\n"
        prompt += request.prompt

        if request.stream:
            async def stream_response():
                async with httpx.AsyncClient(timeout=120) as client:
                    async with client.stream(
                        "POST",
                        OLLAMA_URL + "/api/generate",
                        json={
                            "model": request.model,
                            "prompt": prompt,
                            "stream": True
                        }
                    ) as response:
                        async for chunk in response.aiter_bytes():
                            yield chunk

            return StreamingResponse(
                stream_response(),
                media_type="application/x-ndjson"
            )
        else:
            async with httpx.AsyncClient(timeout=120) as client:
                response = await client.post(
                    OLLAMA_URL + "/api/generate",
                    json={
                        "model": request.model,
                        "prompt": prompt,
                        "stream": False
                    }
                )
                return response.json()

    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Ollama service not running"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/models")
async def get_models():
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(OLLAMA_URL + "/api/tags")
            data = response.json()
            models = [m["name"] for m in data.get("models", [])]
            return {
                "models": models,
                "ollama_running": True
            }
    except:
        return {
            "models": [],
            "ollama_running": False
        }
