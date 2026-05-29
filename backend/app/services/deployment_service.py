import subprocess
import os
import threading
import uuid
import requests
import time
from datetime import datetime
from typing import Dict, List, Optional
from app.models.deployment import DeploymentInfo, DeploymentStatus

class DeploymentService:
    def __init__(self):
        self.deployments: Dict[str, DeploymentInfo] = {}
        self.log_callbacks = {}

    def _now(self):
        return datetime.utcnow().isoformat()

    def _add_log(self, deployment_id: str, message: str):
        if deployment_id in self.deployments:
            self.deployments[deployment_id].logs.append(
                f"[{datetime.utcnow().strftime('%H:%M:%S')}] {message}"
            )
            if len(self.deployments[deployment_id].logs) > 100:
                self.deployments[deployment_id].logs =                     self.deployments[deployment_id].logs[-100:]

    def _update_status(self, deployment_id: str, status: DeploymentStatus):
        if deployment_id in self.deployments:
            self.deployments[deployment_id].status = status
            self.deployments[deployment_id].updated_at = self._now()

    def _check_ollama(self) -> bool:
        try:
            r = requests.get("http://localhost:11434/api/tags", timeout=3)
            return r.status_code == 200
        except:
            return False

    def _start_ollama(self, deployment_id: str) -> bool:
        if self._check_ollama():
            self._add_log(deployment_id, "✅ Ollama is already running")
            return True

        self._add_log(deployment_id, "⚙️ Starting Ollama service...")

        try:
            # Try multiple ways to start ollama
            ollama_paths = [
                "ollama",
                "/usr/local/bin/ollama",
                "/usr/bin/ollama",
                os.path.expanduser("~/.ollama/ollama")
            ]

            started = False
            for ollama_path in ollama_paths:
                try:
                    subprocess.Popen(
                        [ollama_path, "serve"],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        start_new_session=True
                    )
                    self._add_log(
                        deployment_id,
                        f"✅ Started Ollama from: {ollama_path}"
                    )
                    started = True
                    break
                except FileNotFoundError:
                    continue

            if not started:
                self._add_log(
                    deployment_id,
                    "❌ Ollama not found! Installing..."
                )
                install = subprocess.run(
                    "curl -fsSL https://ollama.ai/install.sh | sh",
                    shell=True,
                    capture_output=True,
                    text=True
                )
                if install.returncode == 0:
                    self._add_log(
                        deployment_id,
                        "✅ Ollama installed!"
                    )
                    subprocess.Popen(
                        ["ollama", "serve"],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        start_new_session=True
                    )
                else:
                    self._add_log(
                        deployment_id,
                        "❌ Ollama install failed!"
                    )
                    return False

            # Wait for Ollama to be ready
            self._add_log(
                deployment_id,
                "⏳ Waiting for Ollama to be ready..."
            )
            for i in range(20):
                time.sleep(2)
                if self._check_ollama():
                    self._add_log(
                        deployment_id,
                        "✅ Ollama is ready!"
                    )
                    return True
                self._add_log(
                    deployment_id,
                    f"⏳ Waiting... ({i+1}/20)"
                )

            self._add_log(
                deployment_id,
                "❌ Ollama failed to start!"
            )
            return False

        except Exception as e:
            self._add_log(
                deployment_id,
                f"❌ Error starting Ollama: {str(e)}"
            )
            return False

    def _pull_model(self, deployment_id: str, ollama_id: str) -> bool:
        self._add_log(deployment_id, f"📥 Pulling model: {ollama_id}")
        self._update_status(deployment_id, DeploymentStatus.DOWNLOADING)
        try:
            import os
            env = os.environ.copy()
            env["HOME"] = "/root"
            env["OLLAMA_HOST"] = "http://localhost:11434"
            process = subprocess.Popen(
                ["ollama", "pull", ollama_id],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                env=env
            )
            for line in iter(process.stdout.readline, ""):
                line = line.strip()
                if line:
                    self._add_log(deployment_id, line)
            process.wait()
            if process.returncode == 0:
                self._add_log(deployment_id, f"✅ Model downloaded successfully")
                return True
            else:
                self._add_log(deployment_id, f"❌ Download failed")
                return False
        except Exception as e:
            self._add_log(deployment_id, f"❌ Error: {str(e)}")
            return False

    def _verify_model(self, deployment_id: str, ollama_id: str) -> bool:
        self._add_log(deployment_id, "🔍 Verifying model...")
        self._update_status(deployment_id, DeploymentStatus.STARTING)
        try:
            r = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": ollama_id,
                    "prompt": "Hello",
                    "stream": False
                },
                timeout=60
            )
            if r.status_code == 200:
                self._add_log(deployment_id, "✅ Model verified and responding")
                return True
            return False
        except Exception as e:
            self._add_log(deployment_id, f"⚠️ Verification: {str(e)}")
            return False

    def _deploy_thread(self, deployment_id: str, ollama_id: str):
        try:
            self._add_log(deployment_id, "🚀 Starting deployment...")

            # Step 1: Start Ollama
            self._add_log(deployment_id, "Step 1/3: Checking Ollama service...")
            if not self._start_ollama(deployment_id):
                self._add_log(deployment_id, "❌ Failed to start Ollama")
                self._update_status(deployment_id, DeploymentStatus.FAILED)
                self.deployments[deployment_id].error = "Ollama service failed"
                return

            # Step 2: Pull Model
            self._add_log(deployment_id, "Step 2/3: Downloading model...")
            if not self._pull_model(deployment_id, ollama_id):
                self._update_status(deployment_id, DeploymentStatus.FAILED)
                self.deployments[deployment_id].error = "Model download failed"
                return

            # Step 3: Verify
            self._add_log(deployment_id, "Step 3/3: Starting model server...")
            self._verify_model(deployment_id, ollama_id)

            # Done
            self._update_status(deployment_id, DeploymentStatus.RUNNING)
            self._add_log(deployment_id, "")
            self._add_log(deployment_id, "🎉 Deployment successful!")
            self._add_log(deployment_id, f"📡 API endpoint: http://localhost:11434")
            self._add_log(deployment_id, f"🔗 Model: {ollama_id}")
            self._add_log(deployment_id, f"💬 OpenAI-compatible API ready!")

        except Exception as e:
            self._add_log(deployment_id, f"❌ Unexpected error: {str(e)}")
            self._update_status(deployment_id, DeploymentStatus.FAILED)
            self.deployments[deployment_id].error = str(e)

    def deploy(self, model_id: str, model_name: str, ollama_id: str) -> str:
        deployment_id = str(uuid.uuid4())[:8]
        deployment = DeploymentInfo(
            id=deployment_id,
            model_id=model_id,
            model_name=model_name,
            ollama_id=ollama_id,
            status=DeploymentStatus.PENDING,
            port=11434,
            created_at=self._now(),
            updated_at=self._now(),
            logs=[]
        )
        self.deployments[deployment_id] = deployment
        thread = threading.Thread(
            target=self._deploy_thread,
            args=(deployment_id, ollama_id),
            daemon=True
        )
        thread.start()
        return deployment_id

    def get_deployment(self, deployment_id: str) -> Optional[DeploymentInfo]:
        return self.deployments.get(deployment_id)

    def get_all_deployments(self) -> List[DeploymentInfo]:
        return list(self.deployments.values())

    def stop_deployment(self, deployment_id: str) -> bool:
        if deployment_id not in self.deployments:
            return False
        deployment = self.deployments[deployment_id]
        self._add_log(deployment_id, f"Stopping {deployment.model_name}...")
        try:
            subprocess.run(
                ["ollama", "stop", deployment.ollama_id],
                capture_output=True, timeout=10
            )
        except:
            pass
        self._update_status(deployment_id, DeploymentStatus.STOPPED)
        self._add_log(deployment_id, "✅ Model stopped")
        return True

    def delete_deployment(self, deployment_id: str) -> bool:
        if deployment_id in self.deployments:
            del self.deployments[deployment_id]
            return True
        return False

    def get_running_models(self) -> List[dict]:
        try:
            r = requests.get(
                "http://localhost:11434/api/tags", timeout=3
            )
            if r.status_code == 200:
                return r.json().get("models", [])
            return []
        except:
            return []

    def is_ollama_running(self) -> bool:
        return self._check_ollama()

deployment_service = DeploymentService()
