import { Settings as SettingsIcon } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
export const Settings = () => (
  <div className="flex-1">
    <TopBar title="Settings" subtitle="Configure LLMStore" />
    <div className="p-8 flex flex-col items-center justify-center h-96 gap-4">
      <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center">
        <SettingsIcon size={32} className="text-gray-400" />
      </div>
      <h3 className="text-white font-semibold text-xl">Settings</h3>
      <p className="text-gray-500 text-center max-w-md">Configure Ollama endpoint and system preferences. Coming in Phase 2! 🚀</p>
    </div>
  </div>
)
