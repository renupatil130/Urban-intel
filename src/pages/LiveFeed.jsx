import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFeed } from '../hooks/useFeed'
import { generatePosts, CATEGORIES } from '../data/mockData'
import './LiveFeed.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function getSourceIcon(source) {
  if (source?.startsWith('Reddit')) return '🔴'
  if (source?.startsWith('News')) return '📰'
  if (source?.startsWith('Bluesky')) return '🦋'
  if (source?.startsWith('Citizen')) return '📱'
  return '📢'
}

function getSourceColor(source) {
  if (source?.startsWith('Reddit')) return '#ff4500'
  if (source?.startsWith('News')) return '#10b981'
  if (source?.startsWith('Bluesky')) return '#0085ff'
  if (source?.startsWith('Citizen')) return '#a855f7' // Beautiful violet for Citizen Portal
  return 'var(--accent)'
}

function timeAgo(isoString) {
  if (!isoString) return '?'
  const diff = (Date.now() - new Date(isoString)) / 1000
  if (diff < 60)    return `${Math.floor(diff)}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function PostCard({ post, onStatusChange, onReviewClick }) {
  const cat = CATEGORIES[post.category] || CATEGORIES['POTHOLE']
  const srcColor = getSourceColor(post.source)

  return (
    <div id={`post-card-${post.id}`} className={`post-card ${post.severity}`} style={{ scrollMargin: '120px' }}>
      <div className="post-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="post-meta-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="post-source-icon" style={{ color: srcColor }}>{getSourceIcon(post.source)}</span>
          <span className="post-source" style={{ color: srcColor }}>{post.source}</span>
          <span className="post-author">{post.author}</span>
          <span className="post-time">{timeAgo(post.timestamp)}</span>
        </div>
        <div className="post-meta-right" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {post.raw || post.source === 'Citizen Portal' ? (
            <span className="badge verified">LIVE</span>
          ) : (
            <span className="badge" style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'transparent' }}>DEMO</span>
          )}
          <span className={`badge ${post.severity}`}>{post.severity}</span>
          <span className={`badge ${post.status}`}>{post.status}</span>
        </div>
      </div>

      <div className="post-body">
        <div className="post-cat-icon" style={{ color: cat.color }}>{cat.icon}</div>
        <div className="post-content">
          <div className="post-cat-label" style={{ color: cat.color }}>{cat.label}</div>
          <p className="post-text">{post.text}</p>
        </div>
      </div>

      <div className="post-footer" style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
          <div className="post-signals" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span>♥ {post.likes}</span>
            {post.reposts > 0 && <span>⟳ {post.reposts}</span>}
            {post.replies > 0 && <span>💬 {post.replies}</span>}
            <span className="post-confidence" style={{
              color: post.confidence > 80 ? 'var(--success)' : post.confidence > 60 ? 'var(--warning)' : 'var(--danger)'
            }}>AI: {post.confidence}%</span>
          </div>
          <div className="post-location" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', margin: 0 }}>
            <div><span className="loc-pin">◉</span>{post.ward}</div>
            {post.mla && (
              <div style={{ fontSize: '9.5px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                MLA: {post.mla.split(' (')[0]}
              </div>
            )}
          </div>
        </div>
        <div className="post-actions" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', width: '100%', marginTop: '4px' }}>
          <button
            className="post-btn review"
            onClick={() => onReviewClick(post)}
          >
            Review
          </button>
          <button className="post-btn verify"  onClick={() => onStatusChange(post.id, 'verified')}>Verify</button>
          <button className="post-btn flag"    onClick={() => onStatusChange(post.id, 'flagged')}>Flag</button>
          <button className="post-btn resolve" onClick={() => onStatusChange(post.id, 'resolved')}>Resolve</button>
        </div>
      </div>

      <div className="post-ai-bar">
        <span className="ai-label">AI</span>
        <span className="ai-text">
          {cat.label} in {post.ward}. Confidence {post.confidence}%.{' '}
          {post.severity === 'critical' ? 'Immediate action required.' : post.severity === 'high' ? 'High priority.' : 'Routine attention.'}
          {!post.genuine && ' ⚠ Authenticity uncertain.'}
        </span>
      </div>
    </div>
  )
}

function FocusedReviewPanel({ post, onBack, onStatusChange }) {
  const cat = CATEGORIES[post.category] || CATEGORIES['POTHOLE']
  const srcColor = getSourceColor(post.source)
  
  const [adminMsg, setAdminMsg] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [msgFeedback, setMsgFeedback] = useState('')
  const [chatHistory, setChatHistory] = useState(post.messages || [])

  // Poll for messages in moderation view to sync real-time chat
  useEffect(() => {
    if (post.source !== 'Citizen Portal') return
    
    const fetchLatestMessages = () => {
      fetch(`${API_BASE}/api/citizen/complaints?userId=${post.userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const current = data.complaints.find(c => c.id === post.id)
            if (current) setChatHistory(current.messages || [])
          }
        })
        .catch(() => {})
    }
    
    fetchLatestMessages()
    const timer = setInterval(fetchLatestMessages, 4000)
    return () => clearInterval(timer)
  }, [post])

  const handleSendAdminMessage = async () => {
    if (!adminMsg.trim()) return
    setSendingMsg(true)
    setMsgFeedback('')
    try {
      const res = await fetch(`${API_BASE}/api/feed/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId: post.id,
          message: adminMsg,
          sender: 'admin'
        })
      })
      const data = await res.json()
      if (data.success) {
        setAdminMsg('')
        setChatHistory(data.messages)
        setMsgFeedback('✓ Message sent successfully')
        setTimeout(() => setMsgFeedback(''), 3000)
      }
    } catch (err) {
      console.error('Failed to send admin message:', err)
      setMsgFeedback('⚠️ Error sending message')
    } finally {
      setSendingMsg(false)
    }
  }

  // Simulated moderation checklist
  const checklist = [
    { label: 'Profile Age & History Verified', passed: post.confidence > 60 },
    { label: 'Geotag Coordinates Match Ward Boundary', passed: true },
    { label: 'No Duplicate Reports Detected', passed: post.likes < 300 },
    { label: 'Language & Content Sentiment Validated', passed: post.genuine },
  ]

  return (
    <div className="focused-review-panel animate-in">
      <div className="focused-review-header">
        <button className="back-feed-btn" onClick={onBack}>
          ← Back to Social Feed
        </button>
        <div className="focused-title">
          Reviewing Post <span>{post.id}</span>
        </div>
      </div>

      <div className="focused-review-grid">
        {/* Left Column: Exact Content */}
        <div className="focused-content-section">
          <div className="focused-card-source-bar" style={{ background: srcColor }}>
            <span className="focused-source-icon">{getSourceIcon(post.source)}</span>
            <span className="focused-source-name">{post.source}</span>
          </div>

          <div className="focused-card-body">
            <div className="focused-author-info">
              <div className="author-avatar" style={{ border: `2px solid ${srcColor}` }}>
                {post.authorName?.[0] || post.author?.[0] || 'U'}
              </div>
              <div className="author-details">
                <div className="author-display-name">{post.authorName || 'Anonymous Citizen'}</div>
                <div className="author-username">{post.author}</div>
              </div>
              <span className="focused-time">{timeAgo(post.timestamp)}</span>
            </div>

            <div className="focused-exact-content-box">
              <div className="focused-cat-badge" style={{ color: cat.color, border: `1px solid ${cat.color}2c`, background: `${cat.color}0a` }}>
                {cat.icon} {cat.label}
              </div>
              <h3 className="focused-content-title">Exact Post Content</h3>
              <p className="focused-content-text">"{post.text}"</p>
              
              {post.photo && (
                <div className="focused-photo-container" style={{ marginTop: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>Uploaded Proof:</span>
                  <img 
                    src={post.photo} 
                    alt="Citizen Attachment" 
                    style={{ maxWidth: '100%', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'block', maxHeight: '320px' }} 
                  />
                </div>
              )}

              {post.url && post.url !== '#' && (
                <div className="focused-live-link-container" style={{ marginTop: '1.25rem' }}>
                  <a 
                    href={post.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="focused-live-link-btn"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '0.6rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      color: 'var(--accent)',
                      textDecoration: 'none',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.2s ease',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.borderColor = 'var(--accent)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    🔗 View Original {post.source || 'Post'} Source
                  </a>
                </div>
              )}
            </div>

            <div className="focused-social-stats">
              <span className="stat-pill">♥ {post.likes} Likes</span>
              {post.reposts > 0 && <span className="stat-pill">⟳ {post.reposts} Reposts</span>}
              <span className="stat-pill">💬 {post.replies} Replies</span>
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis & Actions */}
        <div className="focused-meta-section">
          <div className="focused-panel-block">
            <h3 className="block-title">AI Classification Report</h3>
            <div className="meta-grid">
              <div className="meta-item">
                <span className="meta-lbl">Assigned Ward</span>
                <span className="meta-val">◉ {post.ward}</span>
              </div>
              <div className="meta-item">
                <span className="meta-lbl">Severity Level</span>
                <span className={`meta-val badge ${post.severity}`}>{post.severity}</span>
              </div>
              <div className="meta-item">
                <span className="meta-lbl">Confidence Score</span>
                <span className="meta-val" style={{
                  color: post.confidence > 80 ? 'var(--success)' : post.confidence > 60 ? 'var(--warning)' : 'var(--danger)'
                }}>{post.confidence}%</span>
              </div>
              <div className="meta-item">
                <span className="meta-lbl">Authenticity</span>
                <span className="meta-val" style={{ color: post.genuine ? 'var(--success)' : 'var(--danger)' }}>
                  {post.genuine ? 'Genuine Alert' : 'Suspicious / Noise'}
                </span>
              </div>
            </div>
          </div>

          {post.mla && (
            <div className="focused-panel-block">
              <h3 className="block-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                👤 Accountable Representatives
              </h3>
              <div className="meta-grid" style={{ gridTemplateColumns: '1fr', gap: '8px' }}>
                <div className="meta-item" style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '8px' }}>
                  <span className="meta-lbl">MLA (Member of Legislative Assembly)</span>
                  <span className="meta-val" style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>🏛️ {post.mla}</span>
                </div>
                {post.mp && (
                  <div className="meta-item" style={{ borderLeft: '3px solid var(--success)', paddingLeft: '8px' }}>
                    <span className="meta-lbl">MP (Member of Parliament)</span>
                    <span className="meta-val" style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>🗳️ {post.mp}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {post.source === 'Citizen Portal' && (
            <div className="focused-panel-block">
              <h3 className="block-title">Bidirectional Chat with Citizen</h3>
              
              <div className="moderator-chat-history" style={{ 
                maxHeight: '140px', 
                overflowY: 'auto', 
                background: '#0b0f19', 
                padding: '0.6rem', 
                borderRadius: '6px', 
                border: '1px solid var(--border-color)', 
                marginBottom: '0.6rem',
                fontSize: '0.8rem'
              }}>
                {chatHistory.length === 0 ? (
                  <p style={{ color: '#64748b', margin: 0, textAlign: 'center', padding: '1rem 0' }}>No messages sent yet.</p>
                ) : (
                  chatHistory.map((m, idx) => (
                    <div key={idx} style={{ marginBottom: '0.5rem', textAlign: m.sender === 'admin' ? 'right' : 'left' }}>
                      <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 'bold', display: 'block' }}>
                        {m.sender === 'admin' ? 'YOU (Admin)' : 'CITIZEN'}
                      </span>
                      <span style={{ 
                        display: 'inline-block', 
                        background: m.sender === 'admin' ? '#1e293b' : '#1e3a8a', 
                        color: '#fff', 
                        padding: '0.35rem 0.6rem', 
                        borderRadius: '4px',
                        marginTop: '0.15rem',
                        maxWidth: '90%',
                        wordBreak: 'break-word',
                        textAlign: 'left'
                      }}>
                        {m.text}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="admin-chat-input" style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="text"
                  placeholder="Send instructions/status updates..."
                  value={adminMsg}
                  onChange={e => setAdminMsg(e.target.value)}
                  style={{ 
                    flex: 1, 
                    background: '#0b0f19', 
                    border: '1px solid var(--border-color)', 
                    color: '#fff', 
                    borderRadius: '4px', 
                    padding: '0.4rem 0.6rem', 
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendAdminMessage() }}
                />
                <button 
                  onClick={handleSendAdminMessage} 
                  disabled={sendingMsg || !adminMsg.trim()}
                  style={{ 
                    padding: '0.4rem 0.8rem', 
                    background: 'var(--accent)', 
                    border: 'none', 
                    borderRadius: '4px', 
                    color: '#fff', 
                    fontSize: '0.8rem', 
                    fontWeight: 'bold', 
                    cursor: 'pointer' 
                  }}
                >
                  Send
                </button>
              </div>
              {msgFeedback && <p style={{ fontSize: '0.75rem', color: msgFeedback.startsWith('✓') ? 'var(--success)' : 'var(--danger)', margin: '0.4rem 0 0 0', textAlign: 'center' }}>{msgFeedback}</p>}
            </div>
          )}

          <div className="focused-panel-block">
            <h3 className="block-title">System Verification Checklist</h3>
            <div className="checklist-container">
              {checklist.map((item, i) => (
                <div key={i} className="checklist-row">
                  <span className={`chk-icon ${item.passed ? 'pass' : 'fail'}`}>
                    {item.passed ? '✓' : '✗'}
                  </span>
                  <span className="chk-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="focused-actions-block">
            <h3 className="block-title">Moderation Decision</h3>
            <div className="focused-action-buttons">
              <button className="post-btn verify" onClick={() => onStatusChange(post.id, 'verified')}>
                Verify & Escalate Report
              </button>
              <button className="post-btn flag" onClick={() => onStatusChange(post.id, 'flagged')}>
                Flag as Spam / False Alert
              </button>
              <button className="post-btn resolve" onClick={() => onStatusChange(post.id, 'resolved')}>
                Mark Issue Resolved
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LiveFeed() {
  const { posts: livePosts, loading, error, meta, newCount, apiStatus, refresh, dismissNew } = useFeed()
  const [statusMap,    setStatusMap]   = useState({})
  const [searchParams, setSearchParams] = useSearchParams()
  const reviewId = searchParams.get('reviewId') || null
  const [focusedPostId, setFocusedPostId] = useState(reviewId)

  useEffect(() => {
    setFocusedPostId(reviewId)
  }, [reviewId])
  const [search,       setSearch]      = useState('')
  const [filterSev,    setFilterSev]   = useState('all')
  const [filterStat,   setFilterStat]  = useState('unresolved')
  const [filterCat,    setFilterCat]   = useState('all')
  const [filterSrc,    setFilterSrc]   = useState('all')
  const [sortBy,       setSortBy]      = useState('time')
  const [showNews,     setShowNews]    = useState(true)

  const [mapLoaded, setMapLoaded] = useState(false)
  const mapInstanceRef = useRef(null)
  const markersGroupRef = useRef(null)

  const handleStatusChange = async (id, s) => {
    let resolvedPhoto = null
    if (s === 'resolved') {
      const confirmPhoto = window.confirm("Would you like to upload a resolution photo as proof?")
      if (confirmPhoto) {
        const file = await new Promise((resolve) => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = 'image/*'
          input.onchange = (e) => resolve(e.target.files[0])
          input.click()
        })
        if (file) {
          resolvedPhoto = await new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.readAsDataURL(file)
          })
        }
      }
    }

    setStatusMap(p => ({ ...p, [id]: s }))
    try {
      await fetch(`${API_BASE}/api/feed/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id, status: s, resolvedPhoto })
      })
    } catch (err) {
      console.error('Failed to update status on server:', err)
    }
  }

  const allPosts = useMemo(() => livePosts.map(p => ({ ...p, status: statusMap[p.id] || p.status })), [livePosts, statusMap])
  const sourceList = useMemo(() => [...new Set(allPosts.map(p => p.source))], [allPosts])

  const filtered = useMemo(() => {
    let r = [...allPosts]
    if (search)           r = r.filter(p => p.text.toLowerCase().includes(search.toLowerCase()) || p.ward?.toLowerCase().includes(search.toLowerCase()))
    if (filterSev  !== 'all') r = r.filter(p => p.severity === filterSev)
    if (filterStat === 'unresolved') {
      r = r.filter(p => (statusMap[p.id] || p.status) !== 'resolved')
    } else if (filterStat !== 'all') {
      r = r.filter(p => (statusMap[p.id] || p.status) === filterStat)
    }
    if (filterCat  !== 'all') r = r.filter(p => p.category === filterCat)
    
    if (filterSrc !== 'all') {
      r = r.filter(p => p.source === filterSrc)
    } else if (!showNews) {
      r = r.filter(p => p.source !== 'News Reports')
    }

    if (sortBy === 'severity') { const o = { critical:0,high:1,medium:2,low:3 }; r.sort((a,b)=>(o[a.severity]??4)-(o[b.severity]??4)) }
    else if (sortBy === 'confidence') r.sort((a,b) => b.confidence - a.confidence)
    else r.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
    return r
  }, [allPosts, search, filterSev, filterStat, filterCat, filterSrc, showNews, sortBy, statusMap])

  useEffect(() => {
    if (filterSrc === 'News Reports') {
      setShowNews(true)
    }
  }, [filterSrc])

  // Dynamically load Leaflet assets
  useEffect(() => {
    if (window.L) {
      setMapLoaded(true)
      return
    }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      setMapLoaded(true)
    }
    document.head.appendChild(script)
  }, [])

  // Initialize Map once
  useEffect(() => {
    if (!mapLoaded || !window.L || focusedPostId) return
    const L = window.L

    const mapEl = document.getElementById('livefeed-leaflet-map')
    if (mapEl && mapEl._leaflet_id) return // already initialized

    const map = L.map('livefeed-leaflet-map', {
      zoomControl: false
    }).setView([12.9716, 77.5946], 11.5)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    mapInstanceRef.current = map
    markersGroupRef.current = L.layerGroup().addTo(map)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markersGroupRef.current = null
      }
    }
  }, [mapLoaded, focusedPostId])

  // Update markers on data change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current || !window.L) return
    const L = window.L
    const markersGroup = markersGroupRef.current

    markersGroup.clearLayers()

    filtered.forEach(post => {
      if (post.lat && post.lng) {
        const cat = CATEGORIES[post.category] || CATEGORIES['POTHOLE']
        const color = cat.color || '#38bdf8'
        const customHtml = `
          <div style="
            background: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #fff;
            box-shadow: 0 2px 5px rgba(0,0,0,0.5);
          ">
            <span style="transform: rotate(45deg); font-size: 11px;">${cat.icon || '◉'}</span>
          </div>
        `
        const icon = L.divIcon({
          html: customHtml,
          className: 'custom-map-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 24]
        })

        const marker = L.marker([post.lat, post.lng], { icon })
          .bindPopup(`
            <div style="color: #fff; font-family: sans-serif; font-size: 12px; padding: 2px; min-width: 160px;">
              <div style="font-weight: bold; margin-bottom: 4px; color: ${color}">${cat.label}</div>
              <div style="font-weight: 500; color: #cbd5e1; margin-bottom: 2px;">◉ ${post.ward}</div>
              <div style="color: #94a3b8; font-size: 10px; margin-bottom: 6px;">MLA: ${post.mla}</div>
              <p style="margin: 0; color: #e2e8f0; font-size: 11.5px; line-height: 1.4; max-height: 50px; overflow: hidden;">"${post.text.slice(0, 70)}..."</p>
              <button onclick="window.focusComplaintCard('${post.id}')" style="
                margin-top: 8px;
                width: 100%;
                background: ${color};
                border: none;
                color: #fff;
                font-weight: bold;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 10px;
              ">Review Card</button>
            </div>
          `, {
            closeButton: false,
            className: 'custom-leaflet-popup'
          })

        markersGroup.addLayer(marker)
      }
    })

    window.focusComplaintCard = (id) => {
      const cardEl = document.getElementById(`post-card-${id}`)
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        cardEl.style.outline = '2px solid var(--accent)'
        cardEl.style.boxShadow = '0 0 15px var(--accent-dim)'
        setTimeout(() => {
          cardEl.style.outline = 'none'
          cardEl.style.boxShadow = 'none'
        }, 3000)
      }
    }
  }, [filtered])



  if (focusedPostId) {
    if (loading) {
      return (
        <div className="livefeed" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <p style={{ color: '#94a3b8' }}>Loading review details...</p>
        </div>
      )
    }
    const post = allPosts.find(p => p.id === focusedPostId)
    if (post) {
      return (
        <div className="livefeed">
          <FocusedReviewPanel
            post={post}
            onBack={() => {
              setFocusedPostId(null)
              setSearchParams({})
            }}
            onStatusChange={(id, status) => {
              handleStatusChange(id, status)
              setFocusedPostId(null)
              setSearchParams({})
            }}
          />
        </div>
      )
    } else {
      return (
        <div className="livefeed">
          <div className="focused-review-header" style={{ marginBottom: '2rem' }}>
            <button className="back-feed-btn" onClick={() => setSearchParams({})}>
              ← Back to Social Feed
            </button>
          </div>
          <div style={{ textAlign: 'center', padding: '5rem 3rem', background: '#111827', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🔍</div>
            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Post Not Found</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
              The post with ID <strong>{focusedPostId}</strong> could not be found. It may have been filtered out due to the 3-month age limit, flagged as spam, or deleted.
            </p>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="livefeed">
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Social Feed</h1>
          <p className="page-sub">Real-time civic issues from Reddit & Bluesky (Bengaluru) and Citizen Portal (Davangere)</p>
        </div>
        <div className="header-right-group">
          {newCount > 0 && (
            <button className="new-alert-btn" onClick={() => { refresh(); dismissNew() }}>
              <span className="live-dot-sm" />{newCount} new · refresh
            </button>
          )}
          <button className="btn-refresh" onClick={refresh} disabled={loading}>
            {loading ? '⟳ Fetching…' : '⟳ Refresh'}
          </button>
        </div>
      </div>

      {/* Source status bar */}
      <div className="source-status-bar">
        <div className={`src-pill ${apiStatus === 'offline' ? 'offline' : 'online'}`}>
          <span className="src-dot" style={{ background: apiStatus === 'offline' ? 'var(--danger)' : 'var(--success)' }} />
          {apiStatus === 'offline' ? 'Backend offline — demo data' : 'Backend online'}
        </div>
        <div className="src-pill">
          <span style={{ color:'#ff4500' }}>●</span>
          Reddit: {meta.reddit} posts
        </div>
        <div className="src-pill">
          <span style={{ color:'#0085ff' }}>🦋</span>
          Bluesky: {meta.bluesky} posts
        </div>
        <div className="src-pill">
          <span style={{ color:'#10b981' }}>📰</span>
          Google News: {meta.news} posts
        </div>
        {meta.lastUpdated && <div className="src-pill muted">Updated {timeAgo(meta.lastUpdated)}</div>}
        <div className="src-pill muted">{filtered.length} shown</div>
      </div>

      {/* NammaKasa-style Interactive Map */}
      <div className="livefeed-map-container" style={{
        height: '340px',
        width: '100%',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        background: '#0b0f19',
        marginBottom: '20px',
        position: 'relative',
        zIndex: 10
      }}>
        <div id="livefeed-leaflet-map" style={{ width: '100%', height: '100%' }} />
      </div>

      <div className="feed-filters">
        <div className="filter-group">
          <input
            type="text"
            className="search-bar"
            placeholder="Search by keywords or ward name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          
          <select className="filter-select" value={filterSev} onChange={e => setFilterSev(e.target.value)}>
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
            <option value="low">Low Only</option>
          </select>

          <select className="filter-select" value={filterStat} onChange={e => setFilterStat(e.target.value)}>
            <option value="unresolved">Unresolved Complaints</option>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="verified">Verified</option>
            <option value="flagged">Flagged</option>
            <option value="resolved">Resolved</option>
          </select>

          <select className="filter-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="all">All Categories</option>
            {Object.keys(CATEGORIES).map(k => (
              <option key={k} value={k}>{CATEGORIES[k].label}</option>
            ))}
          </select>

          <select className="filter-select" value={filterSrc} onChange={e => setFilterSrc(e.target.value)}>
            <option value="all">All Sources</option>
            {sourceList.map(src => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
 
          <label className="filter-checkbox-label" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'var(--transition)',
            userSelect: 'none'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <input
              type="checkbox"
              checked={showNews}
              onChange={e => setShowNews(e.target.checked)}
              style={{ cursor: 'pointer', margin: 0 }}
            />
            <span>Include News Reports</span>
          </label>
        </div>

        <div className="filter-group right">
          <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="time">Latest first</option>
            <option value="severity">By severity</option>
            <option value="confidence">By confidence</option>
          </select>
          <div className="result-count">{filtered.length} results</div>
        </div>
      </div>

      {loading && livePosts.length === 0 && (
        <div className="feed-loading">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-line short" />
              <div className="skeleton-line" />
              <div className="skeleton-line medium" />
            </div>
          ))}
        </div>
      )}

      <div className="feed-grid">
        {filtered.map((post, i) => (
          <div key={post.id} style={{ animationDelay: `${Math.min(i,8)*40}ms` }} className="animate-in">
            <PostCard
              post={post}
              onStatusChange={handleStatusChange}
              onReviewClick={(p) => {
                setFocusedPostId(p.id)
                handleStatusChange(p.id, 'reviewing')
              }}
            />
          </div>
        ))}
        {filtered.length === 0 && !loading && (
          <div className="no-results" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center' }}>
            <div className="no-results-icon" style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--accent)' }}>◎</div>
            <p style={{ fontSize: '1.1rem', color: '#94a3b8' }}>No live complaints found in the feed.</p>
            <p style={{ color: '#4b6282', marginTop: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Click the "Refresh Feed" button or the button below to crawl live Reddit complaints and news reports.
            </p>
            <button className="btn primary" onClick={refresh} style={{ padding: '0.6rem 1.5rem', border: 'none', borderRadius: '6px', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>
              ↻ Trigger Live Crawl
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
