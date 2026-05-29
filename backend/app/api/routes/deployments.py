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

@router.get("/installed-models")
async def get_installed_models():
    import requests as req
    try:
        r = req.get(
            "http://localhost:11434/api/tags",
            timeout=3
        )
        if r.status_code == 200:
            models = r.json().get("models", [])
            result = []
            for m in models:
                result.append({
                    "name": m.get("name", ""),
                    "size_gb": round(m.get("size", 0) / 1e9, 1),
                    "modified_at": m.get("modified_at", "")
                })
            return {"models": result, "total": len(result)}
        return {"models": [], "total": 0}
    except Exception as e:
        return {"models": [], "total": 0, "error": str(e)}

@router.delete("/installed-models/{model_name:path}")
async def delete_installed_model(model_name: str):
    try:
        import requests as req
        r = req.delete(
            "http://localhost:11434/api/delete",
            json={"name": model_name},
            timeout=30
        )
        if r.status_code == 200:
            return {
                "success": True,
                "message": f"{model_name} removed!"
            }
        return {
            "success": False,
            "message": "Failed to remove model"
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }

@router.get("/installed-models")
async def get_installed_models():
    import requests as req
    try:
        r = req.get(
            "http://localhost:11434/api/tags",
            timeout=3
        )
        if r.status_code == 200:
            models = r.json().get("models", [])
            result = []
            for m in models:
                result.append({
                    "name": m.get("name", ""),
                    "size_gb": round(m.get("size", 0) / 1e9, 1),
                    "modified_at": m.get("modified_at", "")
                })
            return {"models": result, "total": len(result)}
        return {"models": [], "total": 0}
    except Exception as e:
        return {"models": [], "total": 0, "error": str(e)}

@router.delete("/installed-models/{model_name:path}")
async def delete_installed_model(model_name: str):
    try:
        import requests as req
        r = req.delete(
            "http://localhost:11434/api/delete",
            json={"name": model_name},
            timeout=30
        )
        if r.status_code == 200:
            return {
                "success": True,
                "message": f"{model_name} removed!"
            }
        return {
            "success": False,
            "message": "Failed to remove model"
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }



@router.post("/running-models/{model_name:path}/offload")
async def offload_model(model_name: str):
    try:
        import requests as req
        # Offload by setting keep_alive to 0
        r = req.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model_name,
                "keep_alive": 0
            },
            timeout=10
        )
        return {
            "success": True,
            "message": f"{model_name} offloaded from memory!"
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }

@router.post("/running-models/offload-all")
async def offload_all_models():
    try:
        import requests as req
        # Get running models
        r = req.get(
            "http://localhost:11434/api/ps",
            timeout=3
        )
        if r.status_code != 200:
            return {
                "success": False,
                "message": "Could not get running models"
            }

        models = r.json().get("models", [])
        offloaded = []

        for m in models:
            name = m.get("name", "")
            try:
                req.post(
                    "http://localhost:11434/api/generate",
                    json={
                        "model": name,
                        "keep_alive": 0
                    },
                    timeout=10
                )
                offloaded.append(name)
            except:
                pass

        return {
            "success": True,
            "offloaded": offloaded,
            "message": f"Offloaded {len(offloaded)} models!"
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }

@router.get("/running-models")
async def get_running_models_list():
    import requests as req
    result = []
    loaded_names = []

    # Step 1: Get models in RAM (/api/ps)
    try:
        r = req.get(
            "http://localhost:11434/api/ps",
            timeout=3
        )
        if r.status_code == 200:
            for m in r.json().get("models", []):
                name = m.get("name", "")
                loaded_names.append(name)
                result.append({
                    "name": name,
                    "size_gb": round(
                        m.get("size", 0) / 1e9, 1
                    ),
                    "vram_gb": round(
                        m.get("size_vram", 0) / 1e9, 1
                    ),
                    "status": "loaded"
                })
    except:
        pass

    # Step 2: Get ALL installed models (/api/tags)
    try:
        r = req.get(
            "http://localhost:11434/api/tags",
            timeout=3
        )
        if r.status_code == 200:
            for m in r.json().get("models", []):
                name = m.get("name", "")
                if name not in loaded_names:
                    result.append({
                        "name": name,
                        "size_gb": round(
                            m.get("size", 0) / 1e9, 1
                        ),
                        "vram_gb": 0,
                        "status": "installed"
                    })
    except:
        pass

    return {"models": result, "total": len(result)}
