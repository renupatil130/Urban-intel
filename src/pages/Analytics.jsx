import { useMemo, useState } from 'react'
import { BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter } from 'recharts'
import { generatePosts, CATEGORIES, CHART_COLORS } from '../data/mockData'
import { useFeed } from '../hooks/useFeed'
import './Analytics.css'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((p, i) => <p key={i} style={{ color: p.color || p.fill }}>{p.name}: {p.value}</p>)}
      </div>
    )
  }
  return null
}

export default function Analytics() {
  const { posts: livePosts } = useFeed()
  const posts = livePosts



  // Hourly Report Volume derived from actual live timestamps
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2, '0')}:00`,
      reports: 0,
      critical: 0,
    }))
    
    posts.forEach(p => {
      const date = new Date(p.timestamp)
      const h = date.getHours()
      if (h >= 0 && h < 24) {
        hours[h].reports += 1
        if (p.confidence >= 80 || p.severity === 'critical') {
          hours[h].critical += 1
        }
      }
    })
    return hours
  }, [posts])

  // System Performance Radar metrics
  const radarData = useMemo(() => {
    const total = posts.length || 1
    const avgConf = Math.round(posts.reduce((a, p) => a + p.confidence, 0) / total)
    const verifiedPct = Math.round(posts.filter(p => p.status === 'verified').length / total * 100)
    
    const uniqueWards = new Set(posts.map(p => p.ward).filter(Boolean))
    const coveragePct = Math.min(100, Math.round((uniqueWards.size / 8) * 100))

    return [
      { subject: 'Response Time', A: 78 },
      { subject: 'Classification', A: avgConf },
      { subject: 'Verification', A: Math.max(35, verifiedPct) },
      { subject: 'Coverage', A: Math.max(25, coveragePct) },
      { subject: 'Accuracy', A: Math.round(avgConf * 0.96) },
      { subject: 'Throughput', A: Math.min(100, Math.round(total * 1.5)) },
    ]
  }, [posts])

  // Bengaluru Ward statistics based on live posts
  const bengaluruWardData = useMemo(() => {
    const counts = {}
    posts.forEach(p => { 
      const isDvg = p.source === 'Citizen Portal' || p.source.toLowerCase().includes('davangere') || p.ward?.includes('Ward')
      if (!isDvg) {
        const w = p.ward?.split('–')[1]?.trim() || p.ward || 'Bengaluru'
        counts[w] = (counts[w] || 0) + 1 
      }
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [posts])

  // Davangere Ward statistics based on live posts
  const davangereWardData = useMemo(() => {
    const counts = {}
    posts.forEach(p => { 
      const isDvg = p.source === 'Citizen Portal' || p.source.toLowerCase().includes('davangere') || p.ward?.includes('Ward')
      if (isDvg) {
        const w = p.ward?.split('–')[1]?.trim() || p.ward || 'Davangere'
        counts[w] = (counts[w] || 0) + 1 
      }
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [posts])

  // Source statistics based on live posts
  const sourceData = useMemo(() => {
    const counts = {}
    posts.forEach(p => { 
      // Simplify source name
      let cleanSource = p.source
      if (p.source.startsWith('Reddit')) cleanSource = 'Reddit'
      else if (p.source.startsWith('Quora')) cleanSource = 'Quora'
      counts[cleanSource] = (counts[cleanSource] || 0) + 1 
    })
    return Object.entries(counts).map(([name, count]) => ({ name, count }))
  }, [posts])

  // Category statistics based on live posts
  const catData = useMemo(() => {
    const counts = {}
    posts.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1 })
    return Object.entries(counts).map(([k, count]) => ({
      name: CATEGORIES[k]?.label?.split(' ')[0] || k,
      count,
      color: CATEGORIES[k]?.color || '#4b6282'
    })).sort((a, b) => b.count - a.count)
  }, [posts])



  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics & Insights</h1>
          <p className="page-sub">Comprehensive performance metrics and trend analysis</p>
        </div>
      </div>


      <div className="analytics-grid">
        {/* Hourly reports */}
        <div className="card full-width">
          <h3 className="chart-title">Hourly Report Volume (Today)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={hourlyData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.08)" />
              <XAxis dataKey="hour" tick={{ fill: '#4b6282', fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fill: '#4b6282', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="reports" name="Reports" stroke={CHART_COLORS.accent} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="critical" name="Critical" stroke={CHART_COLORS.danger} strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bengaluru Ward distribution */}
        <div className="card">
          <h3 className="chart-title">Bengaluru Wards</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bengaluruWardData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.08)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#4b6282', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Reports" fill={CHART_COLORS.accent} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Davangere Ward distribution */}
        <div className="card">
          <h3 className="chart-title">Davangere Wards</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={davangereWardData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.08)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#4b6282', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Reports" fill={CHART_COLORS.success} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* System performance radar */}
        <div className="card">
          <h3 className="chart-title">System Performance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart cx="50%" cy="50%" outerRadius={80} data={radarData}>
              <PolarGrid stroke="rgba(99,179,237,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b6282', fontSize: 10 }} />
              <Radar name="Score" dataKey="A" stroke={CHART_COLORS.accent} fill={CHART_COLORS.accent} fillOpacity={0.2} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Source breakdown */}
        <div className="card">
          <h3 className="chart-title">Reports by Source Platform</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={sourceData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.08)" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4b6282', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                {sourceData.map((_, i) => <Cell key={i} fill={Object.values(CHART_COLORS)[i % 6] || CHART_COLORS.accent} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="source-legend">
            {sourceData.map((s, i) => (
              <div key={i} className="sl-item">
                <span className="sl-dot" style={{ background: Object.values(CHART_COLORS)[i % 6] || CHART_COLORS.accent }} />
                <span>{s.name}</span>
                <span className="sl-count">{posts.length > 0 ? Math.round(s.count / posts.length * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>


        {/* Category breakdown */}
        <div className="card">
          <h3 className="chart-title">Issue Category Distribution</h3>
          <div className="cat-breakdown">
            {catData.map((c, i) => (
              <div key={i} className="cat-row">
                <div className="cat-bar-track">
                  <div className="cat-label-row">
                    <span className="cat-name">{c.name}</span>
                    <span className="cat-count">{c.count}</span>
                  </div>
                  <div className="cat-bar">
                    <div className="cat-fill" style={{ width: `${c.count / Math.max(1, ...catData.map(x => x.count)) * 100}%`, background: c.color }} />
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
