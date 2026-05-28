import { Cpu, MemoryStick, HardDrive, Zap, Server, Thermometer } from 'lucide-react'
import { useHardware } from '../hooks/useHardware'
import { HardwareCard } from '../components/hardware/HardwareCard'
import { UsageBar } from '../components/hardware/UsageBar'
import { ReadinessScore } from '../components/hardware/ReadinessScore'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { ErrorMessage } from '../components/common/ErrorMessage'
import { StatCard } from '../components/common/StatCard'
import { TopBar } from '../components/layout/TopBar'

export const Dashboard = () => {
  const { data, loading, error, refresh } = useHardware()
  return (
    <div className="flex-1">
      <TopBar title="Dashboard" subtitle="System hardware overview & AI readiness" onRefresh={refresh} loading={loading} />
      <div className="p-8">
        {loading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} onRetry={refresh} />}
        {data && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="CPU Cores" value={String(data.cpu.cores_physical)} sub={`${data.cpu.cores_logical} logical threads`} icon={<Cpu size={16} className="text-blue-400" />} iconBg="bg-blue-500/20" />
              <StatCard label="Total RAM" value={`${data.ram.total_gb} GB`} sub={`${data.ram.available_gb} GB available`} icon={<MemoryStick size={16} className="text-purple-400" />} iconBg="bg-purple-500/20" />
              <StatCard label="GPU Count" value={String(data.gpus.length)} sub={data.has_gpu ? `${data.total_vram_gb} GB VRAM` : "No GPU detected"} icon={<Zap size={16} className="text-yellow-400" />} iconBg="bg-yellow-500/20" />
              <StatCard label="Storage Free" value={`${data.storage.free_gb} GB`} sub={`of ${data.storage.total_gb} GB total`} icon={<HardDrive size={16} className="text-green-400" />} iconBg="bg-green-500/20" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ReadinessScore score={data.readiness_score} status={data.readiness_status} />
              <HardwareCard title="CPU" iconBg="bg-blue-500/20" icon={<Cpu size={20} className="text-blue-400" />} badge={<span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">{data.cpu.architecture}</span>}>
                <p className="text-gray-300 text-sm font-medium mb-4 truncate">{data.cpu.name}</p>
                <div className="space-y-3">
                  <UsageBar label="CPU Usage" value={data.cpu.usage_percent} max={100} unit="%" color="bg-blue-500" />
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-gray-500 text-xs">Physical Cores</p>
                      <p className="text-white font-semibold text-lg">{data.cpu.cores_physical}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-gray-500 text-xs">Frequency</p>
                      <p className="text-white font-semibold text-lg">{(data.cpu.frequency_mhz / 1000).toFixed(1)} GHz</p>
                    </div>
                  </div>
                </div>
              </HardwareCard>
              <HardwareCard title="Memory (RAM)" iconBg="bg-purple-500/20" icon={<MemoryStick size={20} className="text-purple-400" />}>
                <div className="space-y-3">
                  <UsageBar label="RAM Usage" value={data.ram.used_gb} max={data.ram.total_gb} unit="GB" color="bg-purple-500" />
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <p className="text-white font-semibold">{data.ram.total_gb}</p>
                      <p className="text-gray-500 text-xs">Total GB</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <p className="text-white font-semibold">{data.ram.used_gb}</p>
                      <p className="text-gray-500 text-xs">Used GB</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <p className="text-green-400 font-semibold">{data.ram.available_gb}</p>
                      <p className="text-gray-500 text-xs">Free GB</p>
                    </div>
                  </div>
                </div>
              </HardwareCard>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Zap size={18} className="text-yellow-400" /> GPU Information
              </h3>
              {data.has_gpu ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {data.gpus.map((gpu) => (
                    <HardwareCard key={gpu.index} title={`GPU ${gpu.index}: ${gpu.name}`} iconBg="bg-yellow-500/20" icon={<Zap size={20} className="text-yellow-400" />} badge={gpu.cuda_version ? <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30">CUDA {gpu.cuda_version}</span> : undefined}>
                      <div className="space-y-3">
                        <UsageBar label="GPU Usage" value={gpu.usage_percent} max={100} unit="%" color="bg-yellow-500" />
                        <UsageBar label="VRAM Usage" value={gpu.vram_used_gb} max={gpu.vram_total_gb} unit="GB" color="bg-orange-500" />
                        {gpu.temperature_c && (
                          <div className="flex items-center gap-2 pt-2">
                            <Thermometer size={14} className="text-red-400" />
                            <span className="text-gray-400 text-sm">Temperature: </span>
                            <span className="text-white font-medium">{gpu.temperature_c}°C</span>
                          </div>
                        )}
                      </div>
                    </HardwareCard>
                  ))}
                </div>
              ) : (
                <div className="card border-dashed border-gray-700 flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center">
                    <Zap size={24} className="text-gray-600" />
                  </div>
                  <p className="text-gray-500 font-medium">No GPU Detected</p>
                  <p className="text-gray-600 text-sm text-center max-w-sm">GPU recommended for optimal performance. CPU-only inference available for smaller models.</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HardwareCard title="Storage" iconBg="bg-green-500/20" icon={<HardDrive size={20} className="text-green-400" />}>
                <UsageBar label="Disk Usage" value={data.storage.used_gb} max={data.storage.total_gb} unit="GB" color="bg-green-500" />
                <p className="text-gray-500 text-xs mt-3">💡 Minimum 20GB free space recommended per model</p>
              </HardwareCard>
              <HardwareCard title="System Information" iconBg="bg-gray-700" icon={<Server size={20} className="text-gray-400" />}>
                <div className="space-y-3">
                  {[
                    { label: "Operating System", value: data.os_name },
                    { label: "OS Version", value: data.os_version },
                    { label: "CUDA Available", value: data.is_cuda_available ? "✅ Yes" : "❌ No" },
                    { label: "Total VRAM", value: data.has_gpu ? `${data.total_vram_gb} GB` : "N/A" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                      <span className="text-gray-500 text-sm">{label}</span>
                      <span className="text-white text-sm font-medium truncate ml-4 max-w-xs">{value}</span>
                    </div>
                  ))}
                </div>
              </HardwareCard>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
