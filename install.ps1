# ============================================
# LLMStore - Windows Installer v1.0.0
# Run in PowerShell as Administrator
# Usage: Right-click -> Run as Administrator
# ============================================

$ErrorActionPreference = "Stop"
$INSTALL_DIR = "C:\LLMStore"
$BACKEND_PORT = 8000
$LOG_FILE = "C:\LLMStore_install.log"
$REPO_URL = "https://github.com/isayushmalvi-gif/llmstore"

# Colors
function Write-Step   { Write-Host "`n━━━ $args ━━━" -ForegroundColor Magenta }
function Write-Info   { Write-Host "[INFO]  $args" -ForegroundColor Cyan }
function Write-OK     { Write-Host "[OK]    $args" -ForegroundColor Green }
function Write-Warn   { Write-Host "[WARN]  $args" -ForegroundColor Yellow }
function Write-Fail   { Write-Host "[ERROR] $args" -ForegroundColor Red; exit 1 }

Clear-Host
Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║      LLMStore Installer v1.0.0             ║" -ForegroundColor Magenta
Write-Host "║  Enterprise AI Model Deployment Platform   ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# ============================================
# CHECK ADMINISTRATOR
# ============================================
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Fail "Please run as Administrator! Right-click PowerShell -> Run as Administrator"
}

# ============================================
# STEP 1: SYSTEM CHECK
# ============================================
Write-Step "Step 1/8: System Check"

$RAM = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB)
$DISK = [math]::Round((Get-PSDrive C).Free / 1GB)
$OS = (Get-CimInstance Win32_OperatingSystem).Caption
$CPU = (Get-CimInstance Win32_Processor).Name

Write-Host ""
Write-Host "  OS:         $OS" -ForegroundColor Green
Write-Host "  CPU:        $CPU" -ForegroundColor Green
Write-Host "  RAM:        ${RAM}GB" -ForegroundColor Green
Write-Host "  Disk Free:  ${DISK}GB" -ForegroundColor Green

$GPU = Get-CimInstance Win32_VideoController | Where-Object {$_.Name -like "*NVIDIA*"} | Select-Object -First 1
if ($GPU) {
    Write-Host "  GPU:        $($GPU.Name)" -ForegroundColor Green
    $HAS_GPU = $true
} else {
    Write-Host "  GPU:        No NVIDIA GPU (CPU mode)" -ForegroundColor Yellow
    $HAS_GPU = $false
}
Write-Host ""

if ($RAM -lt 4)  { Write-Fail "Minimum 4GB RAM required. Found: ${RAM}GB" }
if ($DISK -lt 20) { Write-Fail "Minimum 20GB free disk required. Found: ${DISK}GB" }

Write-OK "System check passed!"

# ============================================
# STEP 2: INSTALL CHOCOLATEY
# ============================================
Write-Step "Step 2/8: Setting up Package Manager"

if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Info "Installing Chocolatey..."
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString("https://community.chocolatey.org/install.ps1"))
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}
Write-OK "Chocolatey ready!"

# ============================================
# STEP 3: INSTALL DEPENDENCIES
# ============================================
Write-Step "Step 3/8: Installing Dependencies"

# Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Info "Installing Python 3.11..."
    choco install python311 -y --no-progress | Out-Null
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}
$pyVer = python --version 2>&1
Write-OK "Python: $pyVer"

# Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Info "Installing Node.js 20..."
    choco install nodejs-lts -y --no-progress | Out-Null
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}
$nodeVer = node --version 2>&1
Write-OK "Node.js: $nodeVer"

# Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Info "Installing Git..."
    choco install git -y --no-progress | Out-Null
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}
Write-OK "Git ready!"

# NSSM for service management
if (-not (Get-Command nssm -ErrorAction SilentlyContinue)) {
    Write-Info "Installing NSSM..."
    choco install nssm -y --no-progress | Out-Null
}
Write-OK "NSSM ready!"

# ============================================
# STEP 4: INSTALL OLLAMA
# ============================================
Write-Step "Step 4/8: Installing Ollama"

