import { useState, useEffect, useCallback } from 'react'
import {
  HardDrive, Trash2, RefreshCw,
  Package, AlertTriangle
} from 'lucide-react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface InstalledModel {
  name: string
  size_gb: number
  modified_at: string
}

export const InstalledModels = () => {
  const [models, setModels] = useState<InstalledModel[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [message, setMessage] = useState<{
    text: string, type: 'success' | 'error'
  } | null>(null)

  const fetchModels = useCallback(async () => {
    try {
      setLoading(true)
      const r = await axios.get(
        API_BASE + '/api/v1/installed-models'
      )
      setModels(r.data.models || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  const handleDelete = async (modelName: string) => {
    try {
      setDeleting(modelName)
      setConfirmDelete(null)
      const r = await axios.delete(
        API_BASE + `/api/v1/installed-models/${modelName}`
      )
      if (r.data.success) {
        setMessage({
          text: modelName + " removed successfully!",
          type: 'success'
        })
        fetchModels()
      } else {
        setMessage({
          text: "Failed: " + r.data.message,
          type: 'error'
        })
      }
    } catch (err) {
      setMessage({
        text: "Error removing model",
        type: 'error'
      })
    } finally {
      setDeleting(null)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const totalSize = models.reduce(
    (acc, m) => acc + m.size_gb, 0
  ).toFixed(1)

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/20 rounded-lg
                          flex items-center justify-center">
            <Package size={20} className="text-orange-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">
              Installed Models
            </h3>
            <p className="text-gray-500 text-xs">
              {models.length} models • {totalSize} GB used
            </p>
          </div>
        </div>
        <button
          onClick={fetchModels}
          disabled={loading}
          className="btn-secondary text-sm py-2"
        >
          <RefreshCw
            size={14}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={
          "flex items-center gap-2 px-4 py-3 rounded-lg mb-4 text-sm " +
          (message.type === 'success'
            ? "bg-green-500/10 border border-green-500/20 text-green-400"
            : "bg-red-500/10 border border-red-500/20 text-red-400")
        }>
          {message.type === 'success' ? '✅' : '❌'}
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
            <Package size={24} className="text-gray-600" />
          </div>
          <p className="text-gray-500 font-medium">
            No models installed
          </p>
          <p className="text-gray-600 text-sm text-center">
            Deploy a model first to see it here
          </p>
        </div>
      )}

      {/* Models list */}
      {!loading && models.length > 0 && (
        <div className="space-y-3">
          {models.map(model => (
            <div key={model.name}
              className="flex items-center justify-between
                         p-4 bg-gray-800/50 rounded-xl
                         border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20
                                rounded-lg flex items-center
                                justify-center">
                  <Package size={18}
                    className="text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {model.name}
                  </p>
                  <div className="flex items-center gap-3
                                  mt-0.5">
                    <span className="text-gray-500 text-xs
                                     flex items-center gap-1">
                      <HardDrive size={10} />
                      {model.size_gb} GB
                    </span>
                    {model.modified_at && (
                      <span className="text-gray-600 text-xs">
                        {new Date(model.modified_at)
                          .toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Confirm delete */}
                {confirmDelete === model.name ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1
                                    text-yellow-400 text-xs
                                    bg-yellow-500/10 px-2 py-1
                                    rounded border
                                    border-yellow-500/20">
                      <AlertTriangle size={12} />
                      Sure?
                    </div>
                    <button
                      onClick={() => handleDelete(model.name)}
                      disabled={deleting === model.name}
                      className="bg-red-500/20 hover:bg-red-500/30
                                 text-red-400 border border-red-500/30
                                 text-xs font-semibold px-3 py-1.5
                                 rounded-lg transition-all"
                    >
                      {deleting === model.name
                        ? 'Removing...'
                        : 'Yes, Remove'
                      }
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="bg-gray-700 hover:bg-gray-600
                                 text-gray-400 text-xs font-semibold
                                 px-3 py-1.5 rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(model.name)}
                    disabled={deleting !== null}
                    className="flex items-center gap-2
                               bg-red-500/20 hover:bg-red-500/30
                               text-red-400 border border-red-500/30
                               font-semibold px-4 py-2 rounded-lg
                               text-sm transition-all
                               disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Total storage */}
          <div className="mt-4 pt-4 border-t border-gray-800
                          flex items-center justify-between">
            <span className="text-gray-500 text-sm">
              Total storage used
            </span>
            <span className="text-white font-semibold">
              {totalSize} GB
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
