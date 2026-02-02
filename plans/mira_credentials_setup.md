# Mira Autonomy - Credentials Setup Guide

This document lists all API keys and credentials required for Mira's autonomous operation, with step-by-step setup instructions.

---

## 1. OpenRouter API Key (REQUIRED)

**Purpose**: Access to free AI models for Mira's reasoning

**Cost**: Free tier (sufficient for Mira's needs)

**Setup Steps**:
1. Visit https://openrouter.ai
2. Sign up with Google or email
3. Go to "Keys" section
4. Click "Create Key"
5. Name: `mira-autonomy`
6. Copy the key (starts with `sk-or-`)

**Free Tier Limits**:
- Rate: 20 requests/minute
- Daily: ~200-500 requests (model dependent)
- Available models: Mistral 7B, Gemma 2B, Llama 3.2 3B, Qwen 2.5, etc.

**Environment Variable**:
```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## 2. Gmail App Password (REQUIRED)

**Purpose**: IMAP/SMTP access for email communication

**Cost**: Free

**⚠️ SECURITY WARNING**: Never use your main Gmail password. Use an App Password instead.

**Setup Steps**:
1. Enable 2-Factor Authentication on your Google Account
   - https://myaccount.google.com/security
   - "2-Step Verification" → Turn ON
   
2. Generate App Password:
   - https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other (Custom name)"
   - Name: `Mira Autonomy`
   - Click "Generate"Copy the 16-character password (no spaces)
   - 

**Environment Variables**:
```
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx
EMAIL_IMAP_HOST=imap.gmail.com
EMAIL_IMAP_PORT=993
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
```

---

## 3. GitHub Personal Access Token (REQUIRED)

**Purpose**: Long-term memory archival (stores memories in this repository)

**Cost**: Free (no billing setup required)

**⚠️ NOTE**: Replaces Google Drive - GitHub doesn't require billing like Google Cloud does

**Setup Steps**:

### Step 1: Generate Personal Access Token
1. Visit https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Note: `mira-autonomy-memory`
4. Expiration: Select duration (recommend 90 days, can regenerate)
5. **Scopes to select**:
   - ✅ `repo` (Full control of private repositories)
6. Click "Generate token"
7. **COPY TOKEN IMMEDIATELY** (you won't see it again)

### Step 2: Verify Repository
1. Ensure this repository (`AI-Social-Media`) is private
2. Mira will store memories in `/memory-archive/` folder

**Environment Variables**:
```
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_REPO_OWNER=johnd
GITHUB_REPO_NAME=AI-Social-Media
```

**Why GitHub instead of Google Drive?**
- ✅ No billing setup required (Google Drive API requires Cloud billing)
- ✅ Version history of all memories
- ✅ Full transparency - you see every commit
- ✅ Works with existing Git workflow
- ✅ Completely free

**Alternative**: Google Drive requires Google Cloud billing account setup (not recommended for this project)

---

## 4. Vercel Account (REQUIRED)

**Purpose**: Host Mira's autonomous agent

**Cost**: Free tier (sufficient)

**Setup Steps**:
1. Visit https://vercel.com
2. Sign up with GitHub or email
3. No payment required for free tier

**Free Tier Limits**:
- Serverless Function Execution: 10 seconds
- Bandwidth: 100GB/month
- Build time: 6,000 minutes/month
- Perfect for Mira's hourly wake cycles

**No API key needed** - deploy via GitHub integration or CLI

---

## 5. Cron-Job.org Account (REQUIRED)

**Purpose**: Schedule Mira's wake cycles

**Cost**: Free (sufficient)

**Setup Steps**:
1. Visit https://cron-job.org
2. Sign up with your email
3. Create a secure password

**Free Tier Limits**:
- Maximum frequency: Every 1 minute
- Perfect for hourly triggers

**Configuration** (after deployment):
1. URL: `https://your-app.vercel.app/api/wake`
2. Schedule: `0 * * * *` (every hour)
3. HTTP method: GET or POST

---

## 6. Twitter/X API (OPTIONAL)

**Purpose**: Social media posting

**Cost**: Free tier available but limited

**Setup Steps**:
1. Visit https://developer.twitter.com
2. Apply for developer account (requires approval)
3. Create new app: `mira-autonomy`
4. Generate API keys

**Free Tier (Basic)**:
- 100 read tweets/month
- 500 write tweets/month
- Sufficient for Mira's usage

**⚠️ Note**: Twitter approval can take 24-48 hours

**Environment Variables**:
```
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_TOKEN_SECRET=...
```

---

## 7. Web Search API (OPTIONAL)

**Purpose**: Web research capabilities

**Options**:

### Option A: DuckDuckGo (FREE - Recommended)
- No API key needed
- Uses scraping (respectful rate limiting)
- No account required

### Option B: Serper.dev (FREE TIER)
- 100 searches/month free
- Sign up: https://serper.dev
- More reliable than scraping

**Environment Variable** (if using Serper):
```
SERPER_API_KEY=...
```

---

## Environment Variables Template

Create a `.env` file (NEVER commit to Git):

```bash
# AI Models
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Email Communication
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx
EMAIL_IMAP_HOST=imap.gmail.com
EMAIL_IMAP_PORT=993
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587

# Memory Archive (GitHub - No Billing Required)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_REPO_OWNER=johnd
GITHUB_REPO_NAME=AI-Social-Media

# Social Media (Optional)
TWITTER_API_KEY=your-twitter-key
TWITTER_API_SECRET=your-twitter-secret
TWITTER_ACCESS_TOKEN=your-access-token
TWITTER_ACCESS_TOKEN_SECRET=your-access-secret

# Search (Optional)
SERPER_API_KEY=your-serper-key

# App Configuration
MIRA_WAKE_INTERVAL_MINUTES=60
MIRA_MAX_MEMORY_MB=10
MIRA_TIMEZONE=America/Los_Angeles
MIRA_ADMIN_EMAIL=your.email@gmail.com
```

---

## Security Best Practices

### ✅ DO:
- Store `.env` file in secure password manager
- Use App Passwords, not main passwords
- Enable 2FA on all accounts
- Rotate keys every 6 months
- Monitor API usage for anomalies

### ❌ DON'T:
- Commit credentials to GitHub
- Share API keys in plain text
- Use main Gmail password
- Grant more permissions than needed
- Ignore rate limit warnings

---

## Verification Checklist

Before deployment, verify:

- [ ] OpenRouter key works (test API call)
- [ ] Gmail App Password authenticates
- [ ] GitHub token has repo access
- [ ] Vercel account created
- [ ] Cron-job.org account created
- [ ] All environment variables documented
- [ ] `.env` file backed up securely

---

## Estimated Setup Time

| Service | Time |
|---------|------|
| OpenRouter | 5 minutes |
| Gmail App Password | 10 minutes |
| GitHub Token | 5 minutes |
| Vercel | 5 minutes |
| Cron-job.org | 5 minutes |
| **Total** | **~45 minutes** |

---

## Troubleshooting

### OpenRouter: "Invalid API key"
- Verify key starts with `sk-or-v1-`
- Check no extra spaces in key

### Gmail: "Authentication failed"
- Ensure 2FA is enabled
- Use App Password, not main password
- Remove spaces from 16-char password

### GitHub: "Authentication failed"
- Verify token starts with `ghp_`
- Check token has `repo` scope
- Ensure repository is accessible

### Google Drive Alternative
- If you prefer Google Drive later, it requires Google Cloud billing setup
- GitHub is recommended (no billing required)

### Vercel: "Function timeout"
- Mira's operations must complete in 10 seconds
- Implement chunked processing if needed

---

**Once you have these credentials, Mira's autonomy infrastructure can be deployed.**