if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
    Write-Info "Downloading Ollama for Windows..."
    $ollamaUrl = "https://ollama.ai/download/OllamaSetup.exe"
    $installer = "$env:TEMP\OllamaSetup.exe"
    Invoke-WebRequest -Uri $ollamaUrl -OutFile $installer -UseBasicParsing
    Start-Process -FilePath $installer -Args "/S" -Wait
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}
Write-OK "Ollama ready!"

# ============================================
# STEP 5: SETUP LLMSTORE
# ============================================
Write-Step "Step 5/8: Setting up LLMStore"

# Clone or update
if (Test-Path $INSTALL_DIR) {
    Write-Info "Updating existing installation..."
    Set-Location $INSTALL_DIR
    git pull origin main 2>$null
} else {
    Write-Info "Cloning LLMStore..."
    git clone $REPO_URL $INSTALL_DIR
}

Set-Location $INSTALL_DIR

# Python virtual environment
Write-Info "Setting up Python environment..."
python -m venv venv
& "$INSTALL_DIR\venv\Scripts\pip" install --upgrade pip -q
& "$INSTALL_DIR\venv\Scripts\pip" install -r backend\requirements.txt -q

Write-OK "Python environment ready!"

# ============================================
# STEP 6: BUILD FRONTEND
# ============================================
Write-Step "Step 6/8: Building Frontend"

Set-Location "$INSTALL_DIR\frontend"

Write-Info "Installing frontend packages..."
npm install --silent

# Fix TypeScript errors
Write-Info "Fixing TypeScript compatibility..."
$fixScript = @"
import os, re

fixes = {
    "src/pages/Settings.tsx": [
        (
            'import {\n  Settings as SettingsIcon, Save, RefreshCw,\n  Server, Key, Bell,\n  CheckCircle, ExternalLink,\n  Cpu, Globe, Database\n} from "lucide-react"',
            'import {\n  Save, RefreshCw,\n  Server, Key, Bell,\n  CheckCircle, ExternalLink,\n  Globe, Database\n} from "lucide-react"'
        ),
    ],
    "src/pages/Monitoring.tsx": [
        (
            "formatter={(v: number) => [v + unit, label]}",
            "formatter={(v) => [String(v) + unit, label]}"
        ),
        (
            'labelFormatter={(l: string) => "Time: " + l}',
            'labelFormatter={(l) => "Time: " + String(l)}'
        ),
    ],
    "src/components/models/ModelCard.tsx": [
        (
            "HardDrive, Cpu, Zap, ChevronDown,\n  ChevronUp, Star, Download, ExternalLink",
            "HardDrive, Cpu, Zap, ChevronDown,\n  ChevronUp, Star, Download"
        ),
    ],
    "src/pages/ModelCatalog.tsx": [
        (
            "Search, Filter, Cpu, Zap,\n  HardDrive, Star, SlidersHorizontal",
            "Search, Filter, Cpu, Zap,\n  HardDrive, SlidersHorizontal"
        ),
    ],
}

for filepath, replacements in fixes.items():
    if os.path.exists(filepath):
        with open(filepath, "r") as f:
            content = f.read()
        for old, new in replacements:
            content = content.replace(old, new)
        with open(filepath, "w") as f:
            f.write(content)
        print(f"Fixed: {filepath}")

print("TypeScript fixes applied!")
"@
python -c $fixScript

# Create .env
"VITE_API_URL=`nVITE_OLLAMA_URL=" | Out-File -FilePath .env -Encoding UTF8

Write-Info "Building frontend..."
npm run build --silent

if (Test-Path "dist\assets") {
    Write-OK "Frontend built successfully!"
} else {
    Write-Fail "Frontend build failed!"
}

# ============================================
# STEP 7: CONFIGURE SERVICES
# ============================================
Write-Step "Step 7/8: Configuring Windows Services"

# Update backend main.py
$mainPy = @"
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
            stderr=subprocess.DEVNULL
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

frontend_dist = r"$INSTALL_DIRrontend\dist"

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/")
async def index():
    return FileResponse(frontend_dist + "/index.html")

if os.path.exists(frontend_dist + "/assets"):
    app.mount("/assets", StaticFiles(directory=frontend_dist + "/assets"), name="assets")

@app.get("/{path:path}")
async def spa(path: str):
    f = frontend_dist + "/" + path
    if os.path.exists(f): return FileResponse(f)
    return FileResponse(frontend_dist + "/index.html")
