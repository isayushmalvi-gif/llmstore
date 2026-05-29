import { useState, useEffect, useCallback } from 'react'
import { TopBar } from '../components/layout/TopBar'
import { DeploymentCard } from '../components/deployment/DeploymentCard'
import { LogViewer } from '../components/deployment/LogViewer'
import { StatusBadge } from '../components/deployment/StatusBadge'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { deploymentApi } from '../services/deploymentApi'
import { modelsApi } from '../services/modelsApi'
import type { DeploymentInfo, DeploymentsResponse } from '../types/deployment'
import type { Model } from '../types/models'
import {
  Rocket, Plus, Search, X,
  CheckCircle, XCircle, Zap
} from 'lucide-react'
import { RunningModels } from '../components/models/RunningModels'
import { InstalledModels } from '../components/models/InstalledModels'

export const Deployments = () => {
  const [data, setData] = useState<DeploymentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeployModal, setShowDeployModal] = useState(false)
  const [models, setModels] = useState<Model[]>([])
  const [modelSearch, setModelSearch] = useState("")
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [deploying, setDeploying] = useState(false)
  const [activeDeployment, setActiveDeployment] = useState<DeploymentInfo | null>(null)
  const [deployLogs, setDeployLogs] = useState<string[]>([])

  const fetchDeployments = useCallback(async () => {
    try {
      const result = await deploymentApi.getAll()
      setData(result)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDeployments()
    const interval = setInterval(fetchDeployments, 3000)
    return () => clearInterval(interval)
  }, [fetchDeployments])

  useEffect(() => {
    modelsApi.getModels().then(r => setModels(r.models))
  }, [])

  const filteredModels = models.filter(m =>
    m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
    m.category.toLowerCase().includes(modelSearch.toLowerCase())
  )

  const handleDeploy = async () => {
    if (!selectedModel) return
    setDeploying(true)
    setDeployLogs([])

    try {
      const result = await deploymentApi.deploy({
        model_id: selectedModel.id,
        model_name: selectedModel.name,
        ollama_id: selectedModel.ollama_id
      })

      const deploymentId = result.deployment_id
      setShowDeployModal(false)

      const pollLogs = async () => {
        let done = false
        while (!done) {
          await new Promise(r => setTimeout(r, 1000))
          try {
            const dep = await deploymentApi.getOne(deploymentId)
            setDeployLogs([...dep.logs])
            setActiveDeployment(dep)
            if (["RUNNING", "FAILED", "STOPPED"].includes(dep.status)) {
              done = true
            }
          } catch {
            done = true
          }
        }
      }

      pollLogs()
      fetchDeployments()

    } catch (err) {
      console.error(err)
    } finally {
      setDeploying(false)
      setSelectedModel(null)
      setModelSearch("")
    }
  }

  const handleStop = async (id: string) => {
    await deploymentApi.stop(id)
    fetchDeployments()
  }

  const handleDelete = async (id: string) => {
    await deploymentApi.remove(id)
    if (activeDeployment?.id === id) setActiveDeployment(null)
    fetchDeployments()
  }

  return (
    <div className="flex-1">
      <TopBar
        title="Deployments"
        subtitle="Deploy and manage AI models on your server"
        onRefresh={fetchDeployments}
        loading={loading}
      />

      <div className="p-8 space-y-6">

        {data && (
          <div className={
            "card flex items-center justify-between " +
            (data.ollama_running
              ? "border-green-800/30 bg-green-900/10"
              : "border-red-800/30 bg-red-900/10")
          }>
            <div className="flex items-center gap-3">
              <div className={
                "w-10 h-10 rounded-full flex items-center justify-center " +
                (data.ollama_running ? "bg-green-500/20" : "bg-red-500/20")
              }>
                {data.ollama_running
                  ? <CheckCircle size={20} className="text-green-400" />
                  : <XCircle size={20} className="text-red-400" />
                }
              </div>
              <div>
                <p className="text-white font-semibold">
                  Ollama — {data.ollama_running ? "Running ✅" : "Not Running ❌"}
                </p>
                <p className="text-gray-500 text-xs">
                  {data.ollama_running
                    ? data.running_models.length + " model(s) loaded • API: http://localhost:11434"
                    : "Ollama starts automatically when you deploy a model"
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDeployModal(true)}
              className="btn-primary"
            >
              <Plus size={16} /> Deploy Model
            </button>
          </div>
        )}

        {activeDeployment &&
          !["RUNNING", "FAILED", "STOPPED"].includes(activeDeployment.status) && (
          <div className="card border-purple-800/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Rocket size={16} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">
                    Deploying {activeDeployment.model_name}
                  </p>
                  <p className="text-gray-500 text-xs">Please wait...</p>
                </div>
              </div>
              <StatusBadge status={activeDeployment.status} pulse />
            </div>
            <LogViewer logs={deployLogs} title="Live Deployment Logs" />
          </div>
        )}

        {loading ? <LoadingSpinner /> : (
          data && data.deployments.length > 0 ? (
            <div>
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Zap size={18} className="text-yellow-400" />
                All Deployments ({data.total})
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.deployments.map(dep => (
                  <DeploymentCard
                    key={dep.id}
                    deployment={dep}
                    onStop={handleStop}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="card border-dashed border-gray-700 flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                <Rocket size={28} className="text-gray-600" />
              </div>
              <p className="text-gray-500 font-medium text-lg">No Deployments Yet</p>
              <p className="text-gray-600 text-sm text-center max-w-sm">
                Deploy your first AI model to get started.
                It will be available as an API endpoint instantly.
              </p>
              <button
                onClick={() => setShowDeployModal(true)}
                className="btn-primary mt-2"
              >
                <Plus size={16} /> Deploy First Model
              </button>
            </div>
          )
        )}
      </div>

      {/* Running Models */}
      <RunningModels />

      {/* Installed Models */}
      <InstalledModels />

      {showDeployModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeployModal(false)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div>
                <h3 className="text-white font-bold text-xl">Deploy a Model</h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  Select a model to deploy on your server
                </p>
              </div>
              <button
                onClick={() => setShowDeployModal(false)}
                className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-800">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search models..."
                  value={modelSearch}
                  onChange={e => setModelSearch(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredModels.map(model => (
                <div
                  key={model.id}
                  onClick={() => setSelectedModel(
                    selectedModel?.id === model.id ? null : model
                  )}
                  className={
                    "flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border " +
                    (selectedModel?.id === model.id
                      ? "bg-purple-600/20 border-purple-500/50"
                      : "bg-gray-800/50 border-gray-800 hover:border-gray-700 ") +
                    (model.compatibility.status === "INCOMPATIBLE" ? "opacity-50" : "")
                  }
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-semibold">{model.name}</p>
                      <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">
                        {model.category}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs">
                      {model.parameters} • {model.size_gb} GB • {model.provider}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={
                      "text-xs px-2 py-1 rounded-full border font-medium " +
                      (model.compatibility.status === "COMPATIBLE"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : model.compatibility.status === "POSSIBLE"
                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30")
                    }>
                      {model.compatibility.status}
                    </span>
                    {selectedModel?.id === model.id && (
                      <CheckCircle size={18} className="text-purple-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-800 flex items-center justify-between">
              <p className="text-gray-500 text-sm">
                {selectedModel
                  ? "Selected: " + selectedModel.name + " (" + selectedModel.size_gb + " GB)"
                  : "Select a model to deploy"
                }
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeployModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeploy}
                  disabled={!selectedModel || deploying}
                  className={
                    "btn-primary " +
                    (!selectedModel || deploying ? "opacity-50 cursor-not-allowed" : "")
                  }
                >
                  <Rocket size={16} />
                  {deploying ? "Deploying..." : "Deploy Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
