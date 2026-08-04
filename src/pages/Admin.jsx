import { useState, useEffect, useMemo, useRef } from 'react'
import { WARDS, CATEGORIES } from '../data/mockData'
import { useFeed } from '../hooks/useFeed'
import './Admin.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const DEPARTMENTS = ['Roads & Infrastructure', 'Waste Management', 'Water & Sanitation', 'Electrical / Lighting', 'Parks & Trees', 'Town Planning']

function playChimeSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const audioCtx = new AudioContext()
    const now = audioCtx.currentTime
    
    // Low G note (warm base)
    const osc1 = audioCtx.createOscillator()
    const gain1 = audioCtx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(392.00, now) // G4
    gain1.gain.setValueAtTime(0.08, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc1.connect(gain1)
    gain1.connect(audioCtx.destination)
    osc1.start(now)
    osc1.stop(now + 0.3)
    
    // High C note (bright chirp)
    const osc2 = audioCtx.createOscillator()
    const gain2 = audioCtx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1046.50, now + 0.08) // C6
    gain2.gain.setValueAtTime(0.12, now + 0.08)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
    osc2.connect(gain2)
    gain2.connect(audioCtx.destination)
    osc2.start(now + 0.08)
    osc2.stop(now + 0.5)
  } catch (err) {
    console.error('Web Audio playback failed:', err)
  }
}

