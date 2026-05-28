import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { ModelCatalog } from './pages/ModelCatalog'
import { Deployments } from './pages/Deployments'
import { Chat } from './pages/Chat'
import { Monitoring } from './pages/Monitoring'
import { Settings } from './pages/Settings'

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-950 overflow-hidden">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/catalog" element={<ModelCatalog />} />
            <Route path="/deployments" element={<Deployments />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
