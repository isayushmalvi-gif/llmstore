import { useEffect, useRef } from 'react'
import { Terminal } from 'lucide-react'

interface Props {
  logs: string[]
  title?: string
}

export const LogViewer = ({ logs, title = "Deployment Logs" }: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const getLogColor = (log: string) => {
    if (log.includes("✅") || log.includes("🎉") || log.includes("success"))
      return "text-green-400"
    if (log.includes("❌") || log.includes("failed") || log.includes("error"))
      return "text-red-400"
    if (log.includes("⚠️") || log.includes("Warning"))
      return "text-yellow-400"
    if (log.includes("📥") || log.includes("Downloading"))
      return "text-blue-400"
    if (log.includes("🚀") || log.includes("Starting"))
      return "text-purple-400"
    if (log.includes("📡") || log.includes("API"))
      return "text-cyan-400"
    return "text-gray-300"
  }

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-gray-900">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <span className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <div className="flex items-center gap-2 ml-2">
          <Terminal size={14} className="text-gray-500" />
          <span className="text-gray-400 text-xs font-medium">{title}</span>
        </div>
      </div>
      <div className="h-64 overflow-y-auto p-4 font-mono text-xs space-y-1">
        {logs.length === 0 ? (
          <p className="text-gray-600">Waiting for logs...</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className={"leading-relaxed " + getLogColor(log)}>
              {log || <span className="opacity-0">-</span>}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
