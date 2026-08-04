import { useState, useEffect, useCallback, useRef } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const POLL_INTERVAL = 60_000 // 60 seconds

export function useFeed() {
  const [posts, setPosts]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [meta, setMeta]             = useState({ reddit: 0, news: 0, bluesky: 0, total: 0, lastUpdated: null })
  const [newCount, setNewCount]     = useState(0)
  const [apiStatus, setApiStatus]   = useState('connecting') // connecting | online | offline
  const seenIds                     = useRef(new Set())
  const timerRef                    = useRef(null)

  const fetchFeed = useCallback(async (force = false) => {
    try {
      const url = `${API_BASE}/api/feed${force ? '?refresh=true' : ''}`
      const res = await fetch(url, { signal: AbortSignal.timeout(25_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()

      // Count genuinely new posts since last fetch
      const freshIds = json.posts.map(p => p.id)
      const newOnes  = freshIds.filter(id => !seenIds.current.has(id))
      freshIds.forEach(id => seenIds.current.add(id))

      if (newOnes.length > 0 && posts.length > 0) {
        setNewCount(n => n + newOnes.length)
      }

      setPosts(json.posts)
      setMeta({ 
        reddit: json.reddit, 
        news: json.news || 0, 
        bluesky: json.bluesky || 0, 
        total: json.total, 
        lastUpdated: json.lastUpdated 
      })
      setApiStatus('online')
      setError(null)
    } catch (err) {
      console.error('[useFeed]', err.message)
      setError(err.message)
      setApiStatus('offline')
    } finally {
      setLoading(false)
    }
  }, [posts.length])

  // Initial fetch
  useEffect(() => {
    fetchFeed(true)
  }, [])

  // Auto-poll every 60s
  useEffect(() => {
    timerRef.current = setInterval(() => fetchFeed(false), POLL_INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [fetchFeed])

  const refresh = useCallback(() => {
    setNewCount(0)
    fetchFeed(true)
  }, [fetchFeed])

  const dismissNew = useCallback(() => setNewCount(0), [])

  return { posts, loading, error, meta, newCount, apiStatus, refresh, dismissNew }
}

export function useApiStatus() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/api/status`)
      .then(r => r.json())
      .then(data => { setStatus(data); setLoading(false) })
      .catch(() => { setLoading(false) })
  }, [])

  return { status, loading }
}
