import { useState, useEffect } from "react"
import { TopBar } from "../components/layout/TopBar"
import {
  Save, RefreshCw, Server,
  Key, Bell, CheckCircle,
  ExternalLink, Globe, Database
} from "lucide-react"
import axios from "axios"

const API_BASE = import.meta.env.VITE_API_URL || ""

interface SettingsData {
  ollama_url: string
  api_key: string
  max_models: number
  auto_start: boolean
  notifications: boolean
  theme: string
}

const DEFAULT_SETTINGS: SettingsData = {
  ollama_url: "http://localhost:11434",
  api_key: "",
  max_models: 5,
  auto_start: true,
  notifications: true,
  theme: "dark"
}

const Section = ({
  title, description, icon, children
}: {
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
}) => (
  <div className="card">
    <div className="flex items-start gap-4 mb-6">
      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-white font-semibold">{title}</h3>
        <p className="text-gray-500 text-sm mt-0.5">{description}</p>
      </div>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </div>
)

const Toggle = ({
  label, description, value, onChange
}: {
  label: string
  description?: string
  value: boolean
  onChange: (v: boolean) => void
}) => (
  <div className="flex items-center justify-between py-2">
    <div>
      <p className="text-white text-sm font-medium">{label}</p>
      {description && (
        <p className="text-gray-500 text-xs mt-0.5">{description}</p>
      )}
    </div>
    <button
      onClick={() => onChange(!value)}
      className={
        "relative w-11 h-6 rounded-full transition-all duration-200 " +
        (value ? "bg-purple-600" : "bg-gray-700")
      }
    >
      <span className={
        "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200 " +
        (value ? "translate-x-5" : "translate-x-0")
      } />
    </button>
  </div>
)

