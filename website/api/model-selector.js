// Model Selection API - Intelligent filtering and selection of OpenRouter models
// Filters for free models only to respect 100 calls/day limit
// Prioritizes by capabilities and context length

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.replace(/^\uFEFF/, '').trim() : null;

if (!OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY environment variable is required');
}

// Model metadata interfaces (TypeScript-style documentation)
/**
 * @typedef {Object} ModelPricing
 * @property {number} prompt - Price per prompt token
 * @property {number} completion - Price per completion token
 */

/**
 * @typedef {Object} ModelMetadata
 * @property {string} id - Unique model identifier
 * @property {string} name - Human-readable model name
 * @property {string} provider - Provider/organization
 * @property {ModelPricing} pricing - Pricing information per token
 * @property {number} contextLength - Maximum context window size in tokens
 * @property {boolean} isFree - Whether this is a free tier model
 * @property {string[]} capabilities - Model capabilities (text, vision, tools)
 * @property {string} [description] - Optional model description
 */

class ModelSelector {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.modelsCache = null;
    this.cacheExpiry = null;
  }

  // Fetch available models from OpenRouter
  async fetchModels() {
    // Check cache
    if (this.modelsCache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
      return this.modelsCache;
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform to ModelMetadata format
      this.modelsCache = data.data.map(model => this.transformModel(model));
      
      // Cache for 1 hour
      this.cacheExpiry = Date.now() + (60 * 60 * 1000);
      
      return this.modelsCache;
    } catch (error) {
      console.error('Failed to fetch models:', error);
      throw error;
    }
  }

  // Transform OpenRouter model response to ModelMetadata
  transformModel(model) {
    return {
      id: model.id,
      name: model.name,
      provider: this.extractProvider(model.id),
      pricing: {
        prompt: parseFloat(model.pricing?.prompt || '0'),
        completion: parseFloat(model.pricing?.completion || '0')
      },
      contextLength: model.context_length || 4096,
      isFree: model.pricing?.prompt === '0' && model.pricing?.completion === '0',
      capabilities: this.inferCapabilities(model),
      description: model.description || ''
    };
  }

  // Extract provider from model ID
  extractProvider(modelId) {
    const parts = modelId.split('/');
    return parts[0] || 'unknown';
  }

  // Infer capabilities from model metadata
  inferCapabilities(model) {
    const capabilities = ['text'];
    
    // Check for vision capabilities (common in model names)
    if (model.name?.toLowerCase().includes('vision') || 
        model.name?.toLowerCase().includes('multimodal') ||
        model.id?.toLowerCase().includes('vision')) {
      capabilities.push('vision');
    }
    
    // Check for tool/function calling capabilities
    if (model.name?.toLowerCase().includes('tool') ||
        model.name?.toLowerCase().includes('function') ||
        model.id?.toLowerCase().includes('tool')) {
      capabilities.push('tools');
    }
    
    return capabilities;
  }

  // Filter models by criteria
  filterModels(options = {}) {
    const {
      isFree = true,
      capabilities = [],
      minContextLength = 0,
      providers = [],
      excludeProviders = []
    } = options;

    return this.modelsCache.filter(model => {
      // Filter by free tier
      if (isFree && !model.isFree) return false;
      
      // Filter by capabilities
      if (capabilities.length > 0) {
        const hasAllCapabilities = capabilities.every(cap => 
          model.capabilities.includes(cap)
        );
        if (!hasAllCapabilities) return false;
      }
      
      // Filter by minimum context length
      if (model.contextLength < minContextLength) return false;
      
      // Filter by allowed providers
      if (providers.length > 0 && !providers.includes(model.provider)) {
        return false;
      }
      
      // Filter by excluded providers
      if (excludeProviders.includes(model.provider)) {
        return false;
      }
      
      return true;
    });
  }

  // Select best model based on criteria
  async selectBestModel(options = {}) {
    const {
      capabilities = ['text'],
      minContextLength = 4096,
      preferredProviders = ['mistralai', 'google', 'anthropic'],
      excludeProviders = []
    } = options;

    // Fetch models if not cached
    if (!this.modelsCache) {
      await this.fetchModels();
    }

    // Filter models
    const filteredModels = this.filterModels({
      isFree: true,
      capabilities,
      minContextLength,
      excludeProviders
    });

    if (filteredModels.length === 0) {
      throw new Error('No suitable free models available');
    }

    // Sort by priority
    const sortedModels = this.sortModelsByPriority(filteredModels, preferredProviders);
    
    // Return best model
    return sortedModels[0];
  }

  // Sort models by priority
  sortModelsByPriority(models, preferredProviders) {
    return models.sort((a, b) => {
      // Priority 1: Preferred providers
      const aPreferred = preferredProviders.includes(a.provider);
      const bPreferred = preferredProviders.includes(b.provider);
      
      if (aPreferred && !bPreferred) return -1;
      if (!aPreferred && bPreferred) return 1;
      
      // Priority 2: Context length (larger is better)
      if (a.contextLength !== b.contextLength) {
        return b.contextLength - a.contextLength;
      }
      
      // Priority 3: Provider name (alphabetical for consistency)
      return a.provider.localeCompare(b.provider);
    });
  }

  // Get model by ID
  getModelById(modelId) {
    if (!this.modelsCache) {
      throw new Error('Models not loaded. Call fetchModels() first.');
    }
    
    return this.modelsCache.find(model => model.id === modelId);
  }

  // Get all free models
  async getFreeModels() {
    if (!this.modelsCache) {
      await this.fetchModels();
    }
    
    return this.modelsCache.filter(model => model.isFree);
  }

  // Get model statistics
  getModelStats() {
    if (!this.modelsCache) {
      throw new Error('Models not loaded. Call fetchModels() first.');
    }
    
    const stats = {
      total: this.modelsCache.length,
      free: this.modelsCache.filter(m => m.isFree).length,
      paid: this.modelsCache.filter(m => !m.isFree).length,
      byProvider: {},
      byCapability: {
        text: 0,
        vision: 0,
        tools: 0
      }
    };
    
    // Count by provider
    this.modelsCache.forEach(model => {
      stats.byProvider[model.provider] = (stats.byProvider[model.provider] || 0) + 1;
      
      // Count capabilities
      model.capabilities.forEach(cap => {
        if (stats.byCapability[cap] !== undefined) {
          stats.byCapability[cap]++;
        }
      });
    });
    
    return stats;
  }
}

