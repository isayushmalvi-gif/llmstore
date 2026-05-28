from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class DeploymentStatus(str, Enum):
    PENDING = "PENDING"
    DOWNLOADING = "DOWNLOADING"
    STARTING = "STARTING"
    RUNNING = "RUNNING"
    STOPPING = "STOPPING"
    STOPPED = "STOPPED"
    FAILED = "FAILED"

class DeploymentRequest(BaseModel):
    model_id: str
    ollama_id: str
    model_name: str
    quantization: Optional[str] = "Q4_K_M"

class DeploymentInfo(BaseModel):
    id: str
    model_id: str
    model_name: str
    ollama_id: str
    status: DeploymentStatus
    port: int
    created_at: str
    updated_at: str
    logs: List[str] = []
    error: Optional[str] = None
    pid: Optional[int] = None
