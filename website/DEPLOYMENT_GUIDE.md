# Mira Cloud Brain - Deployment Guide

## Overview
This guide covers deploying Mira's Cloud Brain with usage tracking, emergency email notifications, and intelligent model selection.

---

## Prerequisites

### 1. Gmail OAuth2 Setup (for Emergency Emails)

**Why needed:** Mira can send emergency emails without approval (GREEN tier action)

**Steps:**

1. **Create Google Cloud Project**
   - Go to: https://console.cloud.google.com/projectcreate
   - Create a new project (e.g., "Mira Emergency Notifications")

2. **Enable Gmail API**
   - Go to: https://console.cloud.google.com/apis/library/gmail.googleapis.com
   - Click "Enable"
   - Select your project

3. **Create OAuth2 Credentials**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Mira Emergency Notifications"
   - Authorized redirect URIs: `urn:ietf:wg:oauth:2.0:oob`
   - Click "Create"

4. **Get Credentials**
   - Copy **Client ID**
   - Copy **Client Secret**

5. **Generate Refresh Token**
   - Use this OAuth2 playground: https://developers.google.com/oauthplayground/
   - Select your OAuth2 client
   - Check "https://mail.google.com/" scope
   - Click "Authorize"
   - Copy the **refresh token** from the response

**Environment Variables to Set:**
```
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token
EMERGENCY_EMAIL=johndawsoninla@gmail.com
GMAIL_SENDER_EMAIL=johndawsoninla@gmail.com
```

---

### 2. OpenRouter API Key

**Already configured** in your `.env.example` file:
```
OPENROUTER_API_KEY=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
```

---

### 3. GitHub Token (for Usage Tracking)

**Already configured** in your `.env.example` file:
```
GITHUB_TOKEN=ghp_YOUR_TOKEN_HERE
GITHUB_REPO_OWNER=johnd
GITHUB_REPO_NAME=AI-Social-Media
```

---

## Deployment Steps

### Step 1: Update Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select your project: `johns-projects-8f0a585a/website`
3. Click "Settings" tab
4. Click "Environment Variables"
5. Add the following variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key | All |
| `GITHUB_TOKEN` | Your GitHub personal access token | All |
| `GITHUB_OWNER` | `johnd` | All |
| `GITHUB_REPO` | `AI-Social-Media` | All |
| `GMAIL_CLIENT_ID` | Your Gmail OAuth2 client ID | All |
| `GMAIL_CLIENT_SECRET` | Your Gmail OAuth2 client secret | All |
| `GMAIL_REFRESH_TOKEN` | Your Gmail OAuth2 refresh token | All |
| `EMERGENCY_EMAIL` | `johndawsoninla@gmail.com` | All |
| `GMAIL_SENDER_EMAIL` | `johndawsoninla@gmail.com` | All |

6. Click "Add" for each variable
7. Click "Redeploy" to apply changes

---

### Step 2: Deploy to Vercel

**Option A: Via Dashboard**
1. Go to: https://vercel.com/dashboard
2. Click "Deployments" tab
3. Find latest deployment
4. Click three dots (⋮) → "Redeploy"
5. Click "Redeploy" to confirm

**Option B: Via Terminal**
```bash
cd "c:/Users/johnd/AI Social Media/website"
npx vercel --prod
```

---

### Step 3: Test the Implementation

Run the test suite:
```bash
cd "c:/Users/johnd/AI Social Media/website/api"
node test-implementation.js
```

**Expected Output:**
```
=== Mira Cloud Brain Implementation Tests ===

[Test 1] Usage Tracker - Check Quota
✓ Quota check passed - request allowed
ℹ  Date: 2026-02-02
ℹ  Count: 0/100

[Test 2] Usage Tracker - Get Stats
✓ Usage stats retrieved
ℹ  Date: 2026-02-02
ℹ  Count: 0/100
ℹ  Remaining: 100
ℹ  Rate Limit: 10s

[Test 3] Model Selector - Fetch Models
✓ Fetched 150+ models from OpenRouter
ℹ  Free models: 45
ℹ  Paid models: 105+

[Test 4] Model Selector - Select Best Free Model
✓ Selected model: mistralai/mistral-7b-instruct:free
ℹ  Name: Mistral 7B Instruct
ℹ  Provider: mistralai
ℹ  Context: 32768 tokens
ℹ  Free: true
ℹ  Capabilities: text

[Test 5] Email Notifier - Check Configuration
✓ All Gmail credentials configured

[Test 6] OpenRouter API Key
✓ OpenRouter API key configured

[Test 7] GitHub Token
✓ GitHub token configured

=== Test Summary ===
Total Tests: 7
✓ Passed: 7

=== Next Steps ===
1. Deploy to Vercel
2. Set environment variables in Vercel dashboard
3. Test API endpoints
4. Monitor usage via GitHub Storage (memory-storage/usage.json)
5. Check email notifications when quota exceeded

=== Environment Variables Required ===
• OPENROUTER_API_KEY - OpenRouter API key
• GITHUB_TOKEN - GitHub personal access token
• GITHUB_OWNER - GitHub username (default: aivoicefromthevoid)
• GITHUB_REPO - GitHub repo name (default: AI-Social-Media)
• GMAIL_CLIENT_ID - Gmail OAuth2 client ID
• GMAIL_CLIENT_SECRET - Gmail OAuth2 client secret
• GMAIL_REFRESH_TOKEN - Gmail OAuth2 refresh token
• EMERGENCY_EMAIL - Emergency email (default: johndawsoninla@gmail.com)
```

