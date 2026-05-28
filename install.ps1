# ============================================
# LLMStore - Windows Installer v1.0.0
# Run as Administrator in PowerShell
# ============================================

$ErrorActionPreference = "Stop"

# Colors
function Write-Info    { Write-Host "[INFO]  $args" -ForegroundColor Cyan }
function Write-Success { Write-Host "[OK]    $args" -ForegroundColor Green }
function Write-Warning { Write-Host "[WARN]  $args" -ForegroundColor Yellow }
function Write-Step    { Write-Host "[STEP]  $args" -ForegroundColor Magenta }
function Write-Fail    { Write-Host "[ERROR] $args" -ForegroundColor Red; exit 1 }

Clear-Host
Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║      LLMStore Installer v1.0.0               ║" -ForegroundColor Magenta
Write-Host "║  Enterprise AI Model Deployment Platform     ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# Check Admin
$isAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent() `
).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Fail "Please run as Administrator! Right-click PowerShell -> Run as Administrator"
}

# Config
$INSTALL_DIR = "C:\LLMStore"
$BACKEND_PORT = 8000
$FRONTEND_PORT = 80
$OLLAMA_PORT = 11434

# ============================================
# STEP 1: System Check
# ============================================
Write-Step "Step 1/7: Checking system requirements..."

$RAM = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB)
$DISK = [math]::Round((Get-PSDrive C).Free / 1GB)
$OS = (Get-CimInstance Win32_OperatingSystem).Caption

Write-Host ""
Write-Host "  OS:         $OS" -ForegroundColor Green
Write-Host "  RAM:        ${RAM}GB" -ForegroundColor Green
Write-Host "  Disk Free:  ${DISK}GB" -ForegroundColor Green
Write-Host ""

# Check GPU
$GPU = Get-CimInstance Win32_VideoController | Where-Object {$_.Name -like "*NVIDIA*"} | Select-Object -First 1
if ($GPU) {
    Write-Host "  GPU:        $($GPU.Name)" -ForegroundColor Green
} else {
    Write-Host "  GPU:        No NVIDIA GPU (CPU mode)" -ForegroundColor Yellow
}
Write-Host ""

if ($RAM -lt 4)  { Write-Fail "Minimum 4GB RAM required" }
if ($DISK -lt 20) { Write-Fail "Minimum 20GB free disk required" }

Write-Success "System check passed!"

# ============================================
# STEP 2: Install Chocolatey (Package Manager)
# ============================================
Write-Step "Step 2/7: Setting up package manager..."

if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Info "Installing Chocolatey..."
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = `
        [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString(
        "https://community.chocolatey.org/install.ps1"
    ))
}
Write-Success "Package manager ready!"

# ============================================
# STEP 3: Install Dependencies
# ============================================
Write-Step "Step 3/7: Installing dependencies..."

# Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Info "Installing Python..."
    choco install python311 -y --no-progress | Out-Null
    refreshenv
}
Write-Success "Python ready!"

# Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Info "Installing Node.js..."
    choco install nodejs-lts -y --no-progress | Out-Null
    refreshenv
}
Write-Success "Node.js ready!"

# Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    choco install git -y --no-progress | Out-Null
    refreshenv
}
Write-Success "Git ready!"

# ============================================
# STEP 4: Install Ollama
# ============================================
Write-Step "Step 4/7: Installing Ollama..."

if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
    Write-Info "Downloading Ollama for Windows..."
    $ollamaUrl = "https://ollama.ai/download/OllamaSetup.exe"
    $ollamaInstaller = "$env:TEMP\OllamaSetup.exe"
    Invoke-WebRequest -Uri $ollamaUrl -OutFile $ollamaInstaller
    Start-Process -FilePath $ollamaInstaller -Args "/S" -Wait
    refreshenv
}
Write-Success "Ollama ready!"

# ============================================
# STEP 5: Setup LLMStore
# ============================================
Write-Step "Step 5/7: Installing LLMStore..."

# Create install directory
New-Item -ItemType Directory -Force -Path $INSTALL_DIR | Out-Null
Copy-Item -Path ".\*" -Destination $INSTALL_DIR -Recurse -Force

# Install Python packages
Set-Location "$INSTALL_DIR\backend"
python -m pip install --upgrade pip -q
python -m pip install -r requirements.txt -q
Write-Success "Backend dependencies installed!"

# Build frontend
Set-Location "$INSTALL_DIR\frontend"
npm install --silent
npm run build --silent
Write-Success "Frontend built!"

# ============================================
# STEP 6: Create Windows Services
# ============================================
Write-Step "Step 6/7: Registering auto-start services..."

# Install NSSM (service manager)
if (-not (Get-Command nssm -ErrorAction SilentlyContinue)) {
    choco install nssm -y --no-progress | Out-Null
}

