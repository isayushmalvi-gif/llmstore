from fastapi import APIRouter, HTTPException
from app.services.hardware_scanner import hardware_scanner
from app.models.hardware import HardwareProfile

router = APIRouter()

@router.get("/hardware", response_model=HardwareProfile)
async def get_hardware():
    try:
        profile = hardware_scanner.scan()
        return profile
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Hardware scan failed: {str(e)}"
        )

@router.get("/hardware/quick")
async def get_quick_status():
    try:
        profile = hardware_scanner.scan()
        return {
            "status": profile.readiness_status,
            "score": profile.readiness_score,
            "has_gpu": profile.has_gpu,
            "total_vram_gb": profile.total_vram_gb,
            "ram_gb": profile.ram.total_gb
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
