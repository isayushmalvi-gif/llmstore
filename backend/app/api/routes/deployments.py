from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.deployment import DeploymentRequest, DeploymentInfo
from app.services.deployment_service import deployment_service
import asyncio
import json

router = APIRouter()

@router.post("/deployments")
async def create_deployment(request: DeploymentRequest):
    try:
        deployment_id = deployment_service.deploy(
            model_id=request.model_id,
            model_name=request.model_name,
            ollama_id=request.ollama_id
        )
        return {
            "deployment_id": deployment_id,
            "status": "PENDING",
            "message": f"Deployment started for {request.model_name}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/deployments")
async def get_deployments():
    deployments = deployment_service.get_all_deployments()
    ollama_running = deployment_service.is_ollama_running()
    running_models = deployment_service.get_running_models()
    return {
        "deployments": deployments,
        "ollama_running": ollama_running,
        "running_models": running_models,
        "total": len(deployments)
    }

@router.get("/deployments/status/ollama")
async def ollama_status():
    running = deployment_service.is_ollama_running()
    models = deployment_service.get_running_models() if running else []
    return {
        "ollama_running": running,
        "models": models,
        "endpoint": "http://localhost:11434" if running else None
    }

@router.get("/deployments/{deployment_id}")
async def get_deployment(deployment_id: str):
    deployment = deployment_service.get_deployment(deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return deployment

@router.get("/deployments/{deployment_id}/logs")
async def stream_logs(deployment_id: str):
    async def log_generator():
        last_index = 0
        max_wait = 300
        waited = 0
        while waited < max_wait:
            deployment = deployment_service.get_deployment(deployment_id)
            if not deployment:
                break
            logs = deployment.logs
            if len(logs) > last_index:
                new_logs = logs[last_index:]
                for log in new_logs:
                    data = json.dumps({"log": log, "status": deployment.status})
                    yield "data: " + data + "\n\n"
                last_index = len(logs)
            if deployment.status in ["RUNNING", "FAILED", "STOPPED"]:
                data = json.dumps({"log": "__DONE__", "status": deployment.status})
                yield "data: " + data + "\n\n"
                break
            await asyncio.sleep(1)
            waited += 1
    return StreamingResponse(
        log_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/deployments/{deployment_id}/stop")
async def stop_deployment(deployment_id: str):
    success = deployment_service.stop_deployment(deployment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return {"message": "Deployment stopped"}

@router.delete("/deployments/{deployment_id}")
async def delete_deployment(deployment_id: str):
    success = deployment_service.delete_deployment(deployment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return {"message": "Deployment deleted"}