"@
$mainPy | Out-File -FilePath "$INSTALL_DIR\backend\app\main.py" -Encoding UTF8

# Remove old services
$services = @("LLMStore", "LLMStore-Backend", "LLMStore-Ollama")
foreach ($svc in $services) {
    if (Get-Service -Name $svc -ErrorAction SilentlyContinue) {
        Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
        nssm remove $svc confirm 2>$null
    }
}

# Install Ollama service
nssm install LLMStore-Ollama ollama serve | Out-Null
nssm set LLMStore-Ollama Start SERVICE_AUTO_START | Out-Null
nssm set LLMStore-Ollama DisplayName "LLMStore - Ollama AI" | Out-Null
nssm set LLMStore-Ollama AppEnvironmentExtra "OLLAMA_HOST=0.0.0.0" | Out-Null

# Install Backend service
$uvicorn = "$INSTALL_DIR\venv\Scripts\uvicorn.exe"
nssm install LLMStore-Backend $uvicorn | Out-Null
nssm set LLMStore-Backend AppParameters "app.main:app --host 0.0.0.0 --port $BACKEND_PORT --workers 2" | Out-Null
nssm set LLMStore-Backend AppDirectory "$INSTALL_DIR\backend" | Out-Null
nssm set LLMStore-Backend Start SERVICE_AUTO_START | Out-Null
nssm set LLMStore-Backend DisplayName "LLMStore - Backend API" | Out-Null
nssm set LLMStore-Backend AppEnvironmentExtra "PYTHONPATH=$INSTALL_DIR\backend" | Out-Null
nssm set LLMStore-Backend AppStdout "$INSTALL_DIR\logs\backend.log" | Out-Null
nssm set LLMStore-Backend AppStderr "$INSTALL_DIR\logs\backend_error.log" | Out-Null

# Create logs folder
New-Item -ItemType Directory -Force -Path "$INSTALL_DIR\logs" | Out-Null

# Start services
Write-Info "Starting services..."
Start-Service LLMStore-Ollama -ErrorAction SilentlyContinue
Start-Sleep 3
Start-Service LLMStore-Backend -ErrorAction SilentlyContinue
Start-Sleep 5

Write-OK "Windows services installed and started!"

# Open firewall
New-NetFirewallRule -DisplayName "LLMStore" -Direction Inbound -Protocol TCP -LocalPort $BACKEND_PORT -Action Allow -ErrorAction SilentlyContinue | Out-Null
New-NetFirewallRule -DisplayName "LLMStore-Ollama" -Direction Inbound -Protocol TCP -LocalPort 11434 -Action Allow -ErrorAction SilentlyContinue | Out-Null

# ============================================
# STEP 8: HEALTH CHECK
# ============================================
Write-Step "Step 8/8: Health Check"

Write-Info "Waiting for LLMStore to start..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$BACKEND_PORT/health" -UseBasicParsing -TimeoutSec 2
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
    Start-Sleep 2
}

$SERVER_IP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"} | Select-Object -First 1).IPAddress

Write-Host ""
if ($ready) {
    Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║       LLMStore Successfully Installed!     ║" -ForegroundColor Green
    Write-Host "╠════════════════════════════════════════════╣" -ForegroundColor Green
    Write-Host "║                                            ║" -ForegroundColor Green
    Write-Host "║  Open LLMStore:                           ║" -ForegroundColor Green
    Write-Host "║  http://$SERVER_IP`:$BACKEND_PORT          ║" -ForegroundColor Green
    Write-Host "║                                            ║" -ForegroundColor Green
    Write-Host "║  Services (auto-start on reboot):         ║" -ForegroundColor Green
    Write-Host "║  OK  LLMStore-Backend                     ║" -ForegroundColor Green
    Write-Host "║  OK  LLMStore-Ollama                      ║" -ForegroundColor Green
    Write-Host "║                                            ║" -ForegroundColor Green
    Write-Host "║  Support: support@llmstore.ai             ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Green

    # Open browser
    Start-Process "http://localhost:$BACKEND_PORT"
} else {
    Write-Host "Installation issue detected!" -ForegroundColor Red
    Write-Host "Check logs: $INSTALL_DIR\logs\backend_error.log"
    Write-Host "Or run: Get-Service LLMStore-*"
}