// Singleton instance
let selectorInstance = null;

function getModelSelector() {
  if (!selectorInstance) {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }
    selectorInstance = new ModelSelector(OPENROUTER_API_KEY);
  }
  return selectorInstance;
}

module.exports = { ModelSelector, getModelSelector };

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
      const { 
        action = 'select',
        capabilities,
        minContextLength,
        preferredProviders,
        excludeProviders
      } = req.query;

      const selector = getModelSelector();

      if (action === 'select') {
        const model = await selector.selectBestModel({
          capabilities: capabilities ? capabilities.split(',') : ['text'],
          minContextLength: minContextLength ? parseInt(minContextLength) : 4096,
          preferredProviders: preferredProviders ? preferredProviders.split(',') : ['mistralai', 'google', 'anthropic'],
          excludeProviders: excludeProviders ? excludeProviders.split(',') : []
        });

        res.status(200).json({
          success: true,
          model
        });
      } else if (action === 'list') {
        const models = await selector.getFreeModels();
        
        res.status(200).json({
          success: true,
          models,
          count: models.length
        });
      } else if (action === 'stats') {
        const stats = selector.getModelStats();
        
        res.status(200).json({
          success: true,
          stats
        });
      } else {
        res.status(400).json({
          error: 'Invalid action',
          validActions: ['select', 'list', 'stats']
        });
      }
    } catch (error) {
      console.error('Model Selector Error:', error);
      res.status(500).json({ 
        error: 'Failed to select model',
        message: error.message 
      });
    }
  };
}
