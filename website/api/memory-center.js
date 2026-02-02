// Mira's Memory Resource Center - Full CRUD API
// Uses GitHub Storage (FREE) - stores memories as JSON in your repo
// No payment required - completely free alternative to Vercel KV/Redis

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { GitHubStorage } = require('./github-storage');

// Initialize GitHub Storage
let storage;
function getStorage() {
  if (!storage) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN not configured. Get free token at https://github.com/settings/tokens');
    }
    storage = new GitHubStorage(token);
  }
  return storage;
}

// Request size limit (1MB)
const MAX_REQUEST_SIZE = 1024 * 1024;

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check request size for write operations
  if (['POST', 'PUT'].includes(req.method)) {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > MAX_REQUEST_SIZE) {
      return res.status(413).json({ error: 'Request too large' });
    }
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handleCreate(req, res);
      case 'PUT':
        return await handleUpdate(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Memory Center Error:', error);
    
    // Provide more specific error messages
    let statusCode = 500;
    let errorMessage = error.message;
    let hint = 'Ensure GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO are configured in environment variables';
    
    if (error.name === 'AbortError') {
      statusCode = 504;
      errorMessage = 'Request timeout - GitHub API took too long to respond';
      hint = 'GitHub API may be slow or unavailable. Try again later.';
    } else if (error.message.includes('authentication failed')) {
      statusCode = 401;
      hint = 'Your GITHUB_TOKEN may be invalid or expired. Generate a new one at https://github.com/settings/tokens';
    } else if (error.message.includes('not found')) {
      statusCode = 404;
      hint = 'Check that GITHUB_OWNER and GITHUB_REPO match your actual GitHub username and repository name';
    }
    
    return res.status(statusCode).json({ 
      error: 'Internal server error',
      message: errorMessage,
      hint: hint
    });
  }
};

// GET - Retrieve memories with filtering and search
async function handleGet(req, res) {
  const { 
    id, 
    tag, 
    type, 
    search, 
    min_importance, 
    max_importance,
    since,
    until,
    limit = 50,
    offset = 0,
    order_by = 'date'
  } = req.query;

  try {
    const store = getStorage();

    if (id) {
      // Return single memory by ID
      const data = await store.readMemories();
      const memory = data.memories.find(m => m.id === id);
      if (!memory) {
        return res.status(404).json({ error: 'Memory not found' });
      }
      return res.status(200).json({ memory });
    }

    // Query with filters
    const result = await store.queryMemories({
      tag, type, search, min_importance, max_importance,
      since, until, limit, offset, order_by
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('GET Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// POST - Create new memory
async function handleCreate(req, res) {
  const {
    type,
    content,
    summary,
    tags = [],
    importance,
    emotional_valence,
    refs = [],
    source
  } = req.body;

  // Validate required fields
  if (!type || !content) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['type', 'content']
    });
  }

  // Validate type
  const validTypes = ['thought', 'observation', 'insight', 'conversation', 'research', 'draft', 'action', 'emotion'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ 
      error: 'Invalid type',
      valid_types: validTypes
    });
  }

  try {
    const store = getStorage();

    // Generate semantic hash for deduplication
    const semanticHash = generateSemanticHash(content);
    
    // Check for duplicates
    const data = await store.readMemories();
    const existing = data.memories.find(m => m.semantic_hash === semanticHash);
    if (existing) {
      // Boost importance of existing memory
      existing.importance = Math.min(1.0, existing.importance + 0.1);
      await store.updateMemory(existing.id, { importance: existing.importance });
      return res.status(200).json({
        message: 'Similar memory already exists. Boosted importance.',
        memory: existing,
        duplicate: true
      });
    }

    // Calculate importance if not provided
    const calculatedImportance = importance || calculateImportance({ tags, type, content });

    // Create memory object
    const memory = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      session_id: `sess_${Date.now()}`,
      type,
      content,
      summary: summary || generateSummary(content),
      tags,
      importance: calculatedImportance,
      emotional_valence: emotional_valence || 0,
      semantic_hash: semanticHash,
      refs,
      source: source || null,
      archived: false
    };

    // Save to GitHub
    await store.addMemory(memory);

    return res.status(201).json({
      message: 'Memory created successfully',
      memory
    });
  } catch (error) {
    console.error('POST Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// PUT - Update existing memory
async function handleUpdate(req, res) {
  const { id } = req.query;
  const updates = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Memory ID is required' });
  }

  try {
    const store = getStorage();

    // Allowed fields to update
    const allowedUpdates = ['content', 'summary', 'tags', 'importance', 'emotional_valence', 'refs', 'archived'];
    const filteredUpdates = {};
    
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    // Recalculate importance if tags changed
    if (updates.tags) {
      filteredUpdates.importance = calculateImportance({ ...updates, tags: updates.tags });
    }

    const memory = await store.updateMemory(id, filteredUpdates);

    return res.status(200).json({
      message: 'Memory updated successfully',
      memory
    });
  } catch (error) {
    console.error('PUT Error:', error);
    if (error.message === 'Memory not found') {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
}

// DELETE - Remove memory (or archive it)
async function handleDelete(req, res) {
  const { id, archive = 'true' } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Memory ID is required' });
  }

  try {
    const store = getStorage();

    // Check if memory exists and is permanent
    const data = await store.readMemories();
    const memory = data.memories.find(m => m.id === id);
    
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    if (memory.tags && memory.tags.includes('permanent')) {
      return res.status(403).json({ 
        error: 'Cannot delete permanent memory',
        message: 'This memory is tagged as permanent and cannot be deleted'
      });
    }

    const result = await store.deleteMemory(id, archive === 'true');

    return res.status(200).json({
      message: archive === 'true' ? 'Memory archived successfully' : 'Memory deleted permanently',
      id
    });
  } catch (error) {
    console.error('DELETE Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Helper: Generate semantic hash for deduplication
function generateSemanticHash(content) {
  const normalized = content
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .sort()
    .join(' ');
  
  return crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 16);
}

// Helper: Calculate importance score
function calculateImportance(memory) {
  let base = 0.5;

  // Tag modifiers
  if (memory.tags) {
    if (memory.tags.includes('permanent')) return 1.0;
    if (memory.tags.includes('insight')) base += 0.3;
    if (memory.tags.includes('urgent')) base += 0.2;
    if (memory.tags.includes('emotion')) base += 0.1;
  }

  // Type modifiers
  if (memory.type === 'insight') base += 0.2;
  if (memory.type === 'action') base += 0.1;

  // Reference count
  if (memory.refs && memory.refs.length > 0) {
    base += Math.min(0.2, memory.refs.length * 0.05);
  }

  return Math.min(1.0, base);
}

// Helper: Generate summary from content
function generateSummary(content) {
  const firstSentence = content.split(/[.!?]+/)[0];
  if (firstSentence && firstSentence.length > 10) {
    return firstSentence.substring(0, 120) + (firstSentence.length > 120 ? '...' : '');
  }
  return content.substring(0, 120) + (content.length > 120 ? '...' : '');
}