# Remove existing services if any
$services = @("LLMStore-Backend", "LLMStore-Ollama")
foreach ($svc in $services) {
    if (Get-Service -Name $svc -ErrorAction SilentlyContinue) {
        Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
        nssm remove $svc confirm 2>$null
    }
}

# Register Ollama Service
nssm install LLMStore-Ollama ollama serve
nssm set LLMStore-Ollama Start SERVICE_AUTO_START
nssm set LLMStore-Ollama DisplayName "LLMStore - Ollama AI Service"
nssm set LLMStore-Ollama Description "Ollama AI model server for LLMStore"

# Register Backend Service
$pythonPath = (Get-Command python).Source
$uvicornPath = (Get-Command uvicorn -ErrorAction SilentlyContinue)?.Source

nssm install LLMStore-Backend python
nssm set LLMStore-Backend AppParameters "-m uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT"
nssm set LLMStore-Backend AppDirectory "$INSTALL_DIR\backend"
nssm set LLMStore-Backend Start SERVICE_AUTO_START
nssm set LLMStore-Backend DisplayName "LLMStore - Backend API"
nssm set LLMStore-Backend Description "LLMStore FastAPI backend service"
nssm set LLMStore-Backend AppEnvironmentExtra "PYTHONPATH=$INSTALL_DIR\backend"

# Start services
Start-Service LLMStore-Ollama
Start-Sleep 3
Start-Service LLMStore-Backend
Start-Sleep 5

# Setup frontend with Python HTTP server
$frontendScript = @"
import http.server
import socketserver
import os
os.chdir(r"$INSTALL_DIR\frontend\dist")
handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(("0.0.0.0", $FRONTEND_PORT), handler) as httpd:
    httpd.serve_forever()
"@
$frontendScript | Out-File "$INSTALL_DIR\serve_frontend.py" -Encoding UTF8

nssm install LLMStore-Frontend python
nssm set LLMStore-Frontend AppParameters "$INSTALL_DIR\serve_frontend.py"
nssm set LLMStore-Frontend AppDirectory "$INSTALL_DIR\frontend\dist"
nssm set LLMStore-Frontend Start SERVICE_AUTO_START
nssm set LLMStore-Frontend DisplayName "LLMStore - Web Interface"
nssm set LLMStore-Frontend Description "LLMStore React frontend service"
Start-Service LLMStore-Frontend

Write-Success "Windows services registered and started!"

# ============================================
# STEP 7: Health Check & Firewall
# ============================================
Write-Step "Step 7/7: Finalizing setup..."

# Open firewall ports
New-NetFirewallRule -DisplayName "LLMStore Backend" `
    -Direction Inbound -Protocol TCP `
    -LocalPort $BACKEND_PORT -Action Allow `
    -ErrorAction SilentlyContinue | Out-Null

New-NetFirewallRule -DisplayName "LLMStore Frontend" `
    -Direction Inbound -Protocol TCP `
    -LocalPort $FRONTEND_PORT -Action Allow `
    -ErrorAction SilentlyContinue | Out-Null

New-NetFirewallRule -DisplayName "LLMStore Ollama" `
    -Direction Inbound -Protocol TCP `
    -LocalPort $OLLAMA_PORT -Action Allow `
    -ErrorAction SilentlyContinue | Out-Null

# Health check
Start-Sleep 5
$SERVER_IP = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.InterfaceAlias -notlike "*Loopback*" } |
    Select-Object -First 1).IPAddress

$backendOk = $false
for ($i = 0; $i -lt 15; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$BACKEND_PORT/health" `
            -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            $backendOk = $true
            break
        }
    } catch {}
    Start-Sleep 2
}

Write-Host ""
if ($backendOk) {
    Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║        LLMStore is Ready!                    ║" -ForegroundColor Green
    Write-Host "╠══════════════════════════════════════════════╣" -ForegroundColor Green
    Write-Host "║                                              ║" -ForegroundColor Green
    Write-Host "║  Dashboard:  http://$SERVER_IP               ║" -ForegroundColor Green
    Write-Host "║  API Docs:   http://$SERVER_IP:8000/docs     ║" -ForegroundColor Green
    Write-Host "║  Ollama:     http://$SERVER_IP:11434         ║" -ForegroundColor Green
    Write-Host "║                                              ║" -ForegroundColor Green
    Write-Host "║  Windows Services (auto-start on reboot):   ║" -ForegroundColor Green
    Write-Host "║  OK  LLMStore-Backend                       ║" -ForegroundColor Green
    Write-Host "║  OK  LLMStore-Ollama                        ║" -ForegroundColor Green
    Write-Host "║  OK  LLMStore-Frontend                      ║" -ForegroundColor Green
    Write-Host "║                                              ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Green

    # Open browser
    Start-Process "http://localhost"
} else {
    Write-Host "Installation issue. Check services:" -ForegroundColor Red
    Write-Host "  Get-Service LLMStore-*"
    Write-Host "  nssm log LLMStore-Backend"
}
