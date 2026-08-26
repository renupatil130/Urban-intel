import { useState, useMemo } from 'react'
import { CATEGORIES } from '../data/mockData'
import { useFeed } from '../hooks/useFeed'
import './Verify.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function VerifyCard({ post, onAction }) {
  const cat = CATEGORIES[post.category] || CATEGORIES['POTHOLE']

  return (
    <div className="verify-card">
      <div className="verify-header">
        <div className="verify-post-info">
          <span className="verify-id">{post.id}</span>
          <span className="verify-author">{post.author}</span>
          <span className="verify-source">{post.source}</span>
        </div>
      </div>

      <div className="verify-text">
        <span style={{ color: cat.color }} className="verify-icon">{cat.icon}</span>
        <p>{post.text}</p>
      </div>

      {post.photo && (
        <div className="verify-photo" style={{ margin: '12px 0' }}>
          <img src={post.photo} alt="Evidence" style={{ width: '100%', borderRadius: '4px', maxHeight: '180px', objectFit: 'cover' }} />
        </div>
      )}

      <div className="verify-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
        <div className="verify-actions" style={{ width: '100%', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="post-btn verify" onClick={() => onAction(post.id, 'verified')}>Verify</button>
          <button className="post-btn flag" onClick={() => onAction(post.id, 'flagged')}>Flag</button>
        </div>
      </div>
    </div>
  )
}

export default function Verify() {
  const { posts: livePosts, loading } = useFeed()
  const [actionMap, setActionMap] = useState({})

  const handleAction = (id, action) => {
    setActionMap(prev => ({ ...prev, [id]: action }))
    fetch(`${API_BASE}/api/feed/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: id, status: action })
    }).catch(err => console.error('Failed to update status on server:', err))
  }

  const pendingPosts = useMemo(() => {
    return livePosts.filter(p => p.status === 'pending' || p.status === 'reviewing')
  }, [livePosts])

  const stats = useMemo(() => ({
    total: pendingPosts.length,
    verified: Object.values(actionMap).filter(v => v === 'verified').length,
    flagged: Object.values(actionMap).filter(v => v === 'flagged').length,
    pending: pendingPosts.length - Object.keys(actionMap).length
  }), [actionMap, pendingPosts.length])

  return (
    <div className="verify-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Authenticity Verification</h1>
          <p className="page-sub">AI-assisted signal analysis to detect genuine vs. noise reports</p>
        </div>
      </div>

      <div className="verify-stats">
        <div className="verify-stat-card">
          <span className="vstat-num">{stats.total}</span>
          <span className="vstat-label">In Queue</span>
        </div>
        <div className="verify-stat-card" style={{ color: 'var(--success)' }}>
          <span className="vstat-num">{stats.verified}</span>
          <span className="vstat-label">Verified</span>
        </div>
        <div className="verify-stat-card" style={{ color: 'var(--danger)' }}>
          <span className="vstat-num">{stats.flagged}</span>
          <span className="vstat-label">Flagged</span>
        </div>
        <div className="verify-stat-card" style={{ color: 'var(--warning)' }}>
          <span className="vstat-num">{stats.pending}</span>
          <span className="vstat-label">Pending</span>
        </div>
      </div>


      {loading && pendingPosts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          Loading complaints queue...
        </div>
      ) : pendingPosts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          No pending complaints in the queue to verify.
        </div>
      ) : (
        <div className="verify-grid">
          {pendingPosts.map(post => (
            !actionMap[post.id] ? (
              <VerifyCard key={post.id} post={post} onAction={handleAction} />
            ) : (
              <div key={post.id} className={`verified-done ${actionMap[post.id]}`}>
                <span>{actionMap[post.id] === 'verified' ? '✓' : '⚠'}</span>
                <span className="done-id">{post.id}</span>
                <span className="done-status">{actionMap[post.id]}</span>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}
