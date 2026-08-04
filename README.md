# UrbanIntel — Real-Time Municipal Issue Detection System

A full-stack React + Node.js application that monitors Twitter/X and Reddit
for civic complaints (potholes, garbage, water issues etc.) in Bengaluru,
automatically classifies them with AI-style NLP, and surfaces them to
municipal authorities for action.

---

## Project Structure

```
urban-intel/
├── server/              ← Node.js + Express backend
│   ├── index.js         ← Main server (Twitter + Reddit APIs)
│   ├── .env             ← Your API keys go here
│   └── package.json
│
└── src/                 ← React + Vite frontend
    ├── hooks/
    │   └── useFeed.js   ← Polls backend every 60s
    ├── pages/
    │   ├── Dashboard.jsx
    │   ├── LiveFeed.jsx  ← Shows real Twitter + Reddit posts
    │   ├── Classify.jsx  ← AI classification engine
    │   ├── Verify.jsx    ← Authenticity verification
    │   ├── Analytics.jsx ← Charts and insights
    │   └── Admin.jsx     ← System configuration
    └── data/mockData.js  ← Fallback demo data
```

---

## Quick Start (2 terminals)

### Terminal 1 — Start the Backend

```bash
cd server
npm install
npm run dev
```

You should see:
```
╔═══════════════════════════════════════╗
║      UrbanIntel Backend v1.0          ║
║      Running on port 3001             ║
╚═══════════════════════════════════════╝

⚠️  Twitter: NOT configured (add TWITTER_BEARER_TOKEN to .env)
✅ Reddit:  Ready (no auth needed)
```

Reddit works immediately with no setup!

### Terminal 2 — Start the Frontend

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Setting Up Twitter/X (Optional but Recommended)

1. Go to https://developer.twitter.com
2. Sign in with your Twitter account
3. Click "Sign up for Free Account"
4. Create a new Project + App
5. Go to your App → "Keys and Tokens"
6. Copy the **Bearer Token**
7. Open `server/.env` and replace:
   ```
   TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
   ```
   with your actual token:
   ```
   TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAxxxxx...
   ```
8. Restart the backend server

**Free tier limits:**
- 500,000 tweets/month read
- 1 app
- Search recent tweets (last 7 days)
- This is more than enough for a civic monitoring system!

---

## Reddit (No Setup Required)

Reddit's public API works without any authentication.
The backend fetches from these subreddits by default:
- r/bangalore
- r/bengaluru
- r/india

Posts are filtered by civic keywords automatically.

To add more subreddits, edit `server/.env`:
```
REDDIT_SUBREDDITS=bangalore,bengaluru,india,mumbai,delhi
```

---

## Customizing Keywords

Edit `server/.env`:

```env
# Twitter search keywords (comma-separated)
TWITTER_KEYWORDS=pothole bangalore,BBMP garbage,water supply bangalore,sewage bangalore,street light bangalore

# Reddit keywords filter
REDDIT_KEYWORDS=pothole,garbage,BBMP,water supply,sewage,road damage,civic,street light
```

---

## How the Auto-Classification Works

The backend's NLP engine (`classifyText()` in server/index.js):

1. **Category Detection** — matches keywords to issue types:
   - "pothole", "road damage" → POTHOLE
   - "garbage", "waste", "BBMP" → GARBAGE
   - "water supply", "BWSSB" → WATER
   - etc.

2. **Severity Scoring** — keyword-based:
   - "urgent", "emergency", "dangerous" → Critical
   - "serious", "hazard", "weeks" → High
   - "please fix", "request" → Medium
   - No urgent keywords → Low

3. **Confidence Score** — based on how many civic keywords are present
   - More civic keywords = higher confidence (45–95%)

4. **Genuineness Check** — basic spam detection
   - Requires at least 2 civic keywords
   - Filters out "buy now", "click here" etc.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/status | Server health + config info |
| GET | /api/feed | Combined Twitter + Reddit posts |
| GET | /api/twitter | Twitter posts only |
| GET | /api/reddit | Reddit posts only |
| GET | /api/feed?refresh=true | Force fresh fetch (bypasses cache) |
| POST | /api/classify | Classify any text `{"text": "..."}` |

### Example: Test classification

```bash
curl -X POST http://localhost:3001/api/classify \
  -H "Content-Type: application/json" \
  -d '{"text": "There is a huge pothole near Koramangala junction. Very dangerous!"}'
```

Response:
```json
{
  "success": true,
  "category": "POTHOLE",
  "severity": "high",
  "confidence": 85,
  "genuine": true,
  "ward": "Koramangala"
}
```

---

## Deploying to Production

### Backend → Railway / Render (Free)

1. Push `server/` folder to GitHub
2. Go to https://railway.app or https://render.com
3. Create new service → connect GitHub repo
4. Set environment variable: `TWITTER_BEARER_TOKEN=your_token`
5. Deploy → get a URL like `https://urban-intel.railway.app`

### Frontend → Vercel (Free)

1. Create `.env` in project root:
   ```
   VITE_API_URL=https://urban-intel.railway.app
   ```
2. Push to GitHub
3. Import to https://vercel.com
4. Deploy

---

## Cache Behavior

The backend caches API responses for **60 seconds** to avoid hitting rate limits.
- Twitter free tier: ~450 requests/15 min window
- Reddit: No strict limit, but we add a 300ms delay between subreddit requests
- The frontend polls every 60 seconds automatically

---

## Troubleshooting

**Reddit returns 0 posts?**
- Check internet connection on backend server
- Try: `curl https://www.reddit.com/r/bangalore/new.json`
- Reddit occasionally blocks certain IPs temporarily

**Twitter returns error 401?**
- Your Bearer Token is wrong or expired
- Generate a new one at developer.twitter.com

**Twitter returns error 403?**
- Your app doesn't have the right permissions
- Go to App Settings → User authentication settings → enable Read permissions

**Frontend shows "Backend offline"?**
- Make sure backend is running: `cd server && npm run dev`
- Check it's on port 3001: visit http://localhost:3001/api/status
- Check no firewall is blocking port 3001
