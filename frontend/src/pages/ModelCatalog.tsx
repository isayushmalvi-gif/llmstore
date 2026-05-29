import { useState, useMemo } from 'react'
import { TopBar } from '../components/layout/TopBar'
import { ModelCard } from '../components/models/ModelCard'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { ErrorMessage } from '../components/common/ErrorMessage'
import { useModels } from '../hooks/useModels'
import type { Model } from '../types/models'
import {
  Search, Filter, Cpu, Zap,
  HardDrive, SlidersHorizontal
} from 'lucide-react'

const CATEGORIES = ["All", "LLM", "Code", "Vision", "Speech", "Embedding"]

export const ModelCatalog = () => {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [compatibleOnly, setCompatibleOnly] = useState(false)
  const [sortBy, setSortBy] = useState<"benchmark" | "size" | "name">("benchmark")
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)

  const params = useMemo(() => ({
    category: category === "All" ? undefined : category,
    search: search || undefined,
    compatible_only: compatibleOnly
  }), [category, search, compatibleOnly])

  const { data, loading, error, refresh } = useModels(params)

  const sortedModels = useMemo(() => {
    if (!data?.models) return []
    return [...data.models].sort((a, b) => {
      if (sortBy === "benchmark") return b.benchmark_score - a.benchmark_score
      if (sortBy === "size") return a.size_gb - b.size_gb
      if (sortBy === "name") return a.name.localeCompare(b.name)
      return 0
    })
  }, [data?.models, sortBy])

  const handleDeploy = (model: Model) => {
    setSelectedModel(model)
  }

  const stats = useMemo(() => {
    if (!data?.models) return { compatible: 0, possible: 0, incompatible: 0 }
    return {
      compatible: data.models.filter(m => m.compatibility.status === "COMPATIBLE").length,
      possible: data.models.filter(m => m.compatibility.status === "POSSIBLE").length,
      incompatible: data.models.filter(m => m.compatibility.status === "INCOMPATIBLE").length,
    }
  }, [data?.models])

  return (
    <div className="flex-1">
      <TopBar
        title="Model Catalog"
        subtitle="Browse and deploy open-source AI models"
        onRefresh={refresh}
        loading={loading}
      />

      <div className="p-8">

        {/* Hardware Summary Banner */}
        {data?.hardware && (
          <div className="card mb-6 bg-gradient-to-r from-purple-900/20 to-gray-900 border-purple-800/30">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-white font-semibold mb-1">
                  Your Hardware Profile
                </h3>
                <p className="text-gray-400 text-sm">
                  Models are filtered based on your system specs
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                    <Cpu size={12} /> RAM
                  </div>
                  <p className="text-white font-bold">{data.hardware.ram_gb} GB</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                    <Zap size={12} /> VRAM
                  </div>
                  <p className="text-white font-bold">
                    {data.hardware.has_gpu ? `${data.hardware.vram_gb} GB` : "No GPU"}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                    <HardDrive size={12} /> Storage
                  </div>
                  <p className="text-white font-bold">{data.hardware.storage_gb.toFixed(0)} GB free</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-green-400 font-bold text-xl">{stats.compatible}</p>
                  <p className="text-gray-500 text-xs">Compatible</p>
                </div>
                <div className="text-center">
                  <p className="text-yellow-400 font-bold text-xl">{stats.possible}</p>
                  <p className="text-gray-500 text-xs">Possible</p>
                </div>
                <div className="text-center">
                  <p className="text-red-400 font-bold text-xl">{stats.incompatible}</p>
                  <p className="text-gray-500 text-xs">Incompatible</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search models..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3">
            <SlidersHorizontal size={15} className="text-gray-500" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as "benchmark" | "size" | "name")}
              className="bg-transparent text-gray-400 text-sm py-2.5 focus:outline-none cursor-pointer"
            >
              <option value="benchmark">Sort: Best Score</option>
              <option value="size">Sort: Smallest</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>

          {/* Compatible Only Toggle */}
          <button
            onClick={() => setCompatibleOnly(!compatibleOnly)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
              compatibleOnly
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700"
            }`}
          >
            <Filter size={15} />
            Compatible Only
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                category === cat
                  ? "bg-purple-600 text-white"
                  : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-800"
              }`}
            >
              {cat}
              {data?.models && cat !== "All" && (
                <span className="ml-2 text-xs opacity-60">
                  {data.models.filter(m => m.category === cat).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Results Count */}
        {data && !loading && (
          <p className="text-gray-500 text-sm mb-4">
            Showing <span className="text-white font-medium">{sortedModels.length}</span> models
            {category !== "All" && <span> in <span className="text-purple-400">{category}</span></span>}
            {search && <span> matching <span className="text-purple-400">"{search}"</span></span>}
          </p>
        )}

        {/* Loading & Error States */}
        {loading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} onRetry={refresh} />}

        {/* Models Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedModels.map(model => (
              <ModelCard
                key={model.id}
                model={model}
                onDeploy={handleDeploy}
              />
            ))}
            {sortedModels.length === 0 && (
              <div className="col-span-3 text-center py-16">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-gray-600" />
                </div>
                <p className="text-gray-500 font-medium">No models found</p>
                <p className="text-gray-600 text-sm mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deploy Modal */}
      {selectedModel && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedModel(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-xl mb-2">
              Deploy {selectedModel.name}
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              This will download and deploy {selectedModel.name} ({selectedModel.size_gb} GB) on your server.
            </p>
            <div className="space-y-3 mb-6">
              {[
                { label: "Model Size", value: `${selectedModel.size_gb} GB` },
                { label: "Parameters", value: selectedModel.parameters },
                { label: "Ollama ID", value: selectedModel.ollama_id },
                { label: "License", value: selectedModel.license },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-gray-800 last:border-0">
                  <span className="text-gray-500 text-sm">{label}</span>
                  <span className="text-white text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedModel(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-all"
                onClick={() => {
                  alert(`Deployment feature coming soon!\nWill run: ollama pull ${selectedModel.ollama_id}`)
                  setSelectedModel(null)
                }}
              >
                Confirm Deploy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