export default function Admin() {
  const { posts: livePosts, apiStatus } = useFeed()
  
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [toasts, setToasts] = useState([])
  const seenPostIds = useRef(new Set())
  const isFirstLoad = useRef(true)

  // Initialize seen IDs from livePosts
  useEffect(() => {
    if (livePosts.length > 0 && isFirstLoad.current) {
      livePosts.forEach(p => seenPostIds.current.add(p.id))
      isFirstLoad.current = false
    }
  }, [livePosts])

  // Monitor incoming new complaints
  useEffect(() => {
    if (isFirstLoad.current && livePosts.length > 0) {
      livePosts.forEach(p => seenPostIds.current.add(p.id))
      isFirstLoad.current = false
      return
    }

    if (livePosts.length === 0) return

    const newPosts = livePosts.filter(p => !seenPostIds.current.has(p.id))
    if (newPosts.length > 0) {
      newPosts.forEach(p => {
        seenPostIds.current.add(p.id)
        
        // Show Toast
        const toastId = Math.random().toString(36).substring(2, 9)
        const textSnippet = p.text.length > 80 ? p.text.substring(0, 80) + '...' : p.text
        setToasts(prev => [...prev, {
          id: toastId,
          postId: p.id,
          title: `New ${p.category} Signal`,
          text: textSnippet,
          severity: p.severity,
          source: p.source,
          ward: p.ward
        }])

        // Auto remove toast after 5 seconds
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId))
        }, 5000)
      })

      // Play Sound
      if (audioEnabled) {
        playChimeSound()
      }
    }
  }, [livePosts, audioEnabled])

  // Simulation handler
  const handleSimulateAlert = () => {
    const mockCategories = ['POTHOLE', 'GARBAGE', 'WATER', 'STREETLIGHT']
    const mockWards = ['Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield']
    const selectedCategory = mockCategories[Math.floor(Math.random() * mockCategories.length)]
    const selectedWard = mockWards[Math.floor(Math.random() * mockWards.length)]
    const toastId = Math.random().toString(36).substring(2, 9)

    // Show simulation toast
    setToasts(prev => [...prev, {
      id: toastId,
      postId: `SIM-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `Simulated ${selectedCategory} Alert`,
      text: `Urgent attention required: ${selectedCategory.toLowerCase()} reported in ${selectedWard}.`,
      severity: Math.random() > 0.5 ? 'critical' : 'high',
      source: 'Mock Stream',
      ward: selectedWard
    }])

    // Auto remove simulation toast
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId))
    }, 5000)

    // Play sound
    if (audioEnabled) {
      playChimeSound()
    }
  }

  const [thresholds, setThresholds] = useState({ critical: 80, high: 60, medium: 40, autoVerify: 90 })
  const [sources, setSources] = useState({ 'Reddit': true, 'News Reports': true, 'Bluesky': true })
  const [mapping, setMapping] = useState({
    POTHOLE: 'Roads & Infrastructure',
    GARBAGE: 'Waste Management',
    WATER: 'Water & Sanitation',
    STREETLIGHT: 'Electrical / Lighting',
    ENCROACHMENT: 'Town Planning',
    SEWAGE: 'Water & Sanitation',
    NOISE: 'Roads & Infrastructure',
    HAZARD: 'Parks & Trees'
  })
  
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch configuration from backend on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/config`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.thresholds) setThresholds(data.thresholds)
          if (data.sources) setSources(data.sources)
          if (data.mapping) setMapping(data.mapping)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load config:', err)
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thresholds, sources, mapping })
      })
      const data = await res.json()
      if (data.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } catch (err) {
      console.error('Failed to save config:', err)
    }
  }

  // Count active complaints per ward based on actual live posts
  const wardCounts = useMemo(() => {
    const counts = {}
    livePosts.forEach(p => {
      const lowerWard = p.ward?.toLowerCase() || ''
      counts[lowerWard] = (counts[lowerWard] || 0) + 1
    })
    return counts
  }, [livePosts])

  // Count active complaints per source based on actual live posts
  const sourceCounts = useMemo(() => {
    const counts = {}
    livePosts.forEach(p => {
      counts[p.source] = (counts[p.source] || 0) + 1
    })
    return counts
  }, [livePosts])

  const healthData = useMemo(() => {
    const isOffline = apiStatus === 'offline'
    return [
      { name: 'AI Classification Engine', status: isOffline ? 'offline' : 'online', latency: isOffline ? 'N/A' : '84ms', load: isOffline ? 0 : 28 },
      { name: 'Social Media Scraper', status: isOffline ? 'offline' : 'online', latency: isOffline ? 'N/A' : '52ms', load: isOffline ? 0 : 15 },
      { name: 'Verification Pipeline', status: isOffline ? 'offline' : 'online', latency: isOffline ? 'N/A' : '110ms', load: isOffline ? 0 : 38 },
      { name: 'Alert System', status: isOffline ? 'offline' : 'online', latency: isOffline ? 'N/A' : '18ms', load: isOffline ? 0 : 6 },
      { name: 'Database Cluster', status: isOffline ? 'offline' : 'online', latency: isOffline ? 'N/A' : '6ms', load: isOffline ? 0 : 10 }
    ]
  }, [apiStatus])

  if (loading) {
    return (
      <div className="admin-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ color: '#94a3b8' }}>Loading system configuration...</p>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">System Configuration</h1>
          <p className="page-sub">Configure data streams, thresholds, and classification parameters</p>
        </div>
        <button className="btn-primary" onClick={handleSave} style={{ border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          {saved ? '✓ Saved!' : '⟡ Save Changes'}
        </button>
      </div>

      <div className="admin-grid">
        {/* Stream Sources */}
        <div className="card">
          <div className="admin-section-title">◈ Data Stream Sources</div>
          <div className="source-toggles">
            {Object.entries(sources).map(([src, enabled]) => {
              // Map display names to keys in backend
              let backendSourceKey = src
              if (src === 'Reddit') backendSourceKey = 'Reddit r/bangalore'
              const count = sourceCounts[backendSourceKey] || 0
              
              return (
                <div key={src} className={`source-toggle ${enabled ? 'enabled' : ''}`} onClick={() => setSources(p => ({ ...p, [src]: !p[src] }))}>
                  <div className="toggle-left">
                    <div className={`toggle-dot ${enabled ? 'on' : 'off'}`} />
                    <span className="toggle-name">{src}</span>
                  </div>
                  <div className="toggle-stat">
                    <span className="toggle-count">{count} active</span>
                    <span className={`toggle-status ${enabled ? 'active' : 'paused'}`}>{enabled ? 'Active' : 'Paused'}</span>
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="audio-control-row">
            <button 
              className={`audio-toggle-btn ${audioEnabled ? 'enabled' : ''}`}
              onClick={() => {
                setAudioEnabled(!audioEnabled)
                if (!audioEnabled) playChimeSound()
              }}
            >
              <span>{audioEnabled ? '🔊 Sound On' : '🔇 Muted'}</span>
            </button>
            <button className="simulate-btn" onClick={handleSimulateAlert}>
              ⟡ Simulate Alarm
            </button>
          </div>
        </div>

        {/* Severity Thresholds */}
        <div className="card">
          <div className="admin-section-title">◎ Severity Thresholds</div>
          <div className="threshold-list">
            {[
              { key: 'critical', label: 'Critical', color: 'var(--danger)' },
              { key: 'high', label: 'High Priority', color: 'var(--warning)' },
              { key: 'medium', label: 'Medium', color: 'var(--purple)' },
              { key: 'autoVerify', label: 'Auto-Verify Confidence', color: 'var(--success)' },
            ].map(({ key, label, color }) => (
              <div key={key} className="threshold-item">
                <div className="threshold-header">
                  <span className="threshold-label">{label}</span>
                  <span className="threshold-val" style={{ color }}>{thresholds[key]}%</span>
                </div>
                <input
                  type="range"
                  min={0} max={100}
                  value={thresholds[key]}
                  onChange={e => setThresholds(p => ({ ...p, [key]: +e.target.value }))}
                  className="threshold-slider"
                  style={{ '--accent': color }}
                />
                <div className="threshold-ticks">
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category → Department mapping */}
        <div className="card">
          <div className="admin-section-title">◇ Category → Department Mapping</div>
          <div className="mapping-list">
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <div key={key} className="mapping-row">
                <div className="mapping-cat">
                  <span style={{ color: cat.color }}>{cat.icon}</span>
                  <span>{cat.label}</span>
                </div>
                <select 
                  className="mapping-select"
                  value={mapping[key] || 'Roads & Infrastructure'}
                  onChange={e => setMapping(p => ({ ...p, [key]: e.target.value }))}
                >
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Ward Coverage */}
        <div className="card">
          <div className="admin-section-title">⬡ Active Ward Coverage</div>
          <div className="ward-list">
            {WARDS.map((ward, i) => {
              const name = ward.split('–')[1]?.trim() || ''
              const activeCount = wardCounts[name.toLowerCase()] || 0
              return (
                <div key={i} className="ward-row">
                  <div className="ward-info">
                    <span className="ward-num">{ward.split('–')[0].trim()}</span>
                    <span className="ward-name">{name}</span>
                  </div>
                  <div className="ward-stats">
                    <span className="ward-active">{activeCount} active</span>
                    <div className="ward-toggle-sm on" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* System Health */}
        <div className="card full-width-admin">
          <div className="admin-section-title">◉ System Health Monitor</div>
          <div className="health-grid">
            {healthData.map((sys, i) => (
              <div key={i} className={`health-card ${sys.status}`}>
                <div className="health-top">
                  <div className={`health-dot ${sys.status}`} />
                  <span className="health-name">{sys.name}</span>
                  <span className="health-lat">{sys.latency}</span>
                </div>
                <div className="health-bar">
                  <div className="health-fill" style={{ width: `${sys.load}%`, background: sys.load > 85 ? 'var(--danger)' : sys.load > 65 ? 'var(--warning)' : 'var(--success)' }} />
                </div>
                <div className="health-footer">
                  <span className={`health-status ${sys.status}`}>{sys.status}</span>
                  <span className="health-load">{sys.load}% load</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {saved && (
        <div className="save-toast">✓ Configuration saved successfully</div>
      )}

      {/* Floating Alert Toasts */}
      <div className="alert-toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`alert-toast ${toast.severity}`}>
            <div className="alert-toast-header">
              <span className="alert-toast-title">
                🚨 {toast.title}
              </span>
              <button className="alert-toast-close" onClick={() => setToasts(p => p.filter(t => t.id !== toast.id))}>
                ×
              </button>
            </div>
            <div className="alert-toast-body">
              {toast.text}
            </div>
            <div className="alert-toast-meta">
              <span>{toast.source} · {toast.ward}</span>
              <a href="/feed" className="alert-toast-action">Review →</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
