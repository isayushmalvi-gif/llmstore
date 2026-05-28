import { useState, useEffect, useCallback } from 'react'
import { TopBar } from '../components/layout/TopBar'
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  Cpu, MemoryStick, HardDrive,
  Zap, Activity, Clock,
  TrendingUp, AlertTriangle
} from 'lucide-react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Stats {
  timestamp: string
  uptime_seconds: number
  cpu: {
    usage_percent: number
    cores: number
    threads: number
    freq_ghz: number
    history: { time: string; value: number }[]
  }
  ram: {
    total_gb: number
    used_gb: number
    available_gb: number
    usage_percent: number
    history: { time: string; value: number }[]
  }
  disk: {
    total_gb: number
    used_gb: number
    free_gb: number
    usage_percent: number
  }
  gpu: {
    index: number
    name: string
    usage_percent: number
    vram_used_gb: number
    vram_total_gb: number
    vram_percent: number
    temperature_c: number | null
  }[]
  requests: {
    total: number
    errors: number
    error_rate: number
    history: { time: string; value: number }[]
  }
}

const formatUptime = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return h + "h " + m + "m"
  if (m > 0) return m + "m " + s + "s"
  return s + "s"
}

const MiniChart = ({
  data, color, label
}: {
  data: { time: string; value: number }[]
  color: string
  label: string
}) => (
  <div className="h-20">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={"grad-" + label} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={"url(#grad-" + label + ")"}
          dot={false}
          isAnimationActive={false}
        />
        <Tooltip
          contentStyle={{
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#fff"
          }}
          formatter={(v: number) => [v + "%", label]}
          labelFormatter={(l) => "Time: " + l}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
)

const BigChart = ({
  data, color, label, unit = "%"
}: {
  data: { time: string; value: number }[]
  color: string
  label: string
  unit?: string
}) => (
  <div className="h-48">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={"big-grad-" + label} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="time"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          domain={[0, 100]}
          tickFormatter={v => v + unit}
        />
        <Tooltip
          contentStyle={{
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#fff"
          }}
          formatter={(v: number) => [v + unit, label]}
          labelFormatter={(l) => "Time: " + l}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={"url(#big-grad-" + label + ")"}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
)

const getUsageColor = (percent: number) => {
  if (percent >= 90) return "bg-red-500"
  if (percent >= 70) return "bg-yellow-500"
  return "bg-green-500"
}

const getTextColor = (percent: number) => {
  if (percent >= 90) return "text-red-400"
  if (percent >= 70) return "text-yellow-400"
  return "text-green-400"
}

