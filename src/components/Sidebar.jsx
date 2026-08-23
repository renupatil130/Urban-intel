import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import './Sidebar.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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

  const [resolvedPosts, setResolvedPosts] = useState([])
  const [showResolvedModal, setShowResolvedModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [collapsed, setCollapsed] = useState(true)

  useEffect(() => {
    const fetchResolved = () => {
      fetch(`${API_BASE}/api/feed`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setResolvedPosts(data.posts.filter(p => p.status === 'resolved'))
          }
        })
        .catch(() => {})
    }
    fetchResolved()
    const interval = setInterval(fetchResolved, 8000)
    return () => clearInterval(interval)
  }, [])

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

      <div className="sidebar-resolved-section" style={{ padding: '0 1rem', marginTop: '1.25rem', flex: 1, overflowY: 'auto' }}>
        <div 
          className="resolved-header" 
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}
          onClick={() => setCollapsed(!collapsed)}
        >
          <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', letterSpacing: '0.05em' }}>RESOLVED ALERTS ({resolvedPosts.length})</span>
          <span style={{ fontSize: '9px', color: '#64748b' }}>{collapsed ? '▶' : '▼'}</span>
        </div>
        
        {!collapsed && (
          <div className="resolved-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
            {resolvedPosts.length === 0 ? (
              <span style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>No resolved alerts.</span>
            ) : (
              resolvedPosts.map(post => (
                <div 
                  key={post.id} 
                  className="resolved-sidebar-item" 
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '4px',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    transition: 'all 0.2s',
                    color: '#e2e8f0'
                  }}
                  onClick={() => {
                    setSelectedPost(post)
                    setShowResolvedModal(true)
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = 'rgba(16,185,129,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', alignItems: 'center' }}>
                    <strong style={{ color: '#10b981' }}>{post.id}</strong>
                    <span style={{ color: '#64748b', fontSize: '8px' }}>{post.ward.split('–')[1]?.trim() || post.ward}</span>
                  </div>
                  <div style={{ color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '10px' }}>
                    {post.text.split(' — ')[0]}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showResolvedModal && selectedPost && (
        <div className="resolved-modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => setShowResolvedModal(false)}
        >
          <div className="resolved-modal" style={{
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            width: '600px',
            maxWidth: '90%',
            padding: '1.25rem',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
          }}
          onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#10b981', fontSize: '1.15rem' }}>Resolved Complaint: {selectedPost.id}</h3>
              <button 
                onClick={() => setShowResolvedModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.25rem', cursor: 'pointer', outline: 'none' }}
              >✕</button>
            </div>

            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              <strong>Category:</strong> {selectedPost.category} | <strong>Ward:</strong> {selectedPost.ward} | <strong>Source:</strong> {selectedPost.source}
            </div>

            <p style={{ fontSize: '12.5px', background: '#0b0f19', padding: '10px', borderRadius: '4px', borderLeft: '3px solid #38bdf8', margin: 0, color: '#e2e8f0' }}>
              "{selectedPost.text}"
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '4px' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Original Issue:</span>
                {selectedPost.photo ? (
                  <img src={selectedPost.photo} alt="Before" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }} />
                ) : (
                  <div style={{ height: '140px', background: '#0b0f19', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#475569', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    No Photo Attached
                  </div>
                )}
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#10b981', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>✓ Resolution Proof:</span>
                {selectedPost.resolvedPhoto ? (
                  <img src={selectedPost.resolvedPhoto} alt="After" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '4px', border: '2px solid #10b981' }} />
                ) : (
                  <div style={{ height: '140px', background: '#0b0f19', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#475569', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    No Resolution Photo Proof
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button 
                onClick={() => setShowResolvedModal(false)}
                style={{ background: '#38bdf8', border: 'none', borderRadius: '4px', color: '#fff', padding: '6px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              >Close</button>
            </div>
          </div>
        </div>
      )}

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
