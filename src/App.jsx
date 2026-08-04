import { Routes, Route, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import LiveFeed from './pages/LiveFeed'
import Classify from './pages/Classify'
import Verify from './pages/Verify'
import Analytics from './pages/Analytics'
import Admin from './pages/Admin'
import CitizenPortal from './pages/CitizenPortal'
import './styles/layout.css'

export default function App() {
  const location = useLocation()
  const isCitizenRoute = location.pathname.startsWith('/citizen')

  return (
    <div className="app-layout">
      {!isCitizenRoute && <Sidebar />}
      <main className={isCitizenRoute ? "citizen-main-content" : "main-content"}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/feed" element={<LiveFeed />} />
          <Route path="/classify" element={<Classify />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/citizen" element={<CitizenPortal />} />
        </Routes>
      </main>
    </div>
  )
}
