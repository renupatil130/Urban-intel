import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import './Sidebar.css'

const NAV_ITEMS = [
  { to: '/', icon: '⬡', label: 'Dashboard' },
  { to: '/feed', icon: '◈', label: 'Live Feed' },
  { to: '/classify', icon: '◉', label: 'AI Classify' },
  { to: '/verify', icon: '◎', label: 'Verify' },
  { to: '/analytics', icon: '◇', label: 'Analytics' },
  { to: '/admin', icon: '◈', label: 'Admin' },
]

export default function Sidebar() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
  }
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <span className="logo-hex">⬡</span>
        </div>
        <div className="logo-text">
          <span className="logo-main">Urban<strong>Intel</strong></span>
          <span className="logo-sub">v2.4.1 LIVE</span>
        </div>
      </div>

      <div className="live-indicator">
        <span className="live-dot" />
        <span className="live-label">STREAM ACTIVE</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}

        <div className="nav-item theme-toggle-container" onClick={toggleTheme}>
          <span className="nav-label" style={{ flex: 1 }}>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
          <div className="theme-switch">
            <div className="theme-switch-thumb" />
          </div>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="system-status">
          <div className="status-row">
            <span className="status-key">AI Model</span>
            <span className="status-val ok">Online</span>
          </div>
          <div className="status-row">
            <span className="status-key">Streams</span>
            <span className="status-val ok">5 / 5</span>
          </div>
          <div className="status-row">
            <span className="status-key">Latency</span>
            <span className="status-val">142ms</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
