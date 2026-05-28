from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.services.monitoring_service import monitoring_service
import asyncio
import json

router = APIRouter()

@router.get("/monitoring/stats")
async def get_stats():
    return monitoring_service.get_current_stats()

@router.get("/monitoring/stream")
async def stream_stats():
    async def generator():
        while True:
            stats = monitoring_service.get_current_stats()
            yield "data: " + json.dumps(stats) + "\n\n"
            await asyncio.sleep(3)
    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )
