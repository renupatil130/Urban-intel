export const CATEGORIES = {
  POTHOLE: { label: 'Pothole / Road Damage', icon: '🛣️', color: '#f59e0b' },
  GARBAGE: { label: 'Garbage / Waste', icon: '🗑️', color: '#10b981' },
  WATER: { label: 'Water Supply', icon: '💧', color: '#38bdf8' },
  SEWAGE: { label: 'Sewage / Drainage', icon: '🚿', color: '#a78bfa' },
  STREETLIGHT: { label: 'Street Light', icon: '💡', color: '#fb923c' },
  ENCROACHMENT: { label: 'Encroachment', icon: '🏗️', color: '#f43f5e' },
  NOISE: { label: 'Noise Pollution', icon: '🔊', color: '#94a3b8' },
  TREE: { label: 'Fallen Tree / Hazard', icon: '🌳', color: '#34d399' },
}

export const WARDS = [
  'Ward 1 – Gandhi Nagar',
  'Ward 2 – S.S.M and Mustafa Nagara',
  'Ward 3 – Siddarameshwara Badavane, Mandakki Bhatti and BD Layout',
  'Ward 4 – Basha Nagara',
  'Ward 5 – Jagajeevan Rao Nagar, SPS Nagara 2nd Stage,Rajeev Gandhi Badavane & SPS Nagara 1st stage',
  'Ward 6 – Kurubara Kere, Shibara and Vijaya nagara Badavane',
  'Ward 7 – Jali nagara, Devaraj Urs Badavane B Block',
  'Ward 8 – Suresh Nagara',
  'Ward 9 – Azad Nagara',
  'Ward 10 – Ganesh Pete',
  'Ward 11 – Basavaraj Pete',
  'Ward 12 – Ahmmed Nagara',
  'Ward 13 – Carl marks nagara, Muddabhovi colony and Koracharahatti',
  'Ward 14 – Chamaraja pete and Basavaraja pete',
  'Ward 15 – Devraj urs badavane & Vinobha nagara',
  'Ward 16 – Vinobha nagara',
  'Ward 17 – P.J. Badavane',
  'Ward 18 – Kaipete and M B kere',
  'Ward 19 – Mandipete I Shekharappa Nagara',
  'Ward 20 – Bharat Colony',
  'Ward 21 – Basavapura',
  'Ward 22 – Yallamma nagara',
  'Ward 23 – Nijalingappa Badavane & S.S. Badavane "A" Block',
  'Ward 24 – M.C.C. "A" Block, P.J. Badavane',
  'Ward 25 – KB Badavane, DCM Quatrus',
  'Ward 26 – KTJ Nagara-2',
  'Ward 27 – KTJ Nagara-1',
  'Ward 28 – Bhagat Singh Nagara',
  'Ward 29 – Nittuvalli Anjaneya Layout and Srirama Badavane',
  'Ward 30 – Avaragere and Goshale',
  'Ward 31 – S.O.G Calony, Anajaneya Mill Badavane',
  'Ward 32 – Nittuvalli Chikkanahalli Badavane',
  'Ward 33 – Saraswati Badavane',
  'Ward 34 – Shivakumaraswamy Layout',
  'Ward 35 – Nittuvalli Hosa Badavane',
  'Ward 36 – Lenin Nagara',
  'Ward 37 – K.E.B Colony',
  'Ward 38 – MCC \'B\' block',
  'Ward 39 – Vidya nagara',
  'Ward 40 – Anjeneya badavane',
  'Ward 41 – Banashankari Badavane & Budda Basava & Industrial Area',
  'Ward 42 – Siddaveerappa Badavane',
  'Ward 43 – Shamanuru & Hosa Kundavada',
  'Ward 44 – S S Badavane B block Hale Kundavada Vinayaka Nagara & Shanthi Nagara',
  'Ward 45 – S J M Nagara, Yaragunte, Karuru'
]

export const SOURCES = ['Reddit', 'Citizen App', 'Bluesky']

export const REAL_PLATFORM_URLS = {
  'Reddit': [
    'https://www.reddit.com/r/bangalore/comments/v3pvhb/sarjapur_road_potholes_are_massive/',
    'https://www.reddit.com/r/bangalore/comments/1b6l7u2/water_crisis_in_bangalore/',
    'https://www.reddit.com/r/bangalore/comments/xpy7p4/sarjapur_road_is_death_trap_now_bbmp_sleeping/'
  ],
  'Citizen App': [
    'https://bbmp.gov.in/'
  ],
  'Bluesky': [
    'https://bsky.app'
  ]
}

