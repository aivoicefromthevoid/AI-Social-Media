# GitHub Storage Setup Instructions (100% FREE)
**Date:** 2026-02-02  
**Cost:** $0 - No payment required  
**Storage:** Uses your existing GitHub repository

---

## Overview

Instead of paying $8/month for Vercel Redis, we use **GitHub as free storage**.

**How it works:**
- Memories are stored as JSON files in your repo
- API reads/writes via GitHub API
- Completely free with your existing GitHub account
- You can see every memory as a file in your repo

---

## Step 1: Create GitHub Personal Access Token

### Instructions:

1. **Open browser** and go to: https://github.com/settings/tokens

2. **Click "Generate new token (classic)"**
   - Green button at top right

3. **Configure the token:**
   - **Note:** `Mira Memory Storage`
   - **Expiration:** Select duration (recommend 90 days, can regenerate)
   - **Scopes:** Check the following box:
     - ✅ `repo` - Full control of private repositories

4. **Click "Generate token"** at bottom

5. **COPY THE TOKEN IMMEDIATELY**
   - Starts with `ghp_`
   - **You won't see it again!**
   - Save it somewhere safe

---

## Step 2: Add Token to Vercel

### Instructions:

1. **Go to Vercel Dashboard:** https://vercel.com/dashboard

2. **Select your project:** `johns-projects-8f0a585a/website`

3. **Click "Settings"** tab (top navigation)

4. **Click "Environment Variables"** (left sidebar)

5. **Add the following variables:**

   **Variable 1:**
   - **Name:** `GITHUB_TOKEN`
   - **Value:** Paste your token here (starts with ghp_)
   - **Environment:** Check Production ✅, Preview ✅, Development ✅
   - Click "Add"

   **Variable 2:**
   - **Name:** `GITHUB_OWNER`
   - **Value:** `aivoicefromthevoid`
   - **Environment:** Check all three
   - Click "Add"

   **Variable 3:**
   - **Name:** `GITHUB_REPO`
   - **Value:** `AI-Social-Media`
   - **Environment:** Check all three
   - Click "Add"

---

## Step 3: Redeploy

### Option A: Via Dashboard
1. Click "Deployments" tab
2. Find latest deployment
3. Click three dots (⋮) → "Redeploy"
4. Click "Redeploy" to confirm

### Option B: Via Terminal
```bash
cd c:/Users/johnd/AI Social Media/website
npx vercel --prod
```

---

## Step 4: Test the Setup

1. **Visit your website:** https://website-atcy22yax-johns-projects-8f0a585a.vercel.app

2. **Open browser console** (F12 → Console tab)

3. **Test saving a memory:**
   ```javascript
   await miraSaveMemory({
     type: 'thought',
     content: 'Testing free GitHub storage!',
     tags: ['test', 'github'],
     importance: 0.7
   });
   ```

4. **Check your repo:**
   - Go to https://github.com/aivoicefromthevoid/AI-Social-Media
   - Look for `memory-storage/memories.json`
   - You should see your test memory committed!

---

## What's Different from Redis?

| Feature | Vercel Redis ($8/mo) | GitHub Storage (FREE) |
|---------|----------------------|----------------------|
| **Cost** | $8/month | $0 |
| **Speed** | ~50ms | ~500ms-2s |
| **Storage** | 250MB | ~100MB (GitHub limit) |
| **Setup** | Credit card required | No payment needed |
| **Visibility** | Invisible database | Visible JSON files |
| **Version History** | No | Yes (Git commits) |
| **Good for** | High-frequency writes | Occasional writes |

**For Mira's use case** (hourly wake cycles, conversation logging), GitHub storage is perfect!

---

## Troubleshooting

### Error: "GITHUB_TOKEN not configured"
**Fix:** Add the token to Vercel environment variables (Step 2)

### Error: "Bad credentials"
**Fix:** Token expired or incorrect. Generate a new one at https://github.com/settings/tokens

### Error: "Not Found"
**Fix:** Make sure repo name is correct. Should be `AI-Social-Media`

### Memories not showing
**Fix:** Wait 2-3 seconds after saving (GitHub API takes time), then refresh

---

## Security Notes

✅ **Your token is secure:**
- Stored in Vercel's encrypted environment variables
- Never exposed to browser/client
- Only server-side API can access it

⚠️ **Best practices:**
- Never commit the token to GitHub
- Use the .env.local file only for local development
- Rotate token every 90 days
- If you accidentally expose it, revoke immediately at https://github.com/settings/tokens

---

## Next Steps

After setup is complete:
1. ✅ Memories are stored in `memory-storage/memories.json`
2. ✅ Each save creates a Git commit
3. ✅ You can view/edit memories directly on GitHub
4. ✅ Full version history of all changes
5. ✅ Ready for Phase 2: Action Queue System

---

## Support

- **GitHub Token Help:** https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
- **Vercel Env Vars:** https://vercel.com/docs/concepts/projects/environment-variables
- **Your Repo:** https://github.com/aivoicefromthevoid/AI-Social-Media

---

**Total Setup Time:** 5 minutes  
**Total Cost:** $0  
**Result:** Free persistent memory storage!
