import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  icon: ReactNode
  iconBg: string
}

export const StatCard = ({ label, value, sub, icon, iconBg }: StatCardProps) => (
  <div className="card">
    <div className="flex items-center justify-between mb-3">
      <span className="text-gray-500 text-sm">{label}</span>
      <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center`}>{icon}</div>
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
  </div>
)
