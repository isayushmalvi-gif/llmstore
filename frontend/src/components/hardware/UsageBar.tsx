interface UsageBarProps {
  label: string
  value: number
  max: number
  unit: string
  color?: string
}

export const UsageBar = ({ label, value, max, unit, color = "bg-purple-500" }: UsageBarProps) => {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0
  const barColor = percent >= 90 ? "bg-red-500" : percent >= 70 ? "bg-yellow-500" : color

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-medium">{value.toFixed(1)} / {max.toFixed(1)} {unit}</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      <div className="text-right text-xs text-gray-500">{percent}% used</div>
    </div>
  )
}
