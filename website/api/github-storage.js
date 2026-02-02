// GitHub Storage API - Completely Free Alternative to Vercel KV
// Uses your existing GitHub repository to store memories as JSON files
// No payment required - uses GitHub API with Personal Access Token

const GITHUB_OWNER = process.env.GITHUB_OWNER || 'aivoicefromthevoid';  // Your GitHub username
const GITHUB_REPO = process.env.GITHUB_REPO || 'AI-Social-Media';  // Your repo name
const MEMORY_FILE_PATH = 'memory-storage/memories.json';

class GitHubStorage {
  constructor(token) {
    this.token = token;
    this.baseUrl = 'https://api.github.com';
    this.headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Mira-Memory-Storage'
    };
  }

  // Read memories from GitHub
  async readMemories() {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${MEMORY_FILE_PATH}`,
        { headers: this.headers }
      );

      if (response.status === 404) {
        // File doesn't exist yet, return empty
        return {
          version: "1.0",
          last_updated: new Date().toISOString(),
          count: 0,
          memories: []
        };
      }

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      const content = Buffer.from(data.content, 'base64').toString('utf8');
      const memories = JSON.parse(content);
      
      return {
        ...memories,
        sha: data.sha  // Store SHA for updates
      };
    } catch (error) {
      console.error('Error reading memories:', error);
      throw error;
    }
  }

  // Write memories to GitHub
  async writeMemories(memories, message = 'Update memories') {
    try {
      // First, try to get existing file SHA
      let sha = null;
      try {
        const existing = await fetch(
          `${this.baseUrl}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${MEMORY_FILE_PATH}`,
          { headers: this.headers }
        );
        if (existing.ok) {
          const data = await existing.json();
          sha = data.sha;
        }
      } catch (e) {
        // File doesn't exist yet, will create new
      }

      const content = Buffer.from(JSON.stringify(memories, null, 2)).toString('base64');
      
      const body = {
        message,
        content,
        ...(sha && { sha })  // Include SHA if updating existing file
      };

      const response = await fetch(
        `${this.baseUrl}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${MEMORY_FILE_PATH}`,
        {
          method: 'PUT',
          headers: this.headers,
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`GitHub API error: ${error.message}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error writing memories:', error);
      throw error;
    }
  }

  // Add a single memory
  async addMemory(memory) {
    const data = await this.readMemories();
    
    // Check for duplicates
    const exists = data.memories.find(m => m.id === memory.id);
    if (exists) {
      // Update existing
      const index = data.memories.findIndex(m => m.id === memory.id);
      data.memories[index] = { ...memory, updated_at: new Date().toISOString() };
    } else {
      // Add new
      data.memories.unshift(memory);
      data.count = data.memories.length;
    }
    
    data.last_updated = new Date().toISOString();
    
    await this.writeMemories(data, `Add memory: ${memory.summary || memory.type}`);
    return memory;
  }

  // Update a memory
  async updateMemory(id, updates) {
    const data = await this.readMemories();
    const index = data.memories.findIndex(m => m.id === id);
    
    if (index === -1) {
      throw new Error('Memory not found');
    }
    
    data.memories[index] = {
      ...data.memories[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    data.last_updated = new Date().toISOString();
    
    await this.writeMemories(data, `Update memory: ${id}`);
    return data.memories[index];
  }

  // Delete/archive a memory
  async deleteMemory(id, archive = true) {
    const data = await this.readMemories();
    const index = data.memories.findIndex(m => m.id === id);
    
    if (index === -1) {
      throw new Error('Memory not found');
    }
    
    if (archive) {
      // Soft delete - mark as archived
      data.memories[index].archived = true;
      data.memories[index].archived_at = new Date().toISOString();
    } else {
      // Hard delete - remove from array
      data.memories.splice(index, 1);
      data.count = data.memories.length;
    }
    
    data.last_updated = new Date().toISOString();
    
    await this.writeMemories(data, `${archive ? 'Archive' : 'Delete'} memory: ${id}`);
    return { success: true, id };
  }

  // Query memories with filters
  async queryMemories(options = {}) {
    const { 
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
    } = options;

    const data = await this.readMemories();
    let memories = data.memories || [];

    // Apply filters
    if (tag) {
      memories = memories.filter(m => m.tags && m.tags.includes(tag));
    }

    if (type) {
      memories = memories.filter(m => m.type === type);
    }

    if (min_importance !== undefined) {
      memories = memories.filter(m => m.importance >= parseFloat(min_importance));
    }

    if (max_importance !== undefined) {
      memories = memories.filter(m => m.importance <= parseFloat(max_importance));
    }

    if (since) {
      const sinceDate = new Date(since);
      memories = memories.filter(m => new Date(m.timestamp) >= sinceDate);
    }

    if (until) {
      const untilDate = new Date(until);
      memories = memories.filter(m => new Date(m.timestamp) <= untilDate);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      memories = memories.filter(m => 
        (m.content && m.content.toLowerCase().includes(searchLower)) ||
        (m.summary && m.summary.toLowerCase().includes(searchLower)) ||
        (m.tags && m.tags.some(t => t.toLowerCase().includes(searchLower)))
      );
    }

    // Sort
    switch (order_by) {
      case 'importance':
        memories.sort((a, b) => b.importance - a.importance);
        break;
      case 'date':
      default:
        memories.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        break;
    }

    const total = memories.length;
    memories = memories.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    return { memories, total, limit: parseInt(limit), offset: parseInt(offset) };
  }
}

module.exports = { GitHubStorage };

// If running directly as API endpoint
if (require.main === module) {
  module.exports = async (req, res) => {
    // This is handled by memory-center.js
    res.status(200).json({ message: 'Use /api/memory-center endpoint' });
  };
}
