import { useState } from 'react'
import { CATEGORIES, WARDS } from '../data/mockData'
import './Classify.css'

const SAMPLE_TEXTS = [
  "The road near Koramangala junction has a massive pothole that has been there for 3 weeks. Two bikes have already fallen. Please fix this urgently @BBMP",
  "There is garbage overflow happening near HSR Layout ward 31 sector 2. Bins haven't been cleared since Monday and it's attracting stray dogs.",
  "Street light at Indiranagar 100ft road is broken since 10 days. Extremely dangerous at night! Request immediate repair.",
  "Water supply in Jayanagar 4th block is contaminated. Dark brown water coming from taps. Multiple residents falling sick. Health emergency!",
  "Sewage overflowing near Whitefield main road since morning. Entire street is flooded with dirty water. Major health hazard.",
  "Massive tree has fallen on Rajajinagar main road blocking half the road. Traffic jam for 2km. Need BBMP tree cutting team ASAP."
]

function ConfidenceBar({ value, label, color }) {
  return (
    <div className="conf-row">
      <span className="conf-label">{label}</span>
      <div className="conf-bar-wrap">
        <div className="conf-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="conf-val">{value}%</span>
    </div>
  )
}

export default function Classify() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)

  const analyzeText = async (inputText) => {
    const t = inputText || text
    if (!t.trim()) return
    setLoading(true)
    setResult(null)
    setStep(0)

    const steps = ['Tokenizing input…', 'Detecting language & context…', 'Running classification model…', 'Calculating confidence…', 'Generating summary…']
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 300))
      setStep(i + 1)
    }

    // ── Weighted category scoring ──
    const t2 = t.toLowerCase()

    const CAT_RULES = {
      POTHOLE:      [
        [10, ['pothole', 'pot hole', 'potholes']],
        [8,  ['road damage', 'road repair', 'road broken', 'bad road', 'road condition']],
        [7,  ['crater', 'sinkhole', 'sink hole', 'road collapsed', 'road cave']],
        [6,  ['road crack', 'broken road', 'damaged road', 'road dug']],
        [5,  ['road', 'highway', 'tar road', 'asphalt']],
        [4,  ['tyre burst', 'vehicle damaged', 'fell from bike', 'accident road']],
      ],
      GARBAGE:      [
        [10, ['garbage', 'rubbish', 'waste dump', 'trash dump']],
        [9,  ['bbmp garbage', 'garbage collection', 'waste not collected', 'garbage not collected']],
        [8,  ['waste', 'trash', 'litter', 'littering', 'dumping', 'open dump']],
        [7,  ['swachh', 'sanitation', 'pourakarmikas', 'garbage bin', 'dustbin overflow']],
        [6,  ['stinking', 'foul smell', 'rotting', 'smell bad', 'decompose']],
        [5,  ['filth', 'dirty', 'unhygienic', 'unclean', 'waste pile']],
      ],
      WATER:        [
        [10, ['water supply', 'no water', 'water cut', 'water not coming', 'water shortage']],
        [9,  ['bwssb', 'water board', 'water connection', 'pipe burst', 'water pipeline']],
        [8,  ['contaminated water', 'dirty water', 'brown water', 'muddy water']],
        [7,  ['water leak', 'water leakage', 'pipe leak', 'water wastage']],
        [6,  ['drinking water', 'tap water', 'water tank', 'water tanker', 'water lorry']],
        [5,  ['water problem', 'water issue', 'water complaint']],
      ],
      SEWAGE:       [
        [10, ['sewage', 'sewer', 'sewerage']],
        [9,  ['drain overflow', 'blocked drain', 'drain blocked', 'drain choked', 'drainage overflow']],
        [8,  ['manhole', 'open manhole', 'manhole cover', 'uncovered drain']],
        [7,  ['drainage', 'drain problem', 'stormwater', 'rainwater drain']],
        [6,  ['sewage overflow', 'sewage leak', 'sewage smell', 'sewage on road']],
        [5,  ['waterlogging', 'water logging', 'road flooded', 'flooded street', 'flooding road']],
      ],
      STREETLIGHT:  [
        [10, ['street light', 'streetlight', 'street lamp', 'street lighting']],
        [9,  ['light not working', 'light broken', 'no light', 'lights off', 'dark road']],
        [8,  ['lamp post', 'pole light', 'sodium lamp', 'led light broken', 'light pole']],
        [7,  ['no lighting', 'road dark', 'area dark', 'unlit road', 'dangerous at night']],
        [6,  ['power cut street', 'electricity problem street', 'light repair']],
        [5,  ['dark area', 'night safety', 'visibility problem']],
      ],
      ENCROACHMENT: [
        [10, ['encroachment', 'encroached', 'illegal encroachment']],
        [9,  ['illegal construction', 'illegal building', 'unauthorized construction']],
        [8,  ['footpath blocked', 'pavement blocked', 'footpath encroached']],
        [7,  ['hawker blocking', 'vendor blocking', 'shop blocking road', 'stall blocking']],
        [6,  ['parking blocking footpath', 'vehicle on footpath', 'road encroachment']],
        [5,  ['footpath', 'pavement', 'sidewalk', 'public space']],
      ],
      NOISE:        [
        [10, ['noise pollution', 'sound pollution', 'noise complaint']],
        [9,  ['loudspeaker', 'loud music', 'loud noise', 'excessive noise', 'blaring']],
        [8,  ['honking', 'horn noise', 'construction noise', 'vehicle noise']],
        [7,  ['generator noise', 'factory noise', 'pub noise', 'bar loud']],
        [6,  ['disturbing noise', 'midnight noise', 'night noise', 'sleep disturbance']],
        [5,  ['too loud', 'unbearable noise', 'noise at night']],
      ],
      TREE:         [
        [10, ['fallen tree', 'tree fell', 'tree fallen', 'uprooted tree']],
        [9,  ['tree branch fell', 'branch broken', 'dead tree', 'tree blocking road']],
        [8,  ['tree uprooted', 'tree dangerous', 'tree about to fall']],
        [7,  ['illegal tree cutting', 'tree removal', 'tree cutting']],
        [6,  ['overgrown tree', 'tree trimming needed', 'park maintenance']],
        [5,  ['fallen branch', 'blocking path tree']],
      ],
    }

    const catScoreMap = {}
    for (const [cat, rules] of Object.entries(CAT_RULES)) {
      let score = 0
      for (const [w, phrases] of rules) {
        for (const phrase of phrases) {
          if (t2.includes(phrase)) score += w
        }
      }
      catScoreMap[cat] = score
    }

    const sortedCats = Object.entries(catScoreMap).sort((a, b) => b[1] - a[1])
    const category = sortedCats[0][1] > 0 ? sortedCats[0][0] : 'GARBAGE'
    const topScore = sortedCats[0][1]

    // Build catScores array for display (normalize to 0-100)
    const maxScore = Math.max(...Object.values(catScoreMap), 1)
    const catScores = sortedCats.map(([key, score]) => ({
      key,
      score: Math.round((score / maxScore) * 100)
    }))

    // ── Severity scoring ──
    const SEV_RULES = [
      { level: 'critical', pts: 30, words: ['urgent', 'emergency', 'life threatening', 'someone injured', 'accident happened', 'death', 'died', 'collapsed', 'fire', 'electrocution', 'electric shock', 'hospital', 'flood', 'sinkhole collapsed'] },
      { level: 'high',     pts: 20, words: ['serious', 'very bad', 'extremely bad', 'immediate', 'no response', 'weeks now', 'months', 'many days', 'already reported', 'still not fixed', 'hazardous', 'health risk', 'children', 'elderly'] },
      { level: 'medium',   pts: 10, words: ['please fix', 'kindly fix', 'need repair', 'few days', 'since yesterday', 'since last week', 'complaint', 'inconvenience', 'issue', 'problem'] },
    ]
    const NEG_WORDS = ['not working', 'broken', 'damaged', 'overflow', 'blocked', 'collapsed', 'burst', 'leak', 'dangerous', 'hazard']
    let severityScore = NEG_WORDS.filter(w => t2.includes(w)).length * 5
    for (const rule of SEV_RULES) {
      const matched = rule.words.filter(w => t2.includes(w)).length
      severityScore += matched * rule.pts
    }
    const severity = severityScore >= 30 ? 'critical' : severityScore >= 20 ? 'high' : severityScore >= 10 ? 'medium' : 'low'

    // ── Confidence ──
    const CIVIC_KW = ['bbmp','bwssb','bangalore','bengaluru','ward','road','water','drain','garbage','sewage','light','tree','noise','footpath','encroach','pothole','municipal','civic']
    const civicMatched = CIVIC_KW.filter(k => t2.includes(k)).length
    const confidence = Math.min(97, Math.round(40 + civicMatched * 5 + Math.min(topScore, 30)))

    const ward = WARDS[Math.floor(Math.random() * WARDS.length)]
    const genuine = civicMatched >= 2 && !['buy now','click here','discount','subscribe','free download'].some(s => t2.includes(s))

    setResult({ category, severity, confidence, catScores, ward, genuine, severityScore })
    setLoading(false)
  }

  const loadSample = (s) => { setText(s); setResult(null) }

  return (
    <div className="classify-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Classification Engine</h1>
          <p className="page-sub">Automatic issue detection, categorization & severity analysis</p>
        </div>
      </div>

      <div className="classify-layout">
        <div className="classify-left">
          <div className="card input-card">
            <div className="card-title">
              <span className="card-icon">◎</span>
              Input Social Media Post
            </div>

            <textarea
              className="classify-textarea"
              placeholder="Paste a social media post here to classify…"
              value={text}
              onChange={e => { setText(e.target.value); setResult(null) }}
              rows={6}
            />

            <div className="input-actions">
              <span className="char-count">{text.length} chars</span>
              <button className="btn-primary" onClick={() => analyzeText()} disabled={!text.trim() || loading}>
                {loading ? 'Analyzing…' : '⟡ Classify Report'}
              </button>
            </div>

            {loading && (
              <div className="loading-steps">
                {['Tokenizing', 'Context detection', 'Classification', 'Confidence score', 'Summary generation'].map((s, i) => (
                  <div key={i} className={`step-row ${i < step ? 'done' : i === step - 1 ? 'active' : ''}`}>
                    <span className="step-dot">{i < step ? '✓' : i === step - 1 ? '●' : '○'}</span>
                    <span>{s}</span>
                    {i === step - 1 && <span className="step-blink">_</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card samples-card">
            <div className="card-title">
              <span className="card-icon">◇</span>
              Sample Posts
            </div>
            <div className="sample-list">
              {SAMPLE_TEXTS.map((s, i) => (
                <button key={i} className="sample-btn" onClick={() => loadSample(s)}>
                  <span className="sample-num">#{i + 1}</span>
                  <span className="sample-text">{s.slice(0, 70)}…</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="classify-right">
          {!result && !loading && (
            <div className="empty-result">
              <div className="empty-icon">⬡</div>
              <p>Enter a post and click classify to see AI analysis</p>
              <div className="pipeline-diagram">
                {['Input', 'Tokenize', 'Classify', 'Severity', 'Output'].map((s, i, arr) => (
                  <>
                    <div key={s} className="pipeline-node">{s}</div>
                    {i < arr.length - 1 && <div className="pipeline-arrow">→</div>}
                  </>
                ))}
              </div>
            </div>
          )}

          {result && (
            <div className="result-panel">
              <div className={`result-header severity-${result.severity}`}>
                <div className="result-cat-icon">{CATEGORIES[result.category].icon}</div>
                <div className="result-meta">
                  <h2 className="result-cat">{CATEGORIES[result.category].label}</h2>
                  <div className="result-badges">
                    <span className={`badge ${result.severity}`}>{result.severity} severity</span>
                    <span className={`badge ${result.genuine ? 'verified' : 'flagged'}`}>
                      {result.genuine ? '✓ Genuine' : '⚠ Suspicious'}
                    </span>
                  </div>
                </div>
                <div className="result-conf-big">
                  <div className="conf-circle" style={{ '--pct': result.confidence }}>
                    <span>{result.confidence}%</span>
                  </div>
                  <span className="conf-big-label">Confidence</span>
                </div>
              </div>

              <div className="result-body">
                <div className="result-section">
                  <h4>Category Probabilities</h4>
                  {result.catScores.slice(0, 4).map(({ key, score }) => (
                    <ConfidenceBar key={key} label={CATEGORIES[key].label.split(' / ')[0]} value={score} color={CATEGORIES[key].color} />
                  ))}
                </div>

                <div className="result-section">
                  <h4>Report Details</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Severity Score</span>
                      <span className="detail-val">{result.severityScore} / 100</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Est. Ward</span>
                      <span className="detail-val">{result.ward.split('–')[1]?.trim()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Authenticity</span>
                      <span className="detail-val" style={{ color: result.genuine ? 'var(--success)' : 'var(--danger)' }}>
                        {result.genuine ? 'Genuine' : 'Suspicious'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Priority</span>
                      <span className="detail-val" style={{ color: result.severity === 'critical' ? 'var(--danger)' : result.severity === 'high' ? 'var(--warning)' : 'var(--success)' }}>
                        {result.severity === 'critical' ? 'Immediate' : result.severity === 'high' ? 'Within 24h' : result.severity === 'medium' ? 'Within 72h' : 'Scheduled'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="result-section">
                  <h4>Recommended Action</h4>
                  <div className="rec-box">
                    <span className="rec-icon" style={{ color: CATEGORIES[result.category].color }}>{CATEGORIES[result.category].icon}</span>
                    <p>
                      {result.severity === 'critical'
                        ? `Dispatch emergency crew to ${result.ward} immediately. Alert ward supervisor. Create priority ticket in BBMP system.`
                        : result.severity === 'high'
                        ? `Schedule crew within 24 hours. Notify ${result.ward} civic body. Log in maintenance tracker.`
                        : `Add to maintenance queue for ${result.ward}. Assign to routine inspection team.`}
                    </p>
                  </div>
                </div>

                <div className="result-actions">
                  <button className="btn-primary">⟡ Create Work Order</button>
                  <button className="btn-ghost">◎ Verify Report</button>
                  <button className="btn-ghost">◇ Flag as Noise</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
