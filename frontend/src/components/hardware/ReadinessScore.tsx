interface ReadinessScoreProps {
  score: number
  status: string
}

export const ReadinessScore = ({ score, status }: ReadinessScoreProps) => {
  const color = status === "EXCELLENT" ? "#22c55e" : status === "GOOD" ? "#3b82f6" : status === "MODERATE" ? "#eab308" : "#ef4444"
  const badgeClass = status === "EXCELLENT" ? "badge-excellent" : status === "GOOD" ? "badge-good" : status === "MODERATE" ? "badge-moderate" : "badge-limited"
  const description = status === "EXCELLENT" ? "Ready for largest AI models" : status === "GOOD" ? "Ready for most AI models" : status === "MODERATE" ? "Ready for medium AI models" : "Ready for small AI models only"
  const circumference = 2 * Math.PI * 45
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="card flex flex-col items-center justify-center p-8">
      <h3 className="text-gray-400 text-sm font-medium mb-6">System Readiness Score</h3>
      <div className="relative w-36 h-36 mb-6">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#1f2937" strokeWidth="8" />
          <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{score}</span>
          <span className="text-gray-500 text-xs">/ 100</span>
        </div>
      </div>
      <span className={badgeClass}>{status}</span>
      <p className="text-gray-500 text-xs text-center mt-4 max-w-xs">{description}</p>
    </div>
  )
}
