import type { ReactNode } from 'react'

interface HardwareCardProps {
  title: string
  icon: ReactNode
  iconBg: string
  children: ReactNode
  badge?: ReactNode
}

export const HardwareCard = ({ title, icon, iconBg, children, badge }: HardwareCardProps) => {
  return (
    <div className="card-hover">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
            {icon}
          </div>
          <h3 className="text-white font-semibold">{title}</h3>
        </div>
        {badge}
      </div>
      {children}
    </div>
  )
}
