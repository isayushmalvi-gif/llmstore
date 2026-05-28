import { Store } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
export const ModelCatalog = () => (
  <div className="flex-1">
    <TopBar title="Model Catalog" subtitle="Browse and deploy AI models" />
    <div className="p-8 flex flex-col items-center justify-center h-96 gap-4">
      <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
        <Store size={32} className="text-purple-400" />
      </div>
      <h3 className="text-white font-semibold text-xl">Model Catalog</h3>
      <p className="text-gray-500 text-center max-w-md">Browse 100+ open-source AI models. Coming in Phase 2! 🚀</p>
    </div>
  </div>
)
