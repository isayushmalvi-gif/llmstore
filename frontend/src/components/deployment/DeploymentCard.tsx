import { useState } from 'react'
import type { DeploymentInfo } from '../../types/deployment'
import { StatusBadge } from './StatusBadge'
import { LogViewer } from './LogViewer'
import {
  Square, Trash2, ChevronDown,
  ChevronUp, ExternalLink, Copy, Check
} from 'lucide-react'

interface Props {
  deployment: DeploymentInfo
  onStop: (id: string) => void
  onDelete: (id: string) => void
}

export const DeploymentCard = ({ deployment, onStop, onDelete }: Props) => {
  const [showLogs, setShowLogs] = useState(false)
  const [copied, setCopied] = useState(false)

  const isActive = ["PENDING", "DOWNLOADING", "STARTING", "RUNNING"].includes(
    deployment.status
  )
  const endpoint = "http://localhost:" + deployment.port

  const copyEndpoint = () => {
    navigator.clipboard.writeText(endpoint)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card-hover">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-white font-bold text-lg">{deployment.model_name}</h3>
          <p className="text-gray-500 text-xs mt-0.5 font-mono">{deployment.ollama_id}</p>
        </div>
        <StatusBadge status={deployment.status} pulse />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-gray-500 text-xs mb-1">Port</p>
          <p className="text-white font-semibold">{deployment.port}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-gray-500 text-xs mb-1">ID</p>
          <p className="text-white font-semibold font-mono text-sm">{deployment.id}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-gray-500 text-xs mb-1">Logs</p>
          <p className="text-white font-semibold">{deployment.logs.length}</p>
        </div>
      </div>

      {deployment.status === "RUNNING" && (
        <div className="flex items-center gap-2 mb-4 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
          <span className="text-green-400 text-xs font-mono flex-1">{endpoint}</span>
          <button
            onClick={copyEndpoint}
            className="text-green-400 hover:text-green-300 transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <a
            href={endpoint}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300 transition-colors"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      )}

      {deployment.error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <p className="text-red-400 text-xs">❌ {deployment.error}</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        {isActive && (
          <button
            onClick={() => onStop(deployment.id)}
            className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-semibold px-4 py-2 rounded-lg text-sm transition-all"
          >
            <Square size={14} /> Stop
          </button>
        )}
        {!isActive && (
          <button
            onClick={() => onDelete(deployment.id)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-400 font-semibold px-4 py-2 rounded-lg text-sm transition-all"
          >
            <Trash2 size={14} /> Remove
          </button>
        )}
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-400 font-semibold px-4 py-2 rounded-lg text-sm transition-all ml-auto"
        >
          {showLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showLogs ? "Hide" : "Show"} Logs
        </button>
      </div>

      {showLogs && (
        <div className="mt-4">
          <LogViewer
            logs={deployment.logs}
            title={deployment.model_name + " logs"}
          />
        </div>
      )}
    </div>
  )
}
