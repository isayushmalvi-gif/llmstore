#!/bin/bash
echo "Uninstalling LLMStore..."
systemctl stop llmstore-backend ollama nginx 2>/dev/null
systemctl disable llmstore-backend ollama 2>/dev/null
rm -f /etc/systemd/system/llmstore-backend.service
rm -f /etc/systemd/system/ollama.service
rm -f /etc/nginx/sites-enabled/llmstore
rm -rf /opt/llmstore
systemctl daemon-reload
echo "✅ LLMStore uninstalled!"
