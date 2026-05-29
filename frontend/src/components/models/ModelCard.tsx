import { useState } from 'react'
import type { Model } from '../../types/models'
import { CompatibilityBadge } from './CompatibilityBadge'
import {
  HardDrive, Cpu, Zap, ChevronDown,
  ChevronUp, Star, Download
} from 'lucide-react'

interface Props {
  model: Model
  onDeploy?: (model: Model) => void
}

export const ModelCard = ({ model, onDeploy }: Props) => {
  const [expanded, setExpanded] = useState(false)

  const categoryColors: Record<string, string> = {
    LLM: "bg-purple-500/20 text-purple-400",
    Code: "bg-blue-500/20 text-blue-400",
    Vision: "bg-pink-500/20 text-pink-400",
    Speech: "bg-green-500/20 text-green-400",
    Embedding: "bg-orange-500/20 text-orange-400",
  }

  const categoryColor = categoryColors[model.category] || "bg-gray-500/20 text-gray-400"

  const getBenchmarkColor = (score: number) => {
    if (score >= 85) return "text-green-400"
    if (score >= 70) return "text-yellow-400"
    return "text-gray-400"
  }

  return (
    <div className={`card-hover flex flex-col transition-all duration-300 ${
      model.compatibility.status === "INCOMPATIBLE" ? "opacity-60" : ""
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor}`}>
              {model.category}
            </span>
            {model.featured && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
                <Star size={10} fill="currentColor" /> Featured
              </span>
            )}
            {model.commercial_use && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-700 text-gray-400">
                Commercial ✓
              </span>
            )}
          </div>
          <h3 className="text-white font-bold text-lg leading-tight">{model.name}</h3>
          <p className="text-gray-500 text-xs mt-0.5">by {model.provider}</p>
        </div>
        <CompatibilityBadge compatibility={model.compatibility} />
      </div>

      {/* Description */}
      <p className="text-gray-400 text-sm mb-4 leading-relaxed line-clamp-2">
        {model.description}
      </p>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mb-1">
            <Cpu size={11} /> Params
          </div>
          <p className="text-white font-semibold text-sm">{model.parameters}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mb-1">
            <HardDrive size={11} /> Size
          </div>
          <p className="text-white font-semibold text-sm">{model.size_gb} GB</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mb-1">
            <Star size={11} /> Score
          </div>
          <p className={`font-semibold text-sm ${getBenchmarkColor(model.benchmark_score)}`}>
            {model.benchmark_score}/100
          </p>
        </div>
      </div>

      {/* Requirements */}
      <div className="flex items-center gap-3 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Cpu size={12} /> {model.min_ram_gb}GB RAM min
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Zap size={12} />
          {model.min_vram_gb > 0 ? `${model.min_vram_gb}GB VRAM` : "CPU OK"}
        </span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {model.tags.slice(0, 4).map(tag => (
          <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
            #{tag}
          </span>
        ))}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-800 pt-4 mb-4 space-y-3">
          <div>
            <p className="text-gray-500 text-xs mb-1.5 font-medium uppercase tracking-wide">
              Use Cases
            </p>
            <div className="flex flex-wrap gap-1.5">
              {model.use_cases.map(uc => (
                <span key={uc} className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">
                  {uc}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1.5 font-medium uppercase tracking-wide">
              Quantization Options
            </p>
            <div className="flex flex-wrap gap-1.5">
              {model.quantization.map(q => (
                <span key={q} className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                  {q}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Context Length: </span>
              <span className="text-white">
                {model.context_length > 0 ? `${(model.context_length / 1000).toFixed(0)}K tokens` : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">License: </span>
              <span className="text-white">{model.license}</span>
            </div>
          </div>
          <CompatibilityBadge compatibility={model.compatibility} showIssues />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-2">
        <button
          onClick={() => onDeploy?.(model)}
          disabled={model.compatibility.status === "INCOMPATIBLE"}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            model.compatibility.status === "INCOMPATIBLE"
              ? "bg-gray-800 text-gray-600 cursor-not-allowed"
              : model.compatibility.status === "COMPATIBLE"
              ? "bg-purple-600 hover:bg-purple-700 text-white"
              : "bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-500/30"
          }`}
        >
          <Download size={15} />
          {model.compatibility.status === "INCOMPATIBLE" ? "Incompatible" : "Deploy Model"}
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
        >
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>
      </div>
    </div>
  )
}
