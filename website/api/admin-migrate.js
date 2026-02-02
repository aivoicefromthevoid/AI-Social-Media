// Admin API to migrate memories (protected by admin key)
const { migrateMemories } = require('./migrate-memories');

const ADMIN_KEY = process.env.ADMIN_API_KEY;

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check admin authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Run migration
    const result = await migrateMemories();
    
    res.status(200).json({
      success: true,
      message: 'Migration completed',
      result
    });
  } catch (error) {
    console.error('Migration API error:', error);
    res.status(500).json({
      error: 'Migration failed',
      message: error.message
    });
  }
};
