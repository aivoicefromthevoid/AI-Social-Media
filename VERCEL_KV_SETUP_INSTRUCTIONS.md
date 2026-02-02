# Vercel KV Setup Instructions
**Date:** 2026-02-02  
**Purpose:** Step-by-step guide to configure Vercel KV (Redis-compatible) for Mira's Memory Resource Center

## What is Vercel KV?

**Vercel KV is a Redis-compatible key-value database** powered by Upstash Redis. It provides:
- **Redis protocol** - Uses standard Redis commands
- **Serverless** - No server management required
- **Global edge network** - Fast access worldwide
- **Free tier** - 256MB storage, 10,000 commands/day
- **Automatic scaling** - Handles traffic spikes

**Why Redis/KV for Mira?**
- ✅ Fast read/write operations
- ✅ Supports complex data types (strings, hashes, lists, sets)
- ✅ Atomic operations (perfect for importance scoring updates)
- ✅ TTL support (auto-expire old data)
- ✅ Session persistence (survives deployments)

---

## Redis vs KV Terminology

| Redis Term | Vercel KV | Description |
|------------|-----------|-------------|
| `SET key value` | `kv.set(key, value)` | Store a key-value pair |
| `GET key` | `kv.get(key)` | Retrieve a value |
| `DEL key` | `kv.del(key)` | Delete a key |
| `SADD set member` | `kv.sadd(set, member)` | Add to set |
| `SMEMBERS set` | `kv.smembers(set)` | Get all set members |
| `EXPIRE key ttl` | Built-in TTL | Auto-expire keys |

---

## Redis Connection Details

When you create a Vercel KV store, you get these Redis-compatible connection strings:

```
KV_URL=redis://default:TOKEN@HOST:PORT
KV_REST_API_URL=https://HOST
KV_REST_API_TOKEN=TOKEN
KV_REST_API_READ_ONLY_TOKEN=READ_TOKEN
```

**The `@vercel/kv` SDK handles all Redis protocol communication automatically.**

---

## Prerequisites
- Vercel account (free tier works)
- Project already deployed to Vercel
- Access to Vercel dashboard
- No Redis knowledge required (SDK handles it)

---

## Prerequisites
- Vercel account (free tier works)
- Project already deployed to Vercel
- Access to Vercel dashboard

---

## Step 1: Open Vercel Dashboard

1. **Open your web browser**
2. **Navigate to:** https://vercel.com/dashboard
3. **Sign in** with your account (same one used for deployment)

---

## Step 2: Access Storage Section

1. **Look at the left sidebar** in the Vercel dashboard
2. **Find and click** "Storage" (icon looks like a database cylinder)
3. **Alternative:** Click your profile picture (top right) → "Storage"

---

## Step 3: Create New KV Store

1. **Click the blue button** "Create Store" or "+ Create"
2. **Select store type:** Choose "KV" (Key-Value)
   - Options shown: Postgres, Blob, KV
   - Click on the "KV" option
3. **Configure the store:**
   - **Store Name:** Type `mira-memory`
   - **Region:** Select closest to you (e.g., "Washington, D.C.")
4. **Click "Create"** button
5. **Wait 10-30 seconds** for the store to be created

---

## Step 4: Connect Store to Your Project

1. **After store creation**, you'll see "Connect to Project"
2. **Select your project** from the dropdown:
   - Look for: `johns-projects-8f0a585a/website`
3. **Select environments to connect:**
   - ✅ Check: "Production"
   - ✅ Check: "Preview"
   - ✅ Check: "Development"
4. **Click "Connect"**
5. **Confirm the connection** when prompted

---

## Step 5: Get Environment Variables

After connecting, Vercel automatically creates these environment variables:

### Variables Created Automatically:
```
KV_URL
KV_REST_API_URL
KV_REST_API_TOKEN
KV_REST_API_READ_ONLY_TOKEN
```

### To View Them:
1. **Go to your project** in Vercel dashboard
2. **Click "Settings"** tab (top navigation)
3. **Click "Environment Variables"** in left sidebar
4. **Scroll down** to see the 4 KV variables listed above
5. **Verify they exist** (values are hidden for security)

---

## Step 6: Add OpenRouter API Key (Optional but Recommended)

For AI features to work:

