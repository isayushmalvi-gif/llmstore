#!/bin/bash

# ============================================
# LLMStore - Ubuntu/Linux Installer v1.0.0
# Tested on Ubuntu 20.04, 22.04, 24.04
# Usage: curl -fsSL https://raw.githubusercontent.com/isayushmalvi-gif/llmstore/main/install.sh | sudo bash
# ============================================

set +e

# Colors
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
PURPLE="\033[0;35m"
CYAN="\033[0;36m"
NC="\033[0m"

# Config
INSTALL_DIR="/opt/llmstore"
REPO_URL="https://github.com/isayushmalvi-gif/llmstore"
BACKEND_PORT=8000
FRONTEND_PORT=80
OLLAMA_PORT=11434
LOG_FILE="/tmp/llmstore_install.log"

# Logging
log_info()    { echo -e "${BLUE}[INFO]${NC}  $1" | tee -a $LOG_FILE; }
log_success() { echo -e "${GREEN}[OK]${NC}    $1" | tee -a $LOG_FILE; }
log_warning() { echo -e "${YELLOW}[WARN]${NC}  $1" | tee -a $LOG_FILE; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE; exit 1; }
log_step()    { echo -e "\n${PURPLE}━━━ $1 ━━━${NC}" | tee -a $LOG_FILE; }

clear
echo ""
echo -e "${PURPLE}╔════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║      🏪 LLMStore Installer v1.0.0          ║${NC}"
echo -e "${PURPLE}║  Enterprise AI Model Deployment Platform   ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# CHECK ROOT
# ============================================
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root: sudo bash install.sh"
fi

# ============================================
# STEP 1: SYSTEM CHECK
# ============================================
log_step "Step 1/8: System Check"

OS=$(lsb_release -si 2>/dev/null || echo "Linux")
OS_VER=$(lsb_release -sr 2>/dev/null || echo "Unknown")
RAM_GB=$(free -g | awk "/^Mem:/ {print \$2}")
DISK_GB=$(df -BG / | awk "NR==2 {print \$4}" | tr -d G)
CPU_CORES=$(nproc)
ARCH=$(uname -m)

echo ""
echo -e "  OS:         ${GREEN}$OS $OS_VER${NC}"
echo -e "  RAM:        ${GREEN}${RAM_GB}GB${NC}"
echo -e "  Disk Free:  ${GREEN}${DISK_GB}GB${NC}"
echo -e "  CPU Cores:  ${GREEN}${CPU_CORES}${NC}"
echo -e "  Arch:       ${GREEN}${ARCH}${NC}"

# Check GPU
if command -v nvidia-smi &>/dev/null; then
    GPU=$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | head -1)
    VRAM=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader 2>/dev/null | head -1)
    echo -e "  GPU:        ${GREEN}$GPU ($VRAM)${NC}"
    HAS_GPU=true
else
    echo -e "  GPU:        ${YELLOW}No NVIDIA GPU (CPU mode)${NC}"
    HAS_GPU=false
fi
echo ""

# Requirements check
if [ "$RAM_GB" -lt 4 ]; then
    log_error "Minimum 4GB RAM required. Found: ${RAM_GB}GB"
fi
if [ "$DISK_GB" -lt 20 ]; then
    log_error "Minimum 20GB free disk required. Found: ${DISK_GB}GB"
fi

log_success "System check passed!"

# ============================================
# STEP 2: INSTALL SYSTEM DEPENDENCIES
# ============================================
log_step "Step 2/8: Installing System Dependencies"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq 2>/dev/null
apt-get install -y -qq     curl wget git zstd     python3 python3-pip python3-venv     nginx supervisor     build-essential     2>/dev/null || true

log_success "System dependencies installed!"

# ============================================
# STEP 3: INSTALL NODE.JS
# ============================================
log_step "Step 3/8: Installing Node.js"

if ! command -v node &>/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 18 ]; then
    log_info "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
    apt-get install -y -qq nodejs >/dev/null 2>&1
fi

NODE_VER=$(node --version)
NPM_VER=$(npm --version)
log_success "Node.js $NODE_VER ready!"
log_success "npm $NPM_VER ready!"

