// ─────────────────────────────────────────────
//  Persistent storage
//
//  Render's free tier has an EPHEMERAL disk: every restart, redeploy or
//  spin-down (after ~15 min idle) wipes users.csv, complaints.csv and
//  messages.json. When MONGODB_URI is set, users, citizen complaints and
//  chat messages are also stored in MongoDB (e.g. a free MongoDB Atlas
//  cluster) so they survive restarts. Without MONGODB_URI the server keeps
//  working with local files only (fine for local development).
// ─────────────────────────────────────────────
import { MongoClient } from 'mongodb'

let db = null
let writeChain = Promise.resolve()

export function storeEnabled() {
  return db !== null
}

export async function initStore() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.log('⚠️  Storage: MONGODB_URI not set — using local files only (data is lost on Render restarts)')
    return false
  }
  try {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 })
    await client.connect()
    db = client.db(process.env.MONGODB_DB || 'urbanintel')
    console.log('✅ Storage: connected to MongoDB')
    return true
  } catch (err) {
    console.error('❌ Storage: MongoDB connection failed, falling back to local files:', err.message)
    db = null
    return false
  }
}

// Load every document of a collection as plain objects (without Mongo's _id)
export async function loadCollection(name) {
  if (!db) return null
  const docs = await db.collection(name).find({}).toArray()
  return docs.map(({ _id, ...rest }) => rest)
}

// Make the collection mirror `items` exactly (upsert all, delete the rest).
// Writes are queued so concurrent saves never interleave.
export function syncCollection(name, items, keyOf = item => item.id) {
  if (!db) return
  const snapshot = items.map(item => ({ key: String(keyOf(item)), doc: { ...item } }))
  writeChain = writeChain
    .then(async () => {
      const col = db.collection(name)
      const keys = snapshot.map(s => s.key)
      if (snapshot.length > 0) {
        await col.bulkWrite(
          snapshot.map(({ key, doc }) => ({
            replaceOne: { filter: { _id: key }, replacement: { _id: key, ...doc }, upsert: true }
          })),
          { ordered: false }
        )
      }
      await col.deleteMany({ _id: { $nin: keys } })
    })
    .catch(err => console.error(`[Store] Failed to save ${name}:`, err.message))
}

// Messages are stored as one document per complaint: { complaintId, messages: [...] }
export async function loadMessages() {
  const rows = await loadCollection('messages')
  if (!rows) return null
  const out = {}
  for (const r of rows) out[r.complaintId] = r.messages || []
  return out
}

export function syncMessages(messagesByComplaint) {
  const items = Object.entries(messagesByComplaint).map(([complaintId, messages]) => ({ complaintId, messages }))
  syncCollection('messages', items, m => m.complaintId)
}
