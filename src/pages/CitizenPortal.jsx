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

  // Leaflet Map States & bindings
  const mapRef = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)

  const WARD_COORDINATES = useMemo(() => ({
    'Ward 1 – Gandhi Nagar': { lat: 14.465, lng: 75.915 },
    'Ward 2 – S.S.M and Mustafa Nagara': { lat: 14.468, lng: 75.918 },
    'Ward 3 – Siddarameshwara Badavane, Mandakki Bhatti and BD Layout': { lat: 14.462, lng: 75.922 },
    'Ward 4 – Basha Nagara': { lat: 14.459, lng: 75.913 },
    'Ward 5 – Jagajeevan Rao Nagar, SPS Nagara 2nd Stage,Rajeev Gandhi Badavane & SPS Nagara 1st stage': { lat: 14.471, lng: 75.925 },
    'Ward 6 – Kurubara Kere, Shibara and Vijaya nagara Badavane': { lat: 14.475, lng: 75.911 },
    'Ward 7 – Jali nagara, Devaraj Urs Badavane B Block': { lat: 14.466, lng: 75.929 },
    'Ward 8 – Suresh Nagara': { lat: 14.453, lng: 75.916 },
    'Ward 9 – Azad Nagara': { lat: 14.461, lng: 75.920 },
    'Ward 10 – Ganesh Pete': { lat: 14.457, lng: 75.923 },
    'Ward 11 – Basavaraj Pete': { lat: 14.455, lng: 75.927 },
    'Ward 12 – Ahmmed Nagara': { lat: 14.473, lng: 75.919 },
    'Ward 13 – Carl marks nagara, Muddabhovi colony and Koracharahatti': { lat: 14.478, lng: 75.924 },
    'Ward 14 – Chamaraja pete and Basavaraja pete': { lat: 14.451, lng: 75.914 },
    'Ward 15 – Devraj urs badavane & Vinobha nagara': { lat: 14.482, lng: 75.931 },
    'Ward 16 – Vinobha nagara': { lat: 14.484, lng: 75.933 },
    'Ward 17 – P.J. Badavane': { lat: 14.469, lng: 75.928 },
    'Ward 18 – Kaipete and M B kere': { lat: 14.463, lng: 75.935 },
    'Ward 19 – Mandipete I Shekharappa Nagara': { lat: 14.460, lng: 75.938 },
    'Ward 20 – Bharat Colony': { lat: 14.452, lng: 75.930 },
    'Ward 21 – Basavapura': { lat: 14.449, lng: 75.926 },
    'Ward 22 – Yallamma nagara': { lat: 14.446, lng: 75.922 },
    'Ward 23 – Nijalingappa Badavane & S.S. Badavane "A" Block': { lat: 14.443, lng: 75.918 },
    'Ward 24 – M.C.C. "A" Block, P.J. Badavane': { lat: 14.471, lng: 75.936 },
    'Ward 25 – KB Badavane, DCM Quatrus': { lat: 14.458, lng: 75.942 },
    'Ward 26 – KTJ Nagara-2': { lat: 14.467, lng: 75.945 },
    'Ward 27 – KTJ Nagara-1': { lat: 14.469, lng: 75.947 },
    'Ward 28 – Bhagat Singh Nagara': { lat: 14.474, lng: 75.950 },
    'Ward 29 – Nittuvalli Anjaneya Layout and Srirama Badavane': { lat: 14.440, lng: 75.934 },
    'Ward 30 – Avaragere and Goshale': { lat: 14.437, lng: 75.930 },
    'Ward 31 – S.O.G Calony, Anajaneya Mill Badavane': { lat: 14.434, lng: 75.926 },
    'Ward 32 – Nittuvalli Chikkanahalli Badavane': { lat: 14.442, lng: 75.938 },
    'Ward 33 – Saraswati Badavane': { lat: 14.445, lng: 75.942 },
    'Ward 34 – Shivakumaraswamy Layout': { lat: 14.448, lng: 75.946 },
    'Ward 35 – Nittuvalli Hosa Badavane': { lat: 14.439, lng: 75.940 },
    'Ward 36 – Lenin Nagara': { lat: 14.435, lng: 75.944 },
    'Ward 37 – K.E.B Colony': { lat: 14.453, lng: 75.952 },
    'Ward 38 – MCC \'B\' block': { lat: 14.475, lng: 75.938 },
    'Ward 39 – Vidya nagara': { lat: 14.431, lng: 75.922 },
    'Ward 40 – Anjeneya badavane': { lat: 14.428, lng: 75.918 },
    'Ward 41 – Banashankari Badavane &  Budda Basava & Industrial Area': { lat: 14.425, lng: 75.914 },
    'Ward 42 – Siddaveerappa Badavane': { lat: 14.433, lng: 75.910 },
    'Ward 43 – Shamanuru & Hosa Kundavada': { lat: 14.430, lng: 75.906 },
    'Ward 44 – S S Badavane B block Hale Kundavada Vinayaka Nagara & Shanthi Nagara': { lat: 14.436, lng: 75.912 },
    'Ward 45 – S J M Nagara, Yaragunte, Karuru': { lat: 14.439, lng: 75.916 }
  }), [])

  // Load Leaflet resources dynamically
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

  // Lazy initialize map when user logs in and container renders
  useEffect(() => {
    if (user && mapLoaded && !mapInstanceRef.current) {
      const t = setTimeout(() => {
        initLeafletMap()
      }, 100)
      return () => clearTimeout(t)
    }
  }, [user, mapLoaded])

  // Sync ward dropdown selection to map marker
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return
    const coords = WARD_COORDINATES[ward]
    if (coords) {
      markerRef.current.setLatLng([coords.lat, coords.lng])
      mapInstanceRef.current.panTo([coords.lat, coords.lng])
    }
  }, [ward])

  const initLeafletMap = () => {
    if (!mapRef.current || !window.L) return
    const L = window.L
    const defaultCoords = WARD_COORDINATES[ward] || WARD_COORDINATES['Ward 1 – Gandhi Nagar']
    
    // Check if container already initialized
    const mapEl = mapRef.current
    if (mapEl && mapEl._leaflet_id) return

    try {
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([defaultCoords.lat, defaultCoords.lng], 13)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      const color = '#38bdf8'
      const pinIcon = L.divIcon({
        className: 'custom-pin-icon',
        html: `<div style="
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
          <span style="transform: rotate(45deg); font-size: 10px;">📍</span>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24]
      })

      const marker = L.marker([defaultCoords.lat, defaultCoords.lng], {
        draggable: true,
        icon: pinIcon
      }).addTo(map)

      mapInstanceRef.current = map
      markerRef.current = marker

      // Map click handler
      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        marker.setLatLng(e.latlng)
        updateWardFromCoords(lat, lng)
      })

      // Marker drag handler
      marker.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng()
        updateWardFromCoords(lat, lng)
      })

    } catch (err) {
      console.error('Error initializing Leaflet map:', err)
    }
  }

  const updateWardFromCoords = (lat, lng) => {
    let closestWard = 'Ward 1 – Gandhi Nagar'
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

  const handleDeleteComplaint = async (id) => {
    if (!window.confirm("Are you sure you want to delete this complaint? This cannot be undone.")) return
    try {
      const res = await fetch(`${API_BASE}/api/citizen/complaints/${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        setComplaints(prev => prev.filter(c => c.id !== id))
        if (activeComplaintId === id) {
          setActiveComplaintId(null)
        }
      }
    } catch (err) {
      console.error('Failed to delete complaint:', err)
    }
  }

  const activeComplaints = useMemo(() => complaints.filter(c => c.status !== 'resolved'), [complaints])
  const resolvedComplaints = useMemo(() => complaints.filter(c => c.status === 'resolved'), [complaints])

  const activeComplaint = complaints.find(c => c.id === activeComplaintId)

  // Auth Panel Layout
  if (!user) {
    return (
      <div className="citizen-portal-page auth-view">
        <div className="auth-box animate-in">
          <div className="auth-logo">
            <span className="auth-logo-icon">⬡</span>
            <h2>Citizen Complaint Portal</h2>
            <p>Report neighborhood issues directly to Davangere local authorities</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {isRegister && (
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@davangere.com"
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
            <p>UrbanIntel Davangere</p>
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
                <label>Select Location on Map</label>
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
            ) : activeComplaints.length === 0 ? (
              <div className="empty-reports-view">
                <p>No active complaints at the moment.</p>
              </div>
            ) : (
              <div className="portal-complaints-list">
                {activeComplaints.map(c => {
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

          {resolvedComplaints.length > 0 && (
            <div className="portal-card" style={{ marginTop: '20px' }}>
              <h3>Resolved History</h3>
              <div className="portal-complaints-list">
                {resolvedComplaints.map(c => {
                  const catInfo = CATEGORIES[c.category] || CATEGORIES['POTHOLE']
                  const isExpanded = c.id === activeComplaintId
                  const msgCount = c.messages?.length || 0
                  
                  return (
                    <div 
                      key={c.id} 
                      className={`citizen-complaint-card resolved ${isExpanded ? 'active' : ''}`}
                      onClick={() => setActiveComplaintId(isExpanded ? null : c.id)}
                      style={{ opacity: 0.75 }}
                    >
                      <div className="card-top">
                        <span className="complaint-id">{c.id}</span>
                        <span className={`badge ${c.status}`}>{c.status}</span>
                      </div>
                      <h4 className="complaint-text">{c.text.split(' — ')[0]}</h4>
                      <p className="complaint-subtext">{c.text.split(' — ')[1]?.slice(0, 80)}...</p>
                      
                      <div className="card-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span>{catInfo.icon} {c.ward.split('–')[1]?.trim() || c.ward}</span>
                        <button 
                          className="btn-delete-complaint"
                          style={{
                            background: 'var(--danger)',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            zIndex: 10
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteComplaint(c.id);
                          }}
                        >
                          Delete ✕
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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

              {activeComplaint.resolvedPhoto && (
                <div className="chat-attachment-preview" style={{ border: '2px solid var(--success)', padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.05)', marginTop: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>✓ Resolution Proof attached by Officer:</span>
                  <img src={activeComplaint.resolvedPhoto} alt="resolution proof" style={{ maxWidth: '100%', borderRadius: '4px' }} />
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