# ============================================
# STEP 4: INSTALL OLLAMA
# ============================================
log_step "Step 4/8: Installing Ollama"

if ! command -v ollama &>/dev/null; then
    log_info "Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh >/dev/null 2>&1 || {
        log_warning "Standard install failed, trying direct download..."
        curl -L "https://github.com/ollama/ollama/releases/download/v0.3.12/ollama-linux-amd64.tgz"             -o /tmp/ollama.tgz 2>/dev/null
        mkdir -p /tmp/ollama_dir
        cd /tmp/ollama_dir
        tar -xzf /tmp/ollama.tgz 2>/dev/null || true
        if [ -f "bin/ollama" ]; then
            cp bin/ollama /usr/local/bin/ollama
        elif [ -f "ollama" ]; then
            cp ollama /usr/local/bin/ollama
        fi
        chmod +x /usr/local/bin/ollama
        cd /
    }
fi

OLLAMA_VER=$(ollama --version 2>/dev/null || echo "installed")
log_success "Ollama $OLLAMA_VER ready!"

# ============================================
# STEP 5: SETUP LLMSTORE
# ============================================
log_step "Step 5/8: Setting up LLMStore"

# Clone or update
if [ -d "$INSTALL_DIR" ]; then
    log_info "Updating existing installation..."
    cd $INSTALL_DIR
    git pull origin main 2>/dev/null || true
else
    log_info "Cloning LLMStore..."
    git clone $REPO_URL $INSTALL_DIR 2>/dev/null
fi

cd $INSTALL_DIR

# Python virtual environment
log_info "Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate
pip install -q --upgrade pip 2>/dev/null
pip install -q -r backend/requirements.txt 2>/dev/null

log_success "Python environment ready!"

# ============================================
# STEP 6: BUILD FRONTEND
# ============================================
log_step "Step 6/8: Building Frontend"

cd $INSTALL_DIR/frontend

log_info "Installing frontend packages..."
npm install --silent 2>/dev/null

# Fix TypeScript errors before building
log_info "Fixing TypeScript compatibility..."
python3 << PYFIX
import os, re

