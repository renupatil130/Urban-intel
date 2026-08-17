import { useState, useEffect, useMemo } from 'react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { generatePosts, CATEGORIES, CHART_COLORS } from '../data/mockData'
import { useFeed } from '../hooks/useFeed'
import './Dashboard.css'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    )
  }
  return null
}

function getHoursAgo(timestamp) {
  if (!timestamp) return 'N/A'
  const diffMs = Date.now() - new Date(timestamp).getTime()
  const diffHours = Math.round(diffMs / (3600 * 1000))
  return diffHours <= 0 ? 'just now' : `${diffHours}h ago`
}

export default function Dashboard() {
  const { posts: livePosts, meta } = useFeed()
  const posts = livePosts
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 3000)
    return () => clearInterval(t)
  }, [])

  const stats = useMemo(() => {
    const total = posts.length
    const verified = posts.filter(p => p.status === 'verified').length
    const critical = posts.filter(p => p.severity === 'critical').length
    const pending = posts.filter(p => p.status === 'pending' || p.status === 'reviewing').length
    const avgConfidence = total > 0 ? Math.round(posts.reduce((a, p) => a + p.confidence, 0) / total) : 0
    return { total, verified, critical, pending, avgConfidence }
  }, [posts])

  // Compute weekly trend dynamically based on actual post timestamps
  const weeklyTrend = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dayData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return {
        day: days[d.getDay()],
        reports: 0,
        resolved: 0,
        dateString: d.toDateString()
      }
    }).reverse()

    posts.forEach(p => {
      if (!p.timestamp) return
      const pDate = new Date(p.timestamp).toDateString()
      const matchedDay = dayData.find(d => d.dateString === pDate)
      if (matchedDay) {
        matchedDay.reports += 1
        if (p.status === 'resolved') {
          matchedDay.resolved += 1
        }
      }
    })
    
    return dayData.map(({ day, reports, resolved }) => ({ day, reports, resolved }))
  }, [posts])

  const categoryData = useMemo(() => {
    const counts = {}
    posts.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1 })
    return Object.entries(counts).map(([key, count]) => ({
      name: CATEGORIES[key]?.label?.split(' / ')[0]?.split(' ')?.slice(0, 2)?.join(' ') || key,
      value: count,
      color: CATEGORIES[key]?.color || '#4b6282'
    })).sort((a, b) => b.value - a.value)
  }, [posts])

  const severityData = useMemo(() => [
    { name: 'Critical', value: posts.filter(p => p.severity === 'critical').length, color: CHART_COLORS.danger },
    { name: 'High', value: posts.filter(p => p.severity === 'high').length, color: CHART_COLORS.warning },
    { name: 'Medium', value: posts.filter(p => p.severity === 'medium').length, color: CHART_COLORS.purple },
    { name: 'Low', value: posts.filter(p => p.severity === 'low').length, color: CHART_COLORS.success },
  ], [posts])

  // Sort recent alerts correctly by their true timestamp
  const recentPosts = useMemo(() => {
    return posts
      .filter(p => p.status !== 'resolved')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 6)
  }, [posts])

  const liveCount = stats.total

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Intelligence Dashboard</h1>
          <p className="page-sub">Real-time municipal issue monitoring · Bengaluru Urban District</p>
        </div>
        <div className="header-right">
          <div className="live-badge">
            <span className="live-dot-sm" />
            LIVE MONITORING
          </div>
          <div className="timestamp">Updated {tick * 3}s ago · Reddit: {meta.reddit} · News: {meta.news} · Bluesky: {meta.bluesky}</div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-top">
            <span className="stat-label">Total Signals</span>
            <span className="stat-icon">◈</span>
          </div>
          <div className="stat-value">{liveCount.toLocaleString()}</div>
          <div className="stat-sub">↑ 12% vs yesterday</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-top">
            <span className="stat-label">Critical Issues</span>
            <span className="stat-icon">⚠</span>
          </div>
          <div className="stat-value">{stats.critical}</div>
          <div className="stat-sub">Needs immediate action</div>
        </div>
        <div className="stat-card success">
          <div className="stat-top">
            <span className="stat-label">Verified Reports</span>
            <span className="stat-icon">◎</span>
          </div>
          <div className="stat-value">{stats.verified}</div>
          <div className="stat-sub">{stats.total > 0 ? Math.round(stats.verified / stats.total * 100) : 0}% verification rate</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-top">
            <span className="stat-label">Pending Review</span>
            <span className="stat-icon">◇</span>
          </div>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-sub">Awaiting classification</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-top">
            <span className="stat-label">AI Confidence</span>
            <span className="stat-icon">⬡</span>
          </div>
          <div className="stat-value">{stats.avgConfidence}%</div>
          <div className="stat-sub">Average model accuracy</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="card chart-card">
          <div className="chart-header">
            <h3>Weekly Trend — Reports vs Resolved</h3>
            <div className="chart-legend">
              <span><span className="legend-dot" style={{ background: CHART_COLORS.accent }} />Reports</span>
              <span><span className="legend-dot" style={{ background: CHART_COLORS.success }} />Resolved</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.08)" />
              <XAxis dataKey="day" tick={{ fill: '#4b6282', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4b6282', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="reports" name="Reports" stroke={CHART_COLORS.accent} strokeWidth={2} fill="url(#colorReports)" />
              <Area type="monotone" dataKey="resolved" name="Resolved" stroke={CHART_COLORS.success} strokeWidth={2} fill="url(#colorResolved)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card chart-card-sm">
          <div className="chart-header">
            <h3>Severity Split</h3>
          </div>
          <div className="pie-wrap">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" innerRadius={42} outerRadius={70} paddingAngle={3} dataKey="value">
                  {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              {severityData.map((d, i) => (
                <div key={i} className="pie-legend-row">
                  <span className="legend-dot" style={{ background: d.color }} />
                  <span>{d.name}</span>
                  <span className="legend-val">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category Bar + Recent Reports */}
      <div className="bottom-row">
        <div className="card chart-card">
          <div className="chart-header">
            <h3>Issues by Category</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.08)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#4b6282', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card recent-card">
          <div className="chart-header">
            <h3>Recent Alerts</h3>
            <a href="/feed" className="view-all">View all →</a>
          </div>
          <div className="recent-list">
            {recentPosts.map((post, i) => (
              <div 
                key={post.id} 
                className="recent-item" 
                style={{ animationDelay: `${i * 60}ms`, cursor: 'pointer' }}
                onClick={() => window.location.href = `/feed?reviewId=${post.id}`}
              >
                <div className="recent-icon" style={{ color: CATEGORIES[post.category]?.color || '#4b6282' }}>
                  {CATEGORIES[post.category]?.icon || '◉'}
                </div>
                <div className="recent-content">
                  <div className="recent-top">
                    <span className="recent-id">{post.id}</span>
                    <span className={`badge ${post.severity}`}>{post.severity}</span>
                  </div>
                  <p className="recent-text">{post.text.slice(0, 72)}…</p>
                  <div className="recent-meta">
                    <span>{post.ward?.split('–')[1]?.trim() || post.ward || 'Bengaluru'}</span>
                    <span>·</span>
                    <span>{getHoursAgo(post.timestamp)}</span>
                    <span>·</span>
                    <span style={{ color: 'var(--success)' }}>{post.confidence}% conf.</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
