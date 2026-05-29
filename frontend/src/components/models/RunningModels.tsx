import { useState, useEffect, useCallback } from "react"
import { Zap, PowerOff, RefreshCw, AlertTriangle } from "lucide-react"
import axios from "axios"

const API_BASE = import.meta.env.VITE_API_URL || ""

interface RunningModel {
  name: string
  size_gb: number
  vram_gb: number
  expires_at: string
  status: "loaded" | "installed"
}

export const RunningModels = () => {
  const [models, setModels] = useState<RunningModel[]>([])
  const [loading, setLoading] = useState(true)
  const [offloading, setOffloading] = useState<string | null>(null)
  const [offloadingAll, setOffloadingAll] = useState(false)
  const [message, setMessage] = useState<{
    text: string
    type: "success" | "error"
  } | null>(null)

  const fetchRunning = useCallback(async () => {
    try {
      setLoading(true)
      const r = await axios.get(
        API_BASE + "/api/v1/models/running"
      )
      setModels(r.data.models || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRunning()
    const interval = setInterval(fetchRunning, 5000)
    return () => clearInterval(interval)
  }, [fetchRunning])

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleOffload = async (modelName: string) => {
    try {
      setOffloading(modelName)
      const r = await axios.post(
        API_BASE + `/api/v1/running-models/${modelName}/offload`
      )
      if (r.data.success) {
        showMessage(modelName + " offloaded!", "success")
        fetchRunning()
      } else {
        showMessage("Failed: " + r.data.message, "error")
      }
    } catch {
      showMessage("Error offloading model", "error")
    } finally {
      setOffloading(null)
    }
  }

  const handleOffloadAll = async () => {
    try {
      setOffloadingAll(true)
      const r = await axios.post(
        API_BASE + "/api/v1/models/running/offload-all"
      )
      if (r.data.success) {
        showMessage(r.data.message, "success")
        fetchRunning()
      } else {
        showMessage("Failed: " + r.data.message, "error")
      }
    } catch {
      showMessage("Error offloading models", "error")
    } finally {
      setOffloadingAll(false)
    }
  }

  const totalVram = models.reduce(
    (acc, m) => acc + m.vram_gb, 0
  ).toFixed(1)

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg
                          flex items-center justify-center">
            <Zap size={20} className="text-green-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">
              Model Memory Manager
            </h3>
            <p className="text-gray-500 text-xs">
              {models.filter(m => m.status === "loaded").length} in RAM •
              {models.length} installed •
              {totalVram} GB VRAM used
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {models.length > 0 && (
            <button
              onClick={handleOffloadAll}
              disabled={offloadingAll}
              className="flex items-center gap-2
                         bg-red-500/20 hover:bg-red-500/30
                         text-red-400 border border-red-500/30
                         font-semibold px-4 py-2 rounded-lg
                         text-sm transition-all
                         disabled:opacity-50"
            >
              <PowerOff size={14} />
              {offloadingAll ? "Offloading..." : "Offload All"}
            </button>
          )}
          <button
            onClick={fetchRunning}
            disabled={loading}
            className="btn-secondary text-sm py-2"
          >
            <RefreshCw
              size={14}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={
          "flex items-center gap-2 px-4 py-3 rounded-lg mb-4 text-sm " +
          (message.type === "success"
            ? "bg-green-500/10 border border-green-500/20 text-green-400"
            : "bg-red-500/10 border border-red-500/20 text-red-400")
        }>
          {message.type === "success" ? "✅" : "❌"}
          {message.text}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-gray-800
                          border-t-purple-500 rounded-full
                          animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && models.length === 0 && (
        <div className="flex flex-col items-center
                        justify-center py-12 gap-3">
          <div className="w-14 h-14 bg-gray-800 rounded-full
                          flex items-center justify-center">
            <Zap size={24} className="text-gray-600" />
          </div>
          <p className="text-gray-500 font-medium">
            No models loaded in memory
          </p>
          <p className="text-gray-600 text-sm text-center">
            Models load into RAM automatically when used.
            Offload them to free up RAM.
          </p>
        </div>
      )}

      {/* Models list */}
      {!loading && models.length > 0 && (
        <div className="space-y-3">
          {models.map(model => (
            <div
              key={model.name}
              className="flex items-center justify-between
                         p-4 bg-gray-800/50 rounded-xl
                         border border-gray-700"
            >
              <div className="flex items-center gap-3">
                {/* Status dot */}
                <div className="relative">
                  <div className="w-10 h-10 bg-green-500/20
                                  rounded-lg flex items-center
                                  justify-center">
                    <Zap size={18} className="text-green-400" />
                  </div>
                  <span className="absolute -top-1 -right-1
                                   w-3 h-3 bg-green-400
                                   rounded-full animate-pulse" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {model.name}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {model.vram_gb > 0 && (
                      <span className="text-gray-500 text-xs
                                       flex items-center gap-1">
                        <Zap size={10} />
                        {model.vram_gb} GB VRAM
                      </span>
                    )}
                    {model.size_gb > 0 && (
                      <span className="text-gray-500 text-xs">
                        {model.size_gb} GB RAM
                      </span>
                    )}
                    <span className={
                      "text-xs font-medium px-2 py-0.5 rounded-full " +
                      (model.status === "loaded"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-700 text-gray-400")
                    }>
                      {model.status === "loaded"
                        ? "● In RAM"
                        : "● On Disk"}
                    </span>
                  </div>
                </div>
              </div>

              {model.status === "loaded" ? (
                <button
                  onClick={() => handleOffload(model.name)}
                  disabled={offloading === model.name}
                  className="flex items-center gap-2
                             bg-orange-500/20 hover:bg-orange-500/30
                             text-orange-400 border border-orange-500/30
                             font-semibold px-4 py-2 rounded-lg
                             text-sm transition-all
                             disabled:opacity-50"
                >
                  <PowerOff size={14} />
                  {offloading === model.name
                    ? "Offloading..."
                    : "Offload from RAM"
                  }
                </button>
              ) : (
                <span className="text-gray-600 text-xs px-4 py-2">
                  Not in RAM
                </span>
              )}
            </div>
          ))}

          {/* Warning */}
          <div className="flex items-start gap-2 mt-4
                          bg-yellow-500/10 border border-yellow-500/20
                          rounded-lg px-4 py-3">
            <AlertTriangle size={14}
              className="text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-yellow-400 text-xs">
              Offloading removes the model from memory
              but keeps it installed on disk.
              You can reload it anytime by using it.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
