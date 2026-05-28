from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import json
import os
from app.models.hardware import HardwareProfile
from app.services.hardware_scanner import hardware_scanner

router = APIRouter()

def load_models():
    catalog_path = os.path.join(
        os.path.dirname(__file__),
        "../../../models_catalog/models.json"
    )
    with open(catalog_path, "r") as f:
        return json.load(f)

def get_compatibility(model: dict, hw: dict) -> dict:
    ram = hw.get("ram_gb", 0)
    vram = hw.get("vram_gb", 0)
    storage = hw.get("storage_gb", 0)
    has_gpu = hw.get("has_gpu", False)

    issues = []
    score = 100

    # Check RAM
    if ram < model["min_ram_gb"]:
        issues.append(f"Need {model['min_ram_gb']}GB RAM, have {ram}GB")
        score -= 50

    # Check VRAM
    if has_gpu and vram < model["min_vram_gb"]:
        issues.append(f"Need {model['min_vram_gb']}GB VRAM, have {vram}GB")
        score -= 30
    elif not has_gpu and model["min_vram_gb"] > 0:
        issues.append("No GPU - will run on CPU (slower)")
        score -= 20

    # Check Storage
    if storage < model["size_gb"] + 5:
        issues.append(f"Need {model['size_gb'] + 5}GB free storage")
        score -= 20

    if score >= 80:
        status = "COMPATIBLE"
        color = "green"
    elif score >= 50:
        status = "POSSIBLE"
        color = "yellow"
    else:
        status = "INCOMPATIBLE"
        color = "red"

    return {
        "status": status,
        "color": color,
        "score": max(score, 0),
        "issues": issues
    }

@router.get("/models")
async def get_models(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    compatible_only: bool = Query(False)
):
    try:
        models = load_models()
        hw_profile = hardware_scanner.scan()
        hw = {
            "ram_gb": hw_profile.ram.total_gb,
            "vram_gb": hw_profile.total_vram_gb,
            "storage_gb": hw_profile.storage.free_gb,
            "has_gpu": hw_profile.has_gpu
        }

        result = []
        for model in models:
            compat = get_compatibility(model, hw)
            model_data = {**model, "compatibility": compat}

            if category and model["category"].lower() != category.lower():
                continue
            if search and search.lower() not in model["name"].lower() and search.lower() not in model["description"].lower():
                continue
            if compatible_only and compat["status"] == "INCOMPATIBLE":
                continue

            result.append(model_data)

        result.sort(key=lambda x: (
            x["compatibility"]["score"],
            x["benchmark_score"]
        ), reverse=True)

        return {
            "total": len(result),
            "hardware": hw,
            "models": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models/categories")
async def get_categories():
    models = load_models()
    cats = list(set(m["category"] for m in models))
    return {"categories": sorted(cats)}

@router.get("/models/recommended")
async def get_recommended():
    try:
        models = load_models()
        hw_profile = hardware_scanner.scan()
        hw = {
            "ram_gb": hw_profile.ram.total_gb,
            "vram_gb": hw_profile.total_vram_gb,
            "storage_gb": hw_profile.storage.free_gb,
            "has_gpu": hw_profile.has_gpu
        }
        result = []
        for model in models:
            compat = get_compatibility(model, hw)
            if compat["status"] == "COMPATIBLE" and model.get("featured"):
                result.append({**model, "compatibility": compat})
        result.sort(key=lambda x: x["benchmark_score"], reverse=True)
        return {"recommended": result[:6]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models/{model_id}")
async def get_model(model_id: str):
    models = load_models()
    hw_profile = hardware_scanner.scan()
    hw = {
        "ram_gb": hw_profile.ram.total_gb,
        "vram_gb": hw_profile.total_vram_gb,
        "storage_gb": hw_profile.storage.free_gb,
        "has_gpu": hw_profile.has_gpu
    }
    for model in models:
        if model["id"] == model_id:
            compat = get_compatibility(model, hw)
            return {**model, "compatibility": compat}
    raise HTTPException(status_code=404, detail="Model not found")
