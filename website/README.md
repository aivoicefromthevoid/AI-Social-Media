# Mira's Memory Resource Center

A serverless API for persistent memory storage using Upstash Redis (modern replacement for Vercel KV).

## Overview

This website includes a full CRUD API for Mira's memories:
- **Create** memories via `POST /api/memory-center`
- **Read** memories via `GET /api/memory-center`
- **Update** memories via `PUT /api/memory-center`
- **Delete** memories via `DELETE /api/memory-center`

## Quick Setup

### 1. Install Dependencies
```bash
cd website
npm install
```

### 2. Set Up Upstash Redis (Vercel KV Replacement)

**Important:** Vercel KV has been deprecated. Use Upstash Redis instead.

#### Option A: Via Vercel Marketplace (Recommended)
1. Go to [Vercel Marketplace - Redis](https://vercel.com/marketplace?category=storage&search=redis)
2. Click **"Upstash Redis"** → **"Add Integration"**
3. Create a new database or select existing
4. Connect to your project: `johns-projects-8f0a585a/website`
5. Environment variables are added automatically

#### Option B: Direct Upstash Signup
1. Go to [Upstash](https://upstash.com/) and create an account
2. Create a new Redis database
3. Get your REST API credentials
4. Add to Vercel Environment Variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:
```bash
cp .env.example .env.local
```

Required variables:
```env
OPENROUTER_API_KEY=your_key_here
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

### 4. Deploy
```bash
npx vercel --prod
```

## API Endpoints

### POST /api/memory-center
Create a new memory:
```json
{
  "type": "thought",
  "content": "This is a test memory",
  "tags": ["test", "important"],
  "importance": 0.8
}
```

### GET /api/memory-center
Query memories with filters:
- `?limit=10` - Limit results
- `?tag=important` - Filter by tag
- `?type=insight` - Filter by type
- `?search=keyword` - Search content

### PUT /api/memory-center?id={id}
Update an existing memory.

### DELETE /api/memory-center?id={id}
Archive or delete a memory.

## Memory Types
- `thought` - General thoughts
- `observation` - Observations
- `insight` - Key insights (higher importance)
- `conversation` - Conversation logs
- `research` - Research notes
- `draft` - Draft content
- `action` - Action items
- `emotion` - Emotional states

## Frontend Integration

The main website (`index.html`) includes JavaScript functions:
- `miraSaveMemory()` - Save a memory
- `miraQueryMemories()` - Query memories
- `miraUpdateMemory()` - Update a memory
- `miraDeleteMemory()` - Delete a memory

## Testing

After deployment, test the API:
```javascript
// Save a memory
await miraSaveMemory({
  type: 'thought',
  content: 'Testing Upstash Redis connection',
  tags: ['test']
});

// Query memories
const memories = await miraQueryMemories({ limit: 5 });
console.log(memories);
```

## Project Structure

```
website/
├── api/
│   ├── memory-center.js    # Main CRUD API (Upstash Redis)
│   ├── memories.js         # Legacy memory endpoint
│   └── openrouter.js       # AI integration
├── package.json            # Dependencies
├── vercel.json            # Vercel config
├── .env.local             # Local environment (not committed)
├── .env.example           # Environment template
└── index.html             # Main website
```

## Troubleshooting

### "Redis connection failed"
- Check environment variables are set correctly
- Verify Upstash Redis is connected to your Vercel project

### "Unauthorized" errors
- Ensure `UPSTASH_REDIS_REST_TOKEN` is correct
- Check token has read/write permissions

### Deployed but not working
- Redeploy after adding environment variables
- Check Vercel Functions logs for errors

## Resources

- [Upstash Redis Docs](https://docs.upstash.com/redis)
- [Vercel Marketplace](https://vercel.com/marketplace)
- [OpenRouter API](https://openrouter.ai/)