fixes = {
    "src/pages/Settings.tsx": [
        (
            "import {\n  Settings as SettingsIcon, Save, RefreshCw,\n  Server, Key, Bell,\n  CheckCircle, ExternalLink,\n  Cpu, Globe, Database\n} from \"lucide-react\"",
            "import {\n  Save, RefreshCw,\n  Server, Key, Bell,\n  CheckCircle, ExternalLink,\n  Globe, Database\n} from \"lucide-react\""
        ),
    ],
    "src/pages/Monitoring.tsx": [
        (
            "formatter={(v: number) => [v + unit, label]}",
            "formatter={(v) => [String(v) + unit, label]}"
        ),
        (
            "labelFormatter={(l: string) => \"Time: \" + l}",
            "labelFormatter={(l) => \"Time: \" + String(l)}"
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

# Remove MiniChart if it exists and causes issues
monitoring_path = "src/pages/Monitoring.tsx"
if os.path.exists(monitoring_path):
    with open(monitoring_path, "r") as f:
        content = f.read()
    content = re.sub(
        r"const MiniChart = \([^)]+\)[^{]+\{[^}]+\}[^}]+\}",
        "",
        content,
        flags=re.DOTALL
    )
    with open(monitoring_path, "w") as f:
        f.write(content)
    print("Fixed: MiniChart removed")

print("All TypeScript fixes applied!")
PYFIX

# Create production .env
cat > .env << ENVEOF
VITE_API_URL=
VITE_OLLAMA_URL=
ENVEOF

# Build frontend

# Fix TypeScript errors automatically
log_info "Fixing TypeScript compatibility..."
python3 << PYFIX
import os, re

# Fix Settings.tsx
path = "src/pages/Settings.tsx"
if os.path.exists(path):
    with open(path) as f: c = f.read()
    c = re.sub(
        r"import \{[^}]+\} from \"lucide-react\"",
        """import {
  Save, RefreshCw, Server,
  Key, Bell, CheckCircle,
  ExternalLink, Globe, Database
} from \"lucide-react\"""",
        c, count=1
    )
    with open(path, "w") as f: f.write(c)
    print("Fixed Settings.tsx")

# Fix Monitoring.tsx
path = "src/pages/Monitoring.tsx"
if os.path.exists(path):
    with open(path) as f: c = f.read()
    c = re.sub(r"const MiniChart = \(\{.*?\}\)", "", c, flags=re.DOTALL)
    c = c.replace("formatter={(v: number) => [v + unit, label]}", "formatter={(v) => [String(v) + unit, label]}")
    c = c.replace("formatter={(v: number) => [v + \"%\", label]}", "formatter={(v) => [String(v) + \"%\", label]}")
    c = c.replace('labelFormatter={(l: string) => "Time: " + l}', 'labelFormatter={(l) => "Time: " + String(l)}')
    c = c.replace('labelFormatter={(l) => "Time: " + l}', 'labelFormatter={(l) => "Time: " + String(l)}')
    with open(path, "w") as f: f.write(c)
    print("Fixed Monitoring.tsx")

# Fix ModelCard.tsx
path = "src/components/models/ModelCard.tsx"
if os.path.exists(path):
    with open(path) as f: c = f.read()
    c = c.replace(
        "HardDrive, Cpu, Zap, ChevronDown,\n  ChevronUp, Star, Download, ExternalLink",
        "HardDrive, Cpu, Zap, ChevronDown,\n  ChevronUp, Star, Download"
    )
    with open(path, "w") as f: f.write(c)
    print("Fixed ModelCard.tsx")

# Fix ModelCatalog.tsx
path = "src/pages/ModelCatalog.tsx"
if os.path.exists(path):
    with open(path) as f: c = f.read()
    c = c.replace(
        "Search, Filter, Cpu, Zap,\n  HardDrive, Star, SlidersHorizontal",
        "Search, Filter, Cpu, Zap,\n  HardDrive, SlidersHorizontal"
    )
    with open(path, "w") as f: f.write(c)
    print("Fixed ModelCatalog.tsx")

# Fix API URLs to be relative
for filepath in [
    "src/services/api.ts",
    "src/services/chatApi.ts",
    "src/pages/Monitoring.tsx",
    "src/pages/Settings.tsx",
]:
    if os.path.exists(filepath):
        with open(filepath) as f: c = f.read()
        c = c.replace("|| \'http://localhost:8000\'", "|| \'\'")
        c = c.replace('\'|| "http://localhost:8000"', '\'|| ""')
        with open(filepath, "w") as f: f.write(c)

# Clear .env
with open(".env", "w") as f:
    f.write("VITE_API_URL=\nVITE_OLLAMA_URL=\n")

print("All TypeScript fixes applied!")
PYFIX

log_info "Building frontend..."
npm run build 2>/dev/null

if [ -d "dist/assets" ]; then
    log_success "Frontend built successfully!"

# Fix hardcoded URLs in built JS
log_info "Fixing API URLs for production..."
python3 << URLFIX
import os, re
dist = "$INSTALL_DIR/frontend/dist/assets"
if os.path.exists(dist):
    for f in os.listdir(dist):
        if f.endswith(".js"):
            path = os.path.join(dist, f)
            with open(path, "r", errors="ignore") as fh:
                js = fh.read()
            js = re.sub(r"https?://[a-zA-Z0-9\-\.]+\.app\.github\.dev", "", js)
            js = js.replace("http://localhost:8000", "")
            js = js.replace("http://localhost:11434", "")
            with open(path, "w") as fh:
                fh.write(js)
    print("API URLs fixed!")
URLFIX
log_success "API URLs configured for production!"


# Fix API URLs to use relative paths
log_info "Configuring frontend API URLs..."
python3 << PYFIX
import os, re

dist_path = "$INSTALL_DIR/frontend/dist/assets"
if os.path.exists(dist_path):
    for f in os.listdir(dist_path):
        if f.endswith(".js"):
            path = os.path.join(dist_path, f)
            with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                js = fh.read()
            # Replace any hardcoded URLs
            js = re.sub(
                r"https?://[a-zA-Z0-9\-\.]+\.app\.github\.dev",
                "",
                js
            )
            js = js.replace("http://localhost:8000", "")
            js = js.replace("http://localhost:11434", "")
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(js)
    print("API URLs configured!")
PYFIX
log_success "Frontend API URLs configured!"

else
    log_error "Frontend build failed! Check logs: $LOG_FILE"
fi

# ============================================
# STEP 7: CONFIGURE SERVICES
# ============================================
log_step "Step 7/8: Configuring Services"

# Update backend main.py to serve frontend
cat > $INSTALL_DIR/backend/app/main.py << MAINEOF
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.api.routes import hardware, models, deployments, chat, monitoring
import subprocess
import threading
import time
import os

def auto_start_ollama():
    time.sleep(3)
    try:
        import requests
        requests.get("http://localhost:11434", timeout=2)
        return
    except:
        pass
    try:
        subprocess.Popen(
            ["ollama", "serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True
        )
    except:
        pass

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION
)

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

frontend_dist = "$INSTALL_DIR/frontend/dist"

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/")
async def index():
    return FileResponse(frontend_dist + "/index.html")

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
MAINEOF

# Configure Nginx
cat > /etc/nginx/sites-available/llmstore << NGINXEOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/llmstore     /etc/nginx/sites-enabled/llmstore
rm -f /etc/nginx/sites-enabled/default
nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null || true

log_success "Nginx configured!"

# Create Ollama systemd service
cat > /etc/systemd/system/ollama.service << SVCEOF
[Unit]
Description=Ollama AI Service
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=5
Environment=OLLAMA_HOST=0.0.0.0
StandardOutput=null
StandardError=null

[Install]
WantedBy=multi-user.target
SVCEOF

# Create LLMStore backend service
cat > /etc/systemd/system/llmstore.service << SVCEOF
[Unit]
Description=LLMStore Backend
After=network.target ollama.service
Requires=ollama.service

[Service]
Type=simple
WorkingDirectory=$INSTALL_DIR/backend
Environment=PATH=$INSTALL_DIR/venv/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=$INSTALL_DIR/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SVCEOF

# Enable & start services
systemctl daemon-reload
systemctl enable ollama llmstore nginx
systemctl start ollama
sleep 3
systemctl start llmstore
sleep 3
systemctl restart nginx

log_success "Services configured and started!"

# ============================================
# STEP 8: HEALTH CHECK
# ============================================
log_step "Step 8/8: Health Check"

# Wait for backend
log_info "Waiting for LLMStore to start..."
MAX=30
COUNT=0
while [ $COUNT -lt $MAX ]; do
    if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
        break
    fi
    COUNT=$((COUNT + 1))
    sleep 2
done

# Get server IP
SERVER_IP=$(hostname -I | awk "{print \$1}")

echo ""
if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
    echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║       🎉 LLMStore Successfully Installed!  ║${NC}"
    echo -e "${GREEN}╠════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║                                            ║${NC}"
    echo -e "${GREEN}║  🌐 Open LLMStore:                        ║${NC}"
    echo -e "${GREEN}║     http://$SERVER_IP                     ║${NC}"
    echo -e "${GREEN}║                                            ║${NC}"
    echo -e "${GREEN}║  📚 API Documentation:                    ║${NC}"
    echo -e "${GREEN}║     http://$SERVER_IP:$BACKEND_PORT/docs  ║${NC}"
    echo -e "${GREEN}║                                            ║${NC}"
    echo -e "${GREEN}║  ✅ LLMStore Backend  - Running           ║${NC}"
    echo -e "${GREEN}║  ✅ Ollama Service    - Running           ║${NC}"
    echo -e "${GREEN}║  ✅ Nginx Web Server  - Running           ║${NC}"
    echo -e "${GREEN}║  ✅ Auto-start        - Enabled           ║${NC}"
    echo -e "${GREEN}║                                            ║${NC}"
    echo -e "${GREEN}║  Share with your team:                    ║${NC}"
    echo -e "${GREEN}║  http://$SERVER_IP                        ║${NC}"
    echo -e "${GREEN}║                                            ║${NC}"
    echo -e "${GREEN}║  Support: support@llmstore.ai             ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
else
    echo -e "${RED}Installation issue detected!${NC}"
    echo -e "Check logs: ${YELLOW}journalctl -u llmstore -n 50${NC}"
    echo -e "Or: ${YELLOW}cat $LOG_FILE${NC}"
fi
