#!/bin/bash

# ============================================
# LLMStore - Linux Installer
# ============================================

set -e

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
SERVICE_USER="llmstore"
BACKEND_PORT=8000
FRONTEND_PORT=80
OLLAMA_PORT=11434

clear
echo ""
echo -e "${PURPLE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║         🏪 LLMStore Installer v1.0.0         ║${NC}"
echo -e "${PURPLE}║    Enterprise AI Model Deployment Platform   ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════╝${NC}"
echo ""

log_info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_success() { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
log_step()    { echo -e "${CYAN}[STEP]${NC}  $1"; }

# Check root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root: sudo bash install.sh"
fi

# ============================================
# STEP 1: System Check
# ============================================
log_step "Step 1/8: Checking system requirements..."

OS=$(lsb_release -si 2>/dev/null || echo "Unknown")
RAM_GB=$(free -g | awk "/^Mem:/ {print \$2}")
DISK_GB=$(df -BG / | awk "NR==2 {print \$4}" | tr -d G)
CPU_CORES=$(nproc)

echo ""
echo -e "  OS:         ${GREEN}$OS${NC}"
echo -e "  RAM:        ${GREEN}${RAM_GB}GB${NC}"
echo -e "  Disk Free:  ${GREEN}${DISK_GB}GB${NC}"
echo -e "  CPU Cores:  ${GREEN}${CPU_CORES}${NC}"
echo ""

if [ "$RAM_GB" -lt 4 ]; then
    log_error "Minimum 4GB RAM required. Found: ${RAM_GB}GB"
fi

if [ "$DISK_GB" -lt 20 ]; then
    log_error "Minimum 20GB free disk required. Found: ${DISK_GB}GB"
fi

# Check GPU
HAS_GPU=false
if command -v nvidia-smi &>/dev/null; then
    GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | head -1)
    GPU_VRAM=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader 2>/dev/null | head -1)
    echo -e "  GPU:        ${GREEN}$GPU_NAME ($GPU_VRAM)${NC}"
    HAS_GPU=true
else
    echo -e "  GPU:        ${YELLOW}No NVIDIA GPU (CPU mode)${NC}"
fi
echo ""

log_success "System check passed!"

# ============================================
# STEP 2: Install Dependencies
# ============================================
log_step "Step 2/8: Installing dependencies..."

apt-get update -qq
apt-get install -y -qq     python3     python3-pip     python3-venv     curl     wget     git     nginx     supervisor     2>/dev/null

log_success "System dependencies installed!"

# Install Node.js
if ! command -v node &>/dev/null; then
    log_info "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
    apt-get install -y -qq nodejs >/dev/null 2>&1
fi
log_success "Node.js $(node --version) ready!"

# ============================================
# STEP 3: Install Ollama
# ============================================
log_step "Step 3/8: Installing Ollama..."

if ! command -v ollama &>/dev/null; then
    curl -fsSL https://ollama.ai/install.sh | sh >/dev/null 2>&1
fi
log_success "Ollama $(ollama --version) ready!"

# ============================================
# STEP 4: Setup LLMStore
# ============================================
log_step "Step 4/8: Setting up LLMStore..."

# Create install directory
mkdir -p $INSTALL_DIR
cp -r . $INSTALL_DIR/
cd $INSTALL_DIR

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python packages
pip install -q --upgrade pip
pip install -q -r backend/requirements.txt

log_success "LLMStore files installed!"

# ============================================
# STEP 5: Build Frontend
# ============================================
log_step "Step 5/8: Building frontend..."

cd $INSTALL_DIR/frontend
npm install --silent
npm run build --silent

log_success "Frontend built!"

# ============================================
# STEP 6: Configure Nginx
# ============================================
log_step "Step 6/8: Configuring web server..."

cat > /etc/nginx/sites-available/llmstore << NGINX
server {
    listen 80;
    server_name _;

    root $INSTALL_DIR/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_read_timeout 300s;
    }

    location /health {
        proxy_pass http://localhost:$BACKEND_PORT/health;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/llmstore /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

log_success "Nginx configured!"

# ============================================
# STEP 7: Create Systemd Services
# ============================================
log_step "Step 7/8: Registering auto-start services..."

# Ollama Service
cat > /etc/systemd/system/ollama.service << SERVICE
[Unit]
Description=Ollama AI Service
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/ollama serve
Restart=always
RestartSec=5
Environment=OLLAMA_HOST=0.0.0.0

[Install]
WantedBy=multi-user.target
SERVICE

# LLMStore Backend Service
cat > /etc/systemd/system/llmstore-backend.service << SERVICE
[Unit]
Description=LLMStore Backend API
After=network.target ollama.service

[Service]
Type=simple
WorkingDirectory=$INSTALL_DIR/backend
Environment=PATH=$INSTALL_DIR/venv/bin
ExecStart=$INSTALL_DIR/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

# Enable all services
systemctl daemon-reload
systemctl enable ollama
systemctl enable llmstore-backend
systemctl enable nginx

# Start all services
systemctl start ollama
sleep 3
systemctl start llmstore-backend
sleep 3
systemctl restart nginx

log_success "Auto-start services registered!"

# ============================================
# STEP 8: Health Check
# ============================================
log_step "Step 8/8: Running health check..."

sleep 5

BACKEND_OK=false
for i in $(seq 1 15); do
    if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
        BACKEND_OK=true
        break
    fi
    sleep 2
done

OLLAMA_OK=false
if curl -s http://localhost:$OLLAMA_PORT > /dev/null 2>&1; then
    OLLAMA_OK=true
fi

# Get server IP
SERVER_IP=$(hostname -I | awk "{print \$1}")

echo ""
if [ "$BACKEND_OK" = true ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║        🎉 LLMStore is Ready!                 ║${NC}"
    echo -e "${GREEN}╠══════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║                                              ║${NC}"
    echo -e "${GREEN}║  🌐 Dashboard:  http://$SERVER_IP            ║${NC}"
    echo -e "${GREEN}║  📚 API Docs:   http://$SERVER_IP:8000/docs  ║${NC}"
    echo -e "${GREEN}║  🤖 Ollama:     http://$SERVER_IP:11434      ║${NC}"
    echo -e "${GREEN}║                                              ║${NC}"
    echo -e "${GREEN}║  Services:                                   ║${NC}"
    echo -e "${GREEN}║  ✅ LLMStore Backend  (auto-start enabled)   ║${NC}"
    echo -e "${GREEN}║  ✅ Ollama Service    (auto-start enabled)   ║${NC}"
    echo -e "${GREEN}║  ✅ Nginx Web Server  (auto-start enabled)   ║${NC}"
    echo -e "${GREEN}║                                              ║${NC}"
    echo -e "${GREEN}║  Share this URL with your team:              ║${NC}"
    echo -e "${GREEN}║  http://$SERVER_IP                           ║${NC}"
    echo -e "${GREEN}║                                              ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
else
    echo -e "${RED}Installation failed. Check logs:${NC}"
    echo "  sudo journalctl -u llmstore-backend -n 50"
fi
