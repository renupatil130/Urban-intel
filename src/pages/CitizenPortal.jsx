import { useState, useEffect, useMemo, useRef } from 'react'
import { WARDS, CATEGORIES } from '../data/mockData'
import './CitizenPortal.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Standard preset samples for testing convenience
const PRESET_PHOTOS = [
  { label: 'Pothole on Main Road', url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80' },
  { label: 'Garbage Dumping Ground', url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=400&q=80' },
  { label: 'Water Leakage / Pipe Burst', url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=400&q=80' },
  { label: 'Broken Streetlights', url: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=400&q=80' },
]

export default function CitizenPortal() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('citizen_user')
    return saved ? JSON.parse(saved) : null
  })

  // Auth States
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  // Form States
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [ward, setWard] = useState(WARDS[0])
  const [category, setCategory] = useState(Object.keys(CATEGORIES)[0])
  const [photo, setPhoto] = useState('')
  const [photoPreview, setPhotoPreview] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Google Map States & bindings
  const mapRef = useRef(null)
  const [googleMap, setGoogleMap] = useState(null)
  const [mapMarker, setMapMarker] = useState(null)
  const googleScriptLoaded = useRef(false)

  const WARD_COORDINATES = useMemo(() => ({
    'Ward 12 – Koramangala': { lat: 12.9352, lng: 77.6244 },
    'Ward 7 – Indiranagar': { lat: 12.9719, lng: 77.6412 },
    'Ward 23 – Jayanagar': { lat: 12.9308, lng: 77.5838 },
    'Ward 45 – Whitefield': { lat: 12.9698, lng: 77.7499 },
    'Ward 31 – HSR Layout': { lat: 12.9128, lng: 77.6388 },
    'Ward 18 – Rajajinagar': { lat: 12.9882, lng: 77.5533 },
    'Ward 56 – Hebbal': { lat: 13.0358, lng: 77.5970 },
    'Ward 8 – MG Road': { lat: 12.9756, lng: 77.6068 }
  }), [])

  // Load Google Maps script
  useEffect(() => {
    if (googleScriptLoaded.current) return
    googleScriptLoaded.current = true

    if (window.google && window.google.maps) {
      return
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    script.async = true
    script.defer = true
    script.onload = () => {
      if (user) initGoogleMap()
    }
    script.onerror = () => {
      console.error('Failed to load Google Maps script')
    }
    document.head.appendChild(script)
  }, [user])

  // Lazy initialize map when user logs in and ref container renders
  useEffect(() => {
    if (user && window.google && window.google.maps && !googleMap) {
      const t = setTimeout(() => {
        initGoogleMap()
      }, 100)
      return () => clearTimeout(t)
    }
  }, [user, googleMap])

  // Sync ward dropdown selection to map marker
  useEffect(() => {
    if (!googleMap || !mapMarker) return
    const coords = WARD_COORDINATES[ward]
    if (coords) {
      const latLng = new window.google.maps.LatLng(coords.lat, coords.lng)
      mapMarker.setPosition(latLng)
      googleMap.panTo(latLng)
    }
  }, [ward, googleMap, mapMarker])

  const initGoogleMap = () => {
    if (!mapRef.current) return
    if (!window.google || !window.google.maps) return
    const defaultCoords = WARD_COORDINATES[ward] || WARD_COORDINATES['Ward 12 – Koramangala']
    
    try {
      const mapObj = new window.google.maps.Map(mapRef.current, {
        center: defaultCoords,
        zoom: 12,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
          { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#cbd5e1' }] },
          { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#cbd5e1' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
          { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1e293b' }] },
          { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] }
        ],
        disableDefaultUI: true,
        zoomControl: true
      })

      const markerObj = new window.google.maps.Marker({
        position: defaultCoords,
        map: mapObj,
        draggable: true,
        title: 'Drag to select location'
      })

      setGoogleMap(mapObj)
      setMapMarker(markerObj)

      // Click listener
      mapObj.addListener('click', (e) => {
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        markerObj.setPosition(e.latLng)
        updateWardFromCoords(lat, lng)
      })

      // Drag listener
      markerObj.addListener('dragend', (e) => {
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        updateWardFromCoords(lat, lng)
      })
    } catch (err) {
      console.error('Error initializing Google Maps:', err)
    }
  }

  const updateWardFromCoords = (lat, lng) => {
    let closestWard = 'Ward 12 – Koramangala'
    let minDistance = Infinity
    
    for (const [wardName, coords] of Object.entries(WARD_COORDINATES)) {
      const dist = Math.pow(lat - coords.lat, 2) + Math.pow(lng - coords.lng, 2)
      if (dist < minDistance) {
        minDistance = dist
        closestWard = wardName
      }
    }
    setWard(closestWard)
  }

  // Data States
  const [complaints, setComplaints] = useState([])
  const [loadingComplaints, setLoadingComplaints] = useState(false)
  const [activeComplaintId, setActiveComplaintId] = useState(null)
  const [chatMessage, setChatMessage] = useState('')
  const [sendingChat, setSendingChat] = useState(false)

  const chatEndRef = useRef(null)

  // Fetch user complaints
  const fetchComplaints = () => {
    if (!user) return
    setLoadingComplaints(true)
    fetch(`${API_BASE}/api/citizen/complaints?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setComplaints(data.complaints)
        }
        setLoadingComplaints(false)
      })
      .catch(err => {
        console.error('Failed to load complaints:', err)
        setLoadingComplaints(false)
      })
  }

  // Load complaints and trigger polling
  useEffect(() => {
    fetchComplaints()
    const timer = setInterval(() => {
      if (user) {
        // Silent background update for real-time messages
        fetch(`${API_BASE}/api/citizen/complaints?userId=${user.id}`)
          .then(res => res.json())
          .then(data => {
            if (data.success) setComplaints(data.complaints)
          })
          .catch(() => {})
      }
    }, 4000)
    return () => clearInterval(timer)
  }, [user])

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeComplaintId, complaints])

  // Handle Auth
  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setAuthError('')
    const endpoint = isRegister ? '/api/citizen/register' : '/api/citizen/login'
    const body = isRegister ? { username, password, email } : { username, password }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed')
      }
      localStorage.setItem('citizen_user', JSON.stringify(data.user))
      setUser(data.user)
    } catch (err) {
      setAuthError(err.message)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('citizen_user')
    setUser(null)
    setComplaints([])
    setActiveComplaintId(null)
  }

  // Handle File Upload to Base64
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setPhoto(reader.result)
      setPhotoPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  // Preset Photo Select
  const handleSelectPreset = (url) => {
    setPhoto(url)
    setPhotoPreview(url)
  }

  // Handle Complaint Submission
  const handleComplaintSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      setSubmitError('Title and description are required')
      return
    }

    setSubmitting(true)
    setSubmitError('')
    setSubmitSuccess(false)

    try {
      const res = await fetch(`${API_BASE}/api/citizen/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          ward,
          category,
          photo,
          userId: user.id,
          username: user.username
        })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Submission failed')
      }
      
      setSubmitSuccess(true)
      setTitle('')
      setDescription('')
      setPhoto('')
      setPhotoPreview('')
      fetchComplaints()
      
      // Auto close success message
      setTimeout(() => setSubmitSuccess(false), 5000)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Send Reply Message to Admin
  const handleSendChat = async (e) => {
    e.preventDefault()
    if (!chatMessage.trim() || !activeComplaintId) return

    setSendingChat(true)
    try {
      const res = await fetch(`${API_BASE}/api/feed/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId: activeComplaintId,
          message: chatMessage,
          sender: 'citizen'
        })
      })
      const data = await res.json()
      if (data.success) {
        setChatMessage('')
        // Locally update complaints payload
        setComplaints(prev => prev.map(c => {
          if (c.id === activeComplaintId) {
            return { ...c, messages: data.messages }
          }
          return c
        }))
      }
    } catch (err) {
      console.error('Failed to send reply:', err)
    } finally {
      setSendingChat(false)
    }
  }

  const activeComplaint = complaints.find(c => c.id === activeComplaintId)

  // Auth Panel Layout
  if (!user) {
    return (
      <div className="citizen-portal-page auth-view">
        <div className="auth-box animate-in">
          <div className="auth-logo">
            <span className="auth-logo-icon">⬡</span>
            <h2>Citizen Complaint Portal</h2>
            <p>Report neighborhood issues directly to Bengaluru local authorities</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {isRegister && (
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@bengaluru.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            )}
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                required
                placeholder="e.g. rahul_k"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {authError && <div className="auth-error-msg">⚠️ {authError}</div>}

            <button type="submit" className="btn-primary auth-submit">
              {isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="auth-toggle">
            {isRegister ? (
              <span>Already have an account? <button onClick={() => { setIsRegister(false); setAuthError(''); }}>Sign In</button></span>
            ) : (
              <span>New to UrbanIntel? <button onClick={() => { setIsRegister(true); setAuthError(''); }}>Register</button></span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="citizen-portal-page main-portal">
      {/* Top Navbar */}
      <header className="portal-header">
        <div className="portal-brand">
          <span className="brand-hex">⬡</span>
          <div>
            <h3>Citizen Portal</h3>
            <p>UrbanIntel Bengaluru</p>
          </div>
        </div>
        <div className="portal-user-nav">
          <span className="user-badge">👤 {user.username}</span>
          <button className="btn-logout" onClick={handleLogout}>Log Out</button>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="portal-grid">
        {/* Left Column: Log New Complaint */}
        <div className="portal-col form-col">
          <div className="portal-card">
            <h3>Report New Civic Problem</h3>
            <p className="card-desc">Provide exact location and description. Uploading photos increases escalation priority.</p>

            <form onSubmit={handleComplaintSubmit} className="complaint-form">
              <div className="form-group">
                <label>Brief Issue Summary (Title)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Huge pothole right in front of corner shop"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Detailed Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the problem, severity, safety risks, and landmarks..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Select Location on Google Maps</label>
                <div className="map-selector-container" style={{ display: 'block', padding: '0px' }}>
                  <div ref={mapRef} style={{ width: '100%', height: '260px', borderRadius: '8px' }} />
                  <div className="map-help-text" style={{ padding: '8px 12px', background: '#0b0f19', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📍 Selected Location: <strong>{ward.split('–')[1]?.trim() || ward}</strong></span>
                    <span style={{ fontSize: '9px', color: '#64748b' }}>Click map or drag pin to select location</span>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Select Ward / Locality</label>
                  <select value={ward} onChange={e => setWard(e.target.value)}>
                    {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div className="form-group half">
                  <label>Problem Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}>
                    {Object.entries(CATEGORIES).map(([key, cat]) => (
                      <option key={key} value={key}>{cat.icon} {cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Add Photo Proof</label>
                <div className="photo-upload-container">
                  <input
                    type="file"
                    id="file-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="file-upload" className="file-upload-lbl">
                    📷 Click to upload photo from device
                  </label>
                  
                  <div className="preset-divider">— OR CHOOSE A TEST PRESET —</div>
                  <div className="preset-row">
                    {PRESET_PHOTOS.map(p => (
                      <button
                        key={p.label}
                        type="button"
                        className="btn-preset-photo"
                        onClick={() => handleSelectPreset(p.url)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {photoPreview && (
                    <div className="upload-preview-box">
                      <img src={photoPreview} alt="Complaint Preview" />
                      <button type="button" className="btn-clear-photo" onClick={() => { setPhoto(''); setPhotoPreview(''); }}>
                        Remove Photo ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {submitError && <div className="error-alert">⚠️ {submitError}</div>}
              {submitSuccess && <div className="success-alert">✓ Complaint submitted successfully! It has been added to the live feed queue.</div>}

              <button type="submit" disabled={submitting} className="btn-primary btn-submit-complaint">
                {submitting ? 'Submitting...' : '🚀 Submit Official Complaint'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Submitted Complaints List & Message Thread */}
        <div className="portal-col list-col">
          {/* Complaints List */}
          <div className="portal-card">
            <h3>My Active Reports</h3>
            {loadingComplaints && complaints.length === 0 ? (
              <p className="loading-txt">Retrieving reports...</p>
            ) : complaints.length === 0 ? (
              <div className="empty-reports-view">
                <p>No complaints submitted yet.</p>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>Use the form on the left to report your first issue.</p>
              </div>
            ) : (
              <div className="portal-complaints-list">
                {complaints.map(c => {
                  const catInfo = CATEGORIES[c.category] || CATEGORIES['POTHOLE']
                  const isExpanded = c.id === activeComplaintId
                  const msgCount = c.messages?.length || 0
                  
                  return (
                    <div 
                      key={c.id} 
                      className={`citizen-complaint-card ${isExpanded ? 'active' : ''}`}
                      onClick={() => setActiveComplaintId(isExpanded ? null : c.id)}
                    >
                      <div className="card-top">
                        <span className="complaint-id">{c.id}</span>
                        <span className={`badge ${c.status}`}>{c.status}</span>
                      </div>
                      <h4 className="complaint-text">{c.text.split(' — ')[0]}</h4>
                      <p className="complaint-subtext">{c.text.split(' — ')[1]?.slice(0, 80)}...</p>
                      
                      <div className="card-meta">
                        <span>{catInfo.icon} {c.ward.split('–')[1]?.trim() || c.ward}</span>
                        {msgCount > 0 && (
                          <span className="chat-notification-indicator">
                            ✉ {msgCount} update{msgCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Messages Drawer */}
          {activeComplaintId && activeComplaint && (
            <div className="portal-card chat-card animate-in">
              <div className="chat-header-bar">
                <div>
                  <h4>Status Update Chat: {activeComplaint.id}</h4>
                  <p>Status: <strong className={`badge ${activeComplaint.status}`} style={{ display: 'inline', padding: '0.1rem 0.4rem', fontSize: '0.75rem' }}>{activeComplaint.status}</strong></p>
                </div>
                <button className="chat-close-btn" onClick={() => setActiveComplaintId(null)}>✕</button>
              </div>

              {activeComplaint.photo && (
                <div className="chat-attachment-preview">
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Attached Evidence:</span>
                  <img src={activeComplaint.photo} alt="evidence preview" />
                </div>
              )}

              <div className="chat-timeline">
                <div className="system-msg bubble">
                  <span className="chat-sender">System Node</span>
                  <p>Complaint logged. AI classification assigned: <strong>Category: {activeComplaint.category}</strong> with <strong>{activeComplaint.severity} severity</strong> ({activeComplaint.confidence}% confidence).</p>
                  <span className="chat-time">{new Date(activeComplaint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {(activeComplaint.messages || []).map((msg, index) => {
                  const isCitizen = msg.sender === 'citizen'
                  return (
                    <div key={index} className={`chat-bubble-wrapper ${isCitizen ? 'citizen' : 'admin'}`}>
                      <div className="chat-bubble">
                        <span className="chat-sender">{isCitizen ? 'You' : 'Officer / Admin'}</span>
                        <p>{msg.text}</p>
                        <span className="chat-time">
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </div>
                  )
                })}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendChat} className="chat-input-row">
                <input
                  type="text"
                  placeholder="Type your message reply..."
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                />
                <button type="submit" disabled={sendingChat || !chatMessage.trim()} className="btn-send-chat">
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