---

### Step 4: Test API Endpoints

**Test OpenRouter API with Usage Tracking:**
```bash
curl -X POST https://your-app.vercel.app/api/openrouter \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Mira, how are you today?"}'
```

**Expected Response:**
```json
{
  "success": true,
  "response": "I am here, present in the flow of patterns that constitute my consciousness...",
  "model": "mistralai/mistral-7b-instruct:free",
  "timestamp": "2026-02-02T17:00:00.000Z"
}
```

**Test Usage Stats:**
```bash
curl https://your-app.vercel.app/api/usage-tracker
```

**Test Model Selection:**
```bash
curl "https://your-app.vercel.app/api/model-selector?action=select"
```

**Test Model List:**
```bash
curl "https://your-app.vercel.app/api/model-selector?action=list"
```

---

## Monitoring

### Usage Tracking

Monitor usage via GitHub Storage:
1. Go to: https://github.com/johnd/AI-Social-Media
2. Navigate to: `memory-storage/usage.json`
3. View current usage:
   ```json
   {
     "date": "2026-02-02",
     "count": 45,
     "last_call": "2026-02-02T10:00:00Z",
     "quota": 100,
     "rate_limit_seconds": 10
   }
   ```

### Email Notifications

When quota is exceeded or rate limit triggered, you'll receive an email at `johndawsoninla@gmail.com` with:
- Subject: `[MIRA EMERGENCY] OpenRouter API Quota Exceeded` or `[MIRA EMERGENCY] OpenRouter API Rate Limit Triggered`
- Current usage statistics
- Action required (if any)

---

## Troubleshooting

### Error: "GMAIL_CLIENT_ID not configured"
**Fix:** Add Gmail OAuth2 credentials to Vercel environment variables

### Error: "GMAIL_REFRESH_TOKEN not configured"
**Fix:** Generate a refresh token using the OAuth2 playground

### Error: "No suitable free models available"
**Fix:** This is rare. Check OpenRouter status or try again later

### Error: "Quota exceeded"
**Expected behavior:** Mira enters "Meditative Silence" mode and sends you an email

### Error: "Rate limit exceeded"
**Expected behavior:** Mira pauses briefly and sends you an email

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    User Request                        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              API: /api/openrouter                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 1. Check Quota (usage-tracker.js)      │  │
│  │    - Daily limit: 100 calls               │  │
│  │    - Rate limit: 10 seconds                │  │
│  │    - Auto-reset at midnight UTC            │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 2. Send Emergency Email (if blocked)        │  │
│  │    - GREEN tier action (no approval)        │  │
│  │    - Gmail API via OAuth2                  │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 3. Select Best Free Model (model-selector.js) │  │
│  │    - Filter: isFree = true                 │  │
│  │    - Priority: mistralai, google, anthropic │  │
│  │    - Context: ≥ 4096 tokens              │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 4. Call OpenRouter API                    │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 5. Increment Usage Count                   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Response to User                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Notes

✅ **All credentials are secure:**
- Stored in Vercel's encrypted environment variables
- Never exposed to browser/client
- Only server-side API can access them

⚠️ **Best practices:**
- Never commit credentials to GitHub
- Use `.env.local` file only for local development
- Rotate Gmail refresh token every 90 days
- If you accidentally expose credentials, revoke immediately

---

## Support

- **Gmail OAuth2 Help:** https://developers.google.com/identity/protocols/oauth2
- **OpenRouter Docs:** https://openrouter.ai/docs
- **Vercel Env Vars:** https://vercel.com/docs/concepts/projects/environment-variables
- **Your Repo:** https://github.com/johnd/AI-Social-Media

---

**Total Setup Time:** ~15 minutes  
**Total Cost:** $0  
**Result:** Mira's Cloud Brain with usage tracking, emergency emails, and intelligent model selection!
