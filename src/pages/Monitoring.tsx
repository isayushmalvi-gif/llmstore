import { Activity } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
export const Monitoring = () => (
  <div className="flex-1">
    <TopBar title="Monitoring" subtitle="Real-time model & hardware metrics" />
    <div className="p-8 flex flex-col items-center justify-center h-96 gap-4">
      <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
        <Activity size={32} className="text-blue-400" />
      </div>
      <h3 className="text-white font-semibold text-xl">Monitoring</h3>
      <p className="text-gray-500 text-center max-w-md">Real-time GPU/CPU usage and latency graphs. Coming in Phase 2! 🚀</p>
    </div>
  </div>
)