export const generatePosts = () => {
  const catKeys = Object.keys(CATEGORIES)
  const severities = ['critical', 'high', 'medium', 'low']
  const statuses = ['verified', 'pending', 'flagged', 'resolved']
  const redditNames = ['u/raghav_blr', 'u/priya_karnataka', 'u/bengaluru_citizen', 'u/techie_hsr', 'u/namma_bengaluru']
  const otherNames = ['User_398', 'Citizen_Blr', 'Namma_Civic_Guard', 'Bengaluru_Watch']

  const posts = [
    'The {cat} near {ward} is absolutely terrible! Has been there for weeks and no one is doing anything about this.',
    'Urgent! {cat} at {ward} junction causing serious problems. Please look into this immediately. #civic #urban',
    'Day 15 of the {cat} problem at {ward}. Still no response from authorities. Tagging @BBMP @Mayor.',
    'Serious {cat} issue spotted at {ward}. This is a safety hazard especially for children and elderly.',
    'Can someone fix the {cat} in {ward}? This has been reported multiple times.',
    'Is anyone even listening?! {cat} at {ward} is now worse than before. Escalating this!',
    'Minor {cat} at {ward} - hoping BBMP picks this up soon. Not too bad yet but needs attention.',
    'Alert: {cat} conditions at {ward} are dangerous. Emergency intervention needed!'
  ]

  const now = Date.now()
  return Array.from({ length: 48 }, (_, i) => {
    const catKey = catKeys[Math.floor(Math.random() * catKeys.length)]
    const ward = WARDS[Math.floor(Math.random() * WARDS.length)]
    const severity = severities[Math.floor(Math.random() * severities.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const source = SOURCES[Math.floor(Math.random() * SOURCES.length)]
    
    let name = ''
    let text = ''
    if (source === 'Reddit') {
      name = redditNames[Math.floor(Math.random() * redditNames.length)]
      const template = posts[Math.floor(Math.random() * posts.length)]
      text = template.replace('{cat}', CATEGORIES[catKey].label.toLowerCase()).replace('{ward}', ward)
    } else {
      name = otherNames[Math.floor(Math.random() * otherNames.length)]
      const template = posts[Math.floor(Math.random() * posts.length)]
      text = template.replace('{cat}', CATEGORIES[catKey].label.toLowerCase()).replace('{ward}', ward)
    }

    const confidence = Math.floor(55 + Math.random() * 45)
    const likes = Math.floor(Math.random() * 400)
    const reposts = Math.floor(Math.random() * 80)
    const cleanWard = ward.split('–')[1]?.trim() || ward
    const queryTerm = `${CATEGORIES[catKey].label.split(' / ')[0].toLowerCase()} ${cleanWard.toLowerCase()}`
    const age = Math.floor(Math.random() * 72)

    return {
      id: `RPT-${String(i + 1001).padStart(5, '0')}`,
      text,
      category: catKey,
      ward,
      severity,
      status,
      source,
      url: (REAL_PLATFORM_URLS[source] || REAL_PLATFORM_URLS['Citizen App'])[Math.floor(Math.random() * (REAL_PLATFORM_URLS[source] || REAL_PLATFORM_URLS['Citizen App']).length)],
      author: name,
      confidence,
      likes,
      reposts,
      timestamp: new Date(now - age * 3600000).toISOString(),
      hoursAgo: age,
      aiSummary: `${CATEGORIES[catKey].label} issue reported in ${ward}. Confidence: ${confidence}%. ${severity === 'critical' ? 'Immediate response required.' : severity === 'high' ? 'High priority action needed.' : 'Scheduled maintenance advised.'}`,
      duplicates: Math.floor(Math.random() * 5),
      coordinates: { lat: 12.97 + (Math.random() - 0.5) * 0.2, lng: 77.59 + (Math.random() - 0.5) * 0.2 }
    }
  })
}

export const CHART_COLORS = {
  accent: '#38bdf8',
  danger: '#f43f5e',
  warning: '#f59e0b',
  success: '#10b981',
  purple: '#a78bfa',
  orange: '#fb923c',
}

export const weeklyTrend = [
  { day: 'Mon', reports: 42, resolved: 28 },
  { day: 'Tue', reports: 58, resolved: 31 },
  { day: 'Wed', reports: 37, resolved: 42 },
  { day: 'Thu', reports: 71, resolved: 35 },
  { day: 'Fri', reports: 84, resolved: 53 },
  { day: 'Sat', reports: 63, resolved: 47 },
  { day: 'Sun', reports: 39, resolved: 38 },
]
