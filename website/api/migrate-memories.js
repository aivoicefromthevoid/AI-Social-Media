// Migration script to copy existing memories from memory_index.json to GitHub Storage
const fs = require('fs');
const path = require('path');
const { GitHubStorage } = require('./github-storage');

async function migrateMemories() {
  const token = process.env.GITHUB_TOKEN?.replace(/^\uFEFF/, '').trim();
  
  if (!token) {
    console.error('GITHUB_TOKEN not configured');
    process.exit(1);
  }

  const storage = new GitHubStorage(token);
  
  try {
    // Read existing memory_index.json
    const memoryPath = path.join(process.cwd(), '..', 'memory_index.json');
    const memoryData = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
    
    console.log(`Found ${memoryData.entries.length} memories to migrate`);
    
    // Read current memories from GitHub (or create empty)
    let githubMemories;
    try {
      githubMemories = await storage.readMemories();
      console.log(`Current GitHub memories: ${githubMemories.memories?.length || 0}`);
    } catch (e) {
      console.log('Creating new memory store');
      githubMemories = {
        version: "1.0",
        last_updated: new Date().toISOString(),
        count: 0,
        memories: []
      };
    }
    
    // Migrate each entry
    let migrated = 0;
    let skipped = 0;
    
    for (const entry of memoryData.entries) {
      // Check if already exists
      const exists = githubMemories.memories.find(m => m.id === entry.id);
      if (exists) {
        console.log(`Skipping ${entry.id} - already exists`);
        skipped++;
        continue;
      }
      
      // Create memory object
      const memory = {
        id: entry.id,
        timestamp: entry.timestamp,
        session_id: `sess_${Date.now()}`,
        type: entry.type === 'journal' ? 'thought' : entry.type,
        content: entry.brief_summary || entry.core_insight || 'No content',
        summary: entry.core_insight || entry.brief_summary,
        tags: entry.tags || [],
        importance: entry.tags?.includes('genesis') ? 1.0 : 
                    entry.tags?.includes('permanent') ? 1.0 : 0.7,
        emotional_valence: 0.5,
        semantic_hash: entry.semantic_hash || '',
        refs: entry.file_path ? [entry.file_path] : [],
        source: 'migration',
        archived: false
      };
      
      // Add to GitHub storage
      githubMemories.memories.unshift(memory);
      migrated++;
      console.log(`Migrated: ${entry.id}`);
    }
    
    // Update metadata
    githubMemories.count = githubMemories.memories.length;
    githubMemories.last_updated = new Date().toISOString();
    
    // Write to GitHub
    await storage.writeMemories(githubMemories, `Migrate ${migrated} memories from memory_index.json`);
    
    console.log('\nMigration complete!');
    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Total in storage: ${githubMemories.count}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  migrateMemories();
}

module.exports = { migrateMemories };