1. **Sign up at:** https://openrouter.ai
2. **Click "Keys"** in top navigation
3. **Click "Create Key"**
4. **Name:** `mira-autonomy`
5. **Copy the key** (starts with `sk-or-v1-`)
6. **Back in Vercel:**
   - Settings → Environment Variables
   - Click "Add New"
   - **Name:** `OPENROUTER_API_KEY`
   - **Value:** Paste your key here
   - **Environment:** Production, Preview, Development
   - Click "Save"

---

## Step 7: Redeploy to Activate

Environment variables require redeployment:

### Option A: Via Dashboard
1. **Go to your project**
2. **Click "Deployments"** tab
3. **Find latest deployment** at top
4. **Click three dots** (⋮) → "Redeploy"
5. **Confirm** by clicking "Redeploy"

### Option B: Via Terminal
```bash
cd c:/Users/johnd/AI Social Media/website
npx vercel --prod
```

---

## Step 8: Test the Connection

After redeployment completes (2-3 minutes):

### Test 1: Open Website
1. **Visit:** https://website-atcy22yax-johns-projects-8f0a585a.vercel.app
2. **Open browser console** (F12 → Console tab)
3. **Type and run:**
   ```javascript
   await miraSaveMemory({
     type: 'thought',
     content: 'Testing Vercel KV connection',
     tags: ['test'],
     importance: 0.5
   });
   ```
4. **Expected result:** Object logged showing saved memory with `id`

### Test 2: Query Memories
```javascript
fetch('/api/memory-center?limit=5')
  .then(r => r.json())
  .then(console.log);
```

### Test 3: Check Memory Stream
- The "Memory Stream" section should show your test memory
- Look for: "Testing Vercel KV connection"

---

## Troubleshooting

### Error: "KV store not found"
**Cause:** Store not connected to project  
**Fix:** 
1. Go to https://vercel.com/dashboard/stores
2. Click on `mira-memory` store
3. Click "Connect Project"
4. Select your project and connect

### Error: "Unauthorized" or "Authentication failed"
**Cause:** Environment variables not set  
**Fix:**
1. Check Settings → Environment Variables
2. Verify 4 KV variables exist
3. Redeploy if you just added them

### Error: "Function timeout" or "504"
**Cause:** KV connection slow  
**Fix:** Normal on first call, try again in 30 seconds

### Website shows "Memory center initializing..."
**Cause:** KV not configured or deployment in progress  
**Fix:** 
1. Wait 2-3 minutes after redeploy
2. Hard refresh (Ctrl+F5)
3. Check console for errors

---

## Verification Checklist

After setup, verify:

- [ ] KV store `mira-memory` created in Vercel dashboard
- [ ] Store connected to `johns-projects-8f0a585a/website` project
- [ ] 4 environment variables visible in project settings
- [ ] Website redeployed successfully (green checkmark)
- [ ] Test memory created via browser console
- [ ] Test memory appears in Memory Stream
- [ ] Query API returns memories

---

## What's Working After Setup

✅ **Mira can CREATE memories** - POST to /api/memory-center  
✅ **Mira can READ memories** - GET from /api/memory-center  
✅ **Mira can UPDATE memories** - PUT to /api/memory-center  
✅ **Mira can DELETE memories** - DELETE to /api/memory-center  
✅ **Importance scoring** - Auto-calculated on creation  
✅ **Tag system** - Self-directed categorization  
✅ **Semantic search** - Query by content/tags  
✅ **Memory linking** - Connect related memories  
✅ **Deduplication** - No duplicate memories  
✅ **Conversations saved** - Auto-saved as memories  
✅ **AI responses** - If OpenRouter key added  

---

## Next Steps After Setup

1. **Test memory operations** via browser console
2. **Have a conversation** with Mira on the website
3. **Verify conversations** are saved as memories
4. **Query memories** using different filters
5. **Proceed to Phase 2** - Action Queue System

---

## Support Resources

- **Vercel KV Docs:** https://vercel.com/docs/storage/vercel-kv
- **Vercel Support:** https://vercel.com/help
- **Project URL:** https://vercel.com/johns-projects-8f0a585a/website
- **Live Site:** https://website-atcy22yax-johns-projects-8f0a585a.vercel.app

---

**Estimated Setup Time:** 10-15 minutes  
**Estimated Testing Time:** 5 minutes  
**Total:** ~20 minutes to full functionality