export const Settings = () => {
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)
  const [ollamaStatus, setOllamaStatus] = useState<"checking" | "online" | "offline">("checking")
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking")
  const [apiVersion, setApiVersion] = useState("")

  useEffect(() => {
    // Load saved settings
    const saved = localStorage.getItem("llmstore-settings")
    if (saved) {
      try { setSettings(JSON.parse(saved)) } catch {}
    }
    checkConnections()
  }, [])

  const checkConnections = async () => {
    // Check backend
    try {
      const res = await axios.get(API_BASE + "/")
      setBackendStatus("online")
      setApiVersion(res.data.version || "1.0.0")
    } catch {
      setBackendStatus("offline")
    }

    // Check ollama
    try {
      await axios.get(API_BASE + "/api/v1/chat/models")
      setOllamaStatus("online")
    } catch {
      setOllamaStatus("offline")
    }
  }

  const handleSave = () => {
    localStorage.setItem("llmstore-settings", JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const update = (key: keyof SettingsData, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const generateApiKey = () => {
    const key = "llms_" + Array.from(
      { length: 32 },
      () => Math.random().toString(36)[2]
    ).join("")
    update("api_key", key)
  }

  const StatusDot = ({ status }: { status: "checking" | "online" | "offline" }) => (
    <span className={
      "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border " +
      (status === "online"
        ? "bg-green-500/20 text-green-400 border-green-500/30"
        : status === "offline"
        ? "bg-red-500/20 text-red-400 border-red-500/30"
        : "bg-gray-500/20 text-gray-400 border-gray-500/30")
    }>
      <span className={
        "w-1.5 h-1.5 rounded-full " +
        (status === "online"
          ? "bg-green-400 animate-pulse"
          : status === "offline"
          ? "bg-red-400"
          : "bg-gray-400 animate-pulse")
      } />
      {status === "online" ? "Online" : status === "offline" ? "Offline" : "Checking..."}
    </span>
  )

  return (
    <div className="flex-1">
      <TopBar
        title="Settings"
        subtitle="Configure LLMStore"
      />

      <div className="p-8 space-y-6 max-w-3xl">

        {/* Connection Status */}
        <Section
          title="Connection Status"
          description="Current status of all services"
          icon={<Globe size={18} className="text-purple-400" />}
        >
          <div className="space-y-3">
            {[
              {
                label: "LLMStore Backend",
                url: API_BASE,
                status: backendStatus,
                detail: backendStatus === "online" ? "v" + apiVersion + " • " + API_BASE : "Cannot connect"
              },
              {
                label: "Ollama Service",
                url: settings.ollama_url,
                status: ollamaStatus,
                detail: ollamaStatus === "online" ? settings.ollama_url : "Not running"
              }
            ].map(({ label, status, detail }) => (
              <div
                key={label}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
              >
                <div>
                  <p className="text-white text-sm font-medium">{label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{detail}</p>
                </div>
                <StatusDot status={status} />
              </div>
            ))}
          </div>
          <button
            onClick={checkConnections}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <RefreshCw size={14} /> Refresh Status
          </button>
        </Section>

        {/* Server Config */}
        <Section
          title="Server Configuration"
          description="Configure backend and Ollama connections"
          icon={<Server size={18} className="text-purple-400" />}
        >
          <div>
            <label className="text-gray-400 text-sm block mb-1.5">
              Ollama API URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.ollama_url}
                onChange={e => update("ollama_url", e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="http://localhost:11434"
              />
              <a
                href={settings.ollama_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg flex items-center justify-center transition-colors"
              >
                <ExternalLink size={14} className="text-gray-400" />
              </a>
            </div>
            <p className="text-gray-600 text-xs mt-1">
              Default: http://localhost:11434
            </p>
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-1.5">
              Max Concurrent Models
            </label>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 5, 10].map(n => (
                <button
                  key={n}
                  onClick={() => update("max_models", n)}
                  className={
                    "w-10 h-10 rounded-lg text-sm font-semibold transition-all " +
                    (settings.max_models === n
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700")
                  }
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-gray-600 text-xs mt-1">
              Depends on available VRAM/RAM
            </p>
          </div>

          <Toggle
            label="Auto-start Ollama"
            description="Automatically start Ollama service on deployment"
            value={settings.auto_start}
            onChange={v => update("auto_start", v)}
          />
        </Section>

        {/* API Keys */}
        <Section
          title="API Key Management"
          description="Manage access keys for the LLMStore API"
          icon={<Key size={18} className="text-purple-400" />}
        >
          <div>
            <label className="text-gray-400 text-sm block mb-1.5">
              API Key
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.api_key}
                onChange={e => update("api_key", e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-purple-500"
                placeholder="Generate an API key..."
                readOnly
              />
              <button
                onClick={generateApiKey}
                className="btn-primary text-sm py-2"
              >
                Generate
              </button>
            </div>
            {settings.api_key && (
              <p className="text-yellow-400 text-xs mt-1 flex items-center gap-1">
                ⚠️ Save this key — it won&apos;t be shown again after saving
              </p>
            )}
          </div>
        </Section>

        {/* Notifications */}
        <Section
          title="Notifications"
          description="Configure alerts and notifications"
          icon={<Bell size={18} className="text-purple-400" />}
        >
          <Toggle
            label="Deployment Notifications"
            description="Get notified when model deployment completes"
            value={settings.notifications}
            onChange={v => update("notifications", v)}
          />
          <Toggle
            label="Error Alerts"
            description="Get notified when a model crashes or fails"
            value={true}
            onChange={() => {}}
          />
          <Toggle
            label="Resource Warnings"
            description="Alert when CPU/RAM usage exceeds 90%"
            value={true}
            onChange={() => {}}
          />
        </Section>

        {/* System Info */}
        <Section
          title="System Information"
          description="LLMStore version and system details"
          icon={<Database size={18} className="text-purple-400" />}
        >
          <div className="space-y-2">
            {[
              { label: "LLMStore Version", value: "v1.0.0" },
              { label: "Backend API", value: API_BASE },
              { label: "Environment", value: "Development" },
              { label: "License", value: "Commercial" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0"
              >
                <span className="text-gray-500 text-sm">{label}</span>
                <span className="text-white text-sm font-medium">{value}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-gray-600 text-sm">
            Settings are saved locally in your browser
          </p>
          <button
            onClick={handleSave}
            className={
              "flex items-center gap-2 font-semibold px-6 py-2.5 rounded-lg transition-all " +
              (saved
                ? "bg-green-600 text-white"
                : "bg-purple-600 hover:bg-purple-700 text-white")
            }
          >
            {saved
              ? <><CheckCircle size={16} /> Saved!</>
              : <><Save size={16} /> Save Settings</>
            }
          </button>
        </div>

      </div>
    </div>
  )
}
