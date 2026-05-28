import { RefreshCw, Bell } from 'lucide-react'

interface TopBarProps {
  title: string
  subtitle?: string
  onRefresh?: () => void
  loading?: boolean
}

export const TopBar = ({ title, subtitle, onRefresh, loading }: TopBarProps) => {
  return (
    <div className="h-16 border-b border-gray-800 bg-gray-950 flex items-center justify-between px-8 sticky top-0 z-10">
      <div>
        <h2 className="text-white font-semibold text-lg leading-none">{title}</h2>
        {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {onRefresh && (
          <button onClick={onRefresh} disabled={loading}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        )}
        <button className="w-9 h-9 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors relative">
          <Bell size={16} className="text-gray-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full"></span>
        </button>
      </div>
    </div>
  )
}
