import type { DeploymentStatus } from '../../types/deployment'

interface Props {
  status: DeploymentStatus
  pulse?: boolean
}

export const StatusBadge = ({ status, pulse }: Props) => {
  const config: Record<DeploymentStatus, {
    label: string
    className: string
    dot: string
  }> = {
    PENDING:     { label: "Pending",     className: "bg-gray-500/20 text-gray-400 border-gray-500/30",      dot: "bg-gray-400" },
    DOWNLOADING: { label: "Downloading", className: "bg-blue-500/20 text-blue-400 border-blue-500/30",      dot: "bg-blue-400" },
    STARTING:    { label: "Starting",    className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", dot: "bg-yellow-400" },
    RUNNING:     { label: "Running",     className: "bg-green-500/20 text-green-400 border-green-500/30",    dot: "bg-green-400" },
    STOPPING:    { label: "Stopping",    className: "bg-orange-500/20 text-orange-400 border-orange-500/30", dot: "bg-orange-400" },
    STOPPED:     { label: "Stopped",     className: "bg-gray-500/20 text-gray-400 border-gray-500/30",      dot: "bg-gray-400" },
    FAILED:      { label: "Failed",      className: "bg-red-500/20 text-red-400 border-red-500/30",          dot: "bg-red-400" },
  }

  const { label, className, dot } = config[status] || config.PENDING

  const shouldPulse = pulse && ["DOWNLOADING", "STARTING", "PENDING"].includes(status)

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} ${shouldPulse ? "animate-pulse" : ""}`} />
      {label}
    </span>
  )
}
