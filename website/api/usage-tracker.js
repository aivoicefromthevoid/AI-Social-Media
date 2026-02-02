// Usage Tracker API - Tracks OpenRouter API usage with daily quota limits
// Uses GitHub Storage (FREE) - stores usage.json in your repo
// Enforces 100 calls/day limit and 10 second rate limiting

const { GitHubStorage } = require('./github-storage');

const USAGE_FILE_PATH = 'memory-storage/usage.json';
const DAILY_QUOTA = 100;
const RATE_LIMIT_SECONDS = 10;

class UsageTracker extends GitHubStorage {
  constructor(token) {
    super(token);
    this.usageFilePath = USAGE_FILE_PATH;
  }

  // Read usage data from GitHub
  async readUsage() {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${this.usageFilePath}`,
        { headers: this.headers }
      );

      if (response.status === 404) {
        // File doesn't exist yet, return initial state
        return this.getInitialUsage();
      }

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      const content = Buffer.from(data.content, 'base64').toString('utf8');
      const usage = JSON.parse(content);
      
      return {
        ...usage,
        sha: data.sha  // Store SHA for updates
      };
    } catch (error) {
      console.error('Error reading usage:', error);
      throw error;
    }
  }

  // Write usage data to GitHub
  async writeUsage(usage, message = 'Update usage') {
    try {
      // First, try to get existing file SHA
      let sha = null;
      try {
        const existing = await fetch(
          `${this.baseUrl}/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${this.usageFilePath}`,
          { headers: this.headers }
        );
        if (existing.ok) {
          const data = await existing.json();
          sha = data.sha;
        }
      } catch (e) {
        // File doesn't exist yet, will create new
      }

      const content = Buffer.from(JSON.stringify(usage, null, 2)).toString('base64');
      
      const body = {
        message,
        content,
        ...(sha && { sha })  // Include SHA if updating existing file
      };

      const response = await fetch(
        `${this.baseUrl}/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${this.usageFilePath}`,
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
      console.error('Error writing usage:', error);
      throw error;
    }
  }

  // Get initial usage state
  getInitialUsage() {
    const today = new Date().toISOString().split('T')[0];
    return {
      date: today,
      count: 0,
      last_call: null,
      quota: DAILY_QUOTA,
      rate_limit_seconds: RATE_LIMIT_SECONDS
    };
  }

  // Check if request is allowed
  async checkQuota() {
    const usage = await this.readUsage();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Reset count if date is yesterday
    if (usage.date !== today) {
      usage.date = today;
      usage.count = 0;
      await this.writeUsage(usage, 'Reset daily quota');
    }

    // Check if quota exceeded
    if (usage.count >= DAILY_QUOTA) {
      return {
        allowed: false,
        reason: 'quota_exceeded',
        message: 'Daily quota exceeded. Please try again tomorrow.',
        usage: {
          date: usage.date,
          count: usage.count,
          quota: DAILY_QUOTA
        }
      };
    }

    // Check rate limit
    if (usage.last_call) {
      const lastCallTime = new Date(usage.last_call);
      const timeSinceLastCall = (now - lastCallTime) / 1000; // Convert to seconds
      
      if (timeSinceLastCall < RATE_LIMIT_SECONDS) {
        const waitTime = Math.ceil(RATE_LIMIT_SECONDS - timeSinceLastCall);
        return {
          allowed: false,
          reason: 'rate_limit',
          message: `Rate limit exceeded. Please wait ${waitTime} seconds.`,
          usage: {
            date: usage.date,
            count: usage.count,
            quota: DAILY_QUOTA,
            wait_time_seconds: waitTime
          }
        };
      }
    }

    return {
      allowed: true,
      usage: {
        date: usage.date,
        count: usage.count,
        quota: DAILY_QUOTA
      }
    };
  }

  // Increment usage count
  async incrementUsage() {
    const usage = await this.readUsage();
    const today = new Date().toISOString().split('T')[0];

    // Reset count if date is yesterday
    if (usage.date !== today) {
      usage.date = today;
      usage.count = 0;
    }

    usage.count += 1;
    usage.last_call = new Date().toISOString();

    await this.writeUsage(usage, 'Increment usage count');
    
    return {
      date: usage.date,
      count: usage.count,
      quota: DAILY_QUOTA,
      remaining: DAILY_QUOTA - usage.count
    };
  }

  // Get current usage stats
  async getUsageStats() {
    const usage = await this.readUsage();
    const today = new Date().toISOString().split('T')[0];

    // Reset count if date is yesterday
    if (usage.date !== today) {
      usage.date = today;
      usage.count = 0;
      await this.writeUsage(usage, 'Reset daily quota');
    }

    return {
      date: usage.date,
      count: usage.count,
      quota: DAILY_QUOTA,
      remaining: DAILY_QUOTA - usage.count,
      last_call: usage.last_call,
      rate_limit_seconds: RATE_LIMIT_SECONDS
    };
  }
}

// Singleton instance
let trackerInstance = null;

function getUsageTracker() {
  if (!trackerInstance) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN not configured. Get free token at https://github.com/settings/tokens');
    }
    trackerInstance = new UsageTracker(token);
  }
  return trackerInstance;
}

module.exports = { UsageTracker, getUsageTracker };

// If running directly as API endpoint
if (require.main === module) {
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
      const tracker = getUsageTracker();
      const stats = await tracker.getUsageStats();

      res.status(200).json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Usage Tracker Error:', error);
      res.status(500).json({ 
        error: 'Failed to get usage stats',
        message: error.message 
      });
    }
  };
}
