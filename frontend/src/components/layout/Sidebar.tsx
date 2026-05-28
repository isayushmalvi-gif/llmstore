import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Store, Rocket,
  Activity, Settings, Cpu, MessageSquare
} from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/catalog', icon: Store, label: 'Model Catalog' },
  { path: '/deployments', icon: Rocket, label: 'Deployments' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/monitoring', icon: Activity, label: 'Monitoring' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center">
            <Cpu size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">LLMStore</h1>
            <p className="text-gray-500 text-xs mt-0.5">AI Deploy Manager</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink key={path} to={path} end={path === '/'}
            className={({ isActive }) =>
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium " +
              (isActive
                ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                : "text-gray-400 hover:bg-gray-800 hover:text-white")
            }>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <p className="text-gray-600 text-xs text-center">LLMStore v1.0.0</p>
      </div>
    </aside>
  )
}