export const Monitoring = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>("")

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(API_BASE + "/api/v1/monitoring/stats")
      setStats(res.data)
      setLastUpdate(new Date().toLocaleTimeString())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 3000)
    return () => clearInterval(interval)
  }, [fetchStats])

  return (
    <div className="flex-1">
      <TopBar
        title="Monitoring"
        subtitle={lastUpdate ? "Last updated: " + lastUpdate : "Loading..."}
        onRefresh={fetchStats}
        loading={loading}
      />

      <div className="p-8 space-y-6">

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-gray-800 border-t-purple-500 rounded-full animate-spin" />
          </div>
        )}

        {stats && (
          <>
            {/* Top Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-xs">Uptime</span>
                  <Clock size={16} className="text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {formatUptime(stats.uptime_seconds)}
                </p>
                <p className="text-gray-600 text-xs mt-1">Server running</p>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-xs">CPU Usage</span>
                  <Cpu size={16} className="text-blue-400" />
                </div>
                <p className={"text-2xl font-bold " + getTextColor(stats.cpu.usage_percent)}>
                  {stats.cpu.usage_percent}%
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  {stats.cpu.cores} cores @ {stats.cpu.freq_ghz} GHz
                </p>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-xs">RAM Usage</span>
                  <MemoryStick size={16} className="text-purple-400" />
                </div>
                <p className={"text-2xl font-bold " + getTextColor(stats.ram.usage_percent)}>
                  {stats.ram.usage_percent}%
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  {stats.ram.used_gb} / {stats.ram.total_gb} GB
                </p>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-xs">Total Requests</span>
                  <TrendingUp size={16} className="text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {stats.requests.total}
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  {stats.requests.error_rate}% error rate
                </p>
              </div>
            </div>

            {/* CPU & RAM Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Cpu size={16} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">CPU Usage</h3>
                      <p className="text-gray-500 text-xs">Last 5 minutes</p>
                    </div>
                  </div>
                  <span className={"text-2xl font-bold " + getTextColor(stats.cpu.usage_percent)}>
                    {stats.cpu.usage_percent}%
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full mb-4 overflow-hidden">
                  <div
                    className={"h-full rounded-full transition-all duration-500 " + getUsageColor(stats.cpu.usage_percent)}
                    style={{ width: stats.cpu.usage_percent + "%" }}
                  />
                </div>
                <BigChart
                  data={stats.cpu.history}
                  color="#3b82f6"
                  label="CPU"
                />
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <MemoryStick size={16} className="text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">RAM Usage</h3>
                      <p className="text-gray-500 text-xs">Last 5 minutes</p>
                    </div>
                  </div>
                  <span className={"text-2xl font-bold " + getTextColor(stats.ram.usage_percent)}>
                    {stats.ram.usage_percent}%
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full mb-4 overflow-hidden">
                  <div
                    className={"h-full rounded-full transition-all duration-500 " + getUsageColor(stats.ram.usage_percent)}
                    style={{ width: stats.ram.usage_percent + "%" }}
                  />
                </div>
                <BigChart
                  data={stats.ram.history}
                  color="#8b5cf6"
                  label="RAM"
                />
              </div>
            </div>

            {/* GPU Section */}
            {stats.gpu.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Zap size={18} className="text-yellow-400" />
                  GPU Monitoring
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {stats.gpu.map(gpu => (
                    <div key={gpu.index} className="card">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-white font-semibold">
                            GPU {gpu.index}: {gpu.name}
                          </h3>
                          {gpu.temperature_c && (
                            <p className="text-gray-500 text-xs mt-0.5">
                              🌡️ {gpu.temperature_c}°C
                            </p>
                          )}
                        </div>
                        <span className={"text-xl font-bold " + getTextColor(gpu.usage_percent)}>
                          {gpu.usage_percent}%
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>GPU Usage</span>
                            <span>{gpu.usage_percent}%</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={"h-full rounded-full " + getUsageColor(gpu.usage_percent)}
                              style={{ width: gpu.usage_percent + "%" }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>VRAM Usage</span>
                            <span>{gpu.vram_used_gb}/{gpu.vram_total_gb} GB ({gpu.vram_percent}%)</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={"h-full rounded-full " + getUsageColor(gpu.vram_percent)}
                              style={{ width: gpu.vram_percent + "%" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Storage & Requests Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <HardDrive size={16} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Storage</h3>
                    <p className="text-gray-500 text-xs">Disk usage</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Used</span>
                    <span className="text-white font-medium">
                      {stats.disk.used_gb} GB
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={"h-full rounded-full " + getUsageColor(stats.disk.usage_percent)}
                      style={{ width: stats.disk.usage_percent + "%" }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{stats.disk.free_gb} GB free</span>
                    <span>{stats.disk.total_gb} GB total</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Activity size={16} className="text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">API Requests</h3>
                    <p className="text-gray-500 text-xs">Since server start</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <p className="text-white font-bold text-xl">
                      {stats.requests.total}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">Total</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <p className="text-green-400 font-bold text-xl">
                      {stats.requests.total - stats.requests.errors}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">Success</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <p className="text-red-400 font-bold text-xl">
                      {stats.requests.errors}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">Errors</p>
                  </div>
                </div>
                {stats.requests.error_rate > 10 && (
                  <div className="flex items-center gap-2 mt-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <AlertTriangle size={14} className="text-red-400" />
                    <p className="text-red-400 text-xs">
                      High error rate: {stats.requests.error_rate}%
                    </p>
                  </div>
                )}
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  )
}
