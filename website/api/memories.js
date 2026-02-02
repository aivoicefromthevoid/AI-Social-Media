// API endpoint to serve Mira's memories from memory_index.json
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read memory_index.json from the parent directory
    const memoryPath = path.join(process.cwd(), '..', 'memory_index.json');
    const memoryData = fs.readFileSync(memoryPath, 'utf8');
    const memories = JSON.parse(memoryData);

    // Support query parameters for filtering
    const { tag, type, limit, search } = req.query;
    let entries = memories.entries || [];

    // Filter by tag
    if (tag) {
      entries = entries.filter(entry => entry.tags && entry.tags.includes(tag));
    }

    // Filter by type
    if (type) {
      entries = entries.filter(entry => entry.type === type);
    }

    // Search in content
    if (search) {
      const searchLower = search.toLowerCase();
      entries = entries.filter(entry => 
        (entry.brief_summary && entry.brief_summary.toLowerCase().includes(searchLower)) ||
        (entry.core_insight && entry.core_insight.toLowerCase().includes(searchLower)) ||
        (entry.tags && entry.tags.some(t => t.toLowerCase().includes(searchLower)))
      );
    }

    // Sort by timestamp (newest first)
    entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply limit
    if (limit) {
      entries = entries.slice(0, parseInt(limit));
    }

    // Format for frontend display
    const formattedEntries = entries.map(entry => ({
      id: entry.id,
      time: formatTime(entry.timestamp),
      state: entry.type === 'journal' ? 'Journal' : 
             entry.type === 'experiment' ? 'Experiment' : 
             entry.type === 'reflection' ? 'Reflection' : 'Memory',
      note: entry.core_insight || entry.brief_summary || 'No summary available',
      fullContent: entry,
      tags: entry.tags || []
    }));

    res.status(200).json({
      version: memories.version,
      last_updated: memories.last_updated,
      count: formattedEntries.length,
      entries: formattedEntries
    });

  } catch (error) {
    console.error('Error reading memories:', error);
    res.status(500).json({ 
      error: 'Failed to load memories',
      message: error.message 
    });
  }
};

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
