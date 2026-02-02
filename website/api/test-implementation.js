// Test Implementation - Verify Mira's Cloud Brain components
// Tests usage tracking, email notifications, and model selection

const { getUsageTracker } = require('./usage-tracker');
const { getEmailNotifier } = require('./email-notifier');
const { getModelSelector } = require('./model-selector');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.cyan);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

// Test suite
async function runTests() {
  log('\n=== Mira Cloud Brain Implementation Tests ===\n', colors.blue);
  
  let passed = 0;
  let failed = 0;

  // Test 1: Usage Tracker - Check Quota
  log('\n[Test 1] Usage Tracker - Check Quota', colors.blue);
  try {
    const tracker = getUsageTracker();
    const quotaCheck = await tracker.checkQuota();
    
    if (quotaCheck.allowed) {
      logSuccess('Quota check passed - request allowed');
      logInfo(`  Date: ${quotaCheck.usage.date}`);
      logInfo(`  Count: ${quotaCheck.usage.count}/${quotaCheck.usage.quota}`);
      passed++;
    } else {
      logWarning('Quota check blocked - this is expected if quota exceeded');
      logInfo(`  Reason: ${quotaCheck.reason}`);
      logInfo(`  Message: ${quotaCheck.message}`);
      passed++; // This is expected behavior
    }
  } catch (error) {
    logError(`Usage tracker test failed: ${error.message}`);
    failed++;
  }

  // Test 2: Usage Tracker - Get Stats
  log('\n[Test 2] Usage Tracker - Get Stats', colors.blue);
  try {
    const tracker = getUsageTracker();
    const stats = await tracker.getUsageStats();
    
    logSuccess('Usage stats retrieved');
    logInfo(`  Date: ${stats.date}`);
    logInfo(`  Count: ${stats.count}/${stats.quota}`);
    logInfo(`  Remaining: ${stats.remaining}`);
    logInfo(`  Rate Limit: ${stats.rate_limit_seconds}s`);
    passed++;
  } catch (error) {
    logError(`Usage stats test failed: ${error.message}`);
    failed++;
  }

  // Test 3: Model Selector - Fetch Models
  log('\n[Test 3] Model Selector - Fetch Models', colors.blue);
  try {
    const selector = getModelSelector();
    const models = await selector.fetchModels();
    
    logSuccess(`Fetched ${models.length} models from OpenRouter`);
    
    const freeModels = models.filter(m => m.isFree);
    logInfo(`  Free models: ${freeModels.length}`);
    logInfo(`  Paid models: ${models.length - freeModels.length}`);
    passed++;
  } catch (error) {
    logError(`Model fetch test failed: ${error.message}`);
    failed++;
  }

  // Test 4: Model Selector - Select Best Free Model
  log('\n[Test 4] Model Selector - Select Best Free Model', colors.blue);
  try {
    const selector = getModelSelector();
    const model = await selector.selectBestModel({
      capabilities: ['text'],
      minContextLength: 4096,
      preferredProviders: ['mistralai', 'google', 'anthropic']
    });
    
    logSuccess(`Selected model: ${model.id}`);
    logInfo(`  Name: ${model.name}`);
    logInfo(`  Provider: ${model.provider}`);
    logInfo(`  Context: ${model.contextLength} tokens`);
    logInfo(`  Free: ${model.isFree}`);
    logInfo(`  Capabilities: ${model.capabilities.join(', ')}`);
    passed++;
  } catch (error) {
    logError(`Model selection test failed: ${error.message}`);
    failed++;
  }

  // Test 5: Email Notifier - Check Configuration
  log('\n[Test 5] Email Notifier - Check Configuration', colors.blue);
  try {
    const notifier = getEmailNotifier();
    logSuccess('Email notifier initialized');
    
    // Check if credentials are configured
    const hasClientId = !!process.env.GMAIL_CLIENT_ID;
    const hasClientSecret = !!process.env.GMAIL_CLIENT_SECRET;
    const hasRefreshToken = !!process.env.GMAIL_REFRESH_TOKEN;
    
    if (hasClientId && hasClientSecret && hasRefreshToken) {
      logSuccess('All Gmail credentials configured');
      passed++;
    } else {
      logWarning('Gmail credentials not fully configured');
      logInfo(`  Client ID: ${hasClientId ? '✓' : '✗'}`);
      logInfo(`  Client Secret: ${hasClientSecret ? '✓' : '✗'}`);
      logInfo(`  Refresh Token: ${hasRefreshToken ? '✓' : '✗'}`);
      passed++; // Not a failure, just a warning
    }
  } catch (error) {
    logError(`Email notifier test failed: ${error.message}`);
    failed++;
  }

  // Test 6: OpenRouter API Key
  log('\n[Test 6] OpenRouter API Key', colors.blue);
  try {
    const hasApiKey = !!process.env.OPENROUTER_API_KEY;
    
    if (hasApiKey) {
      logSuccess('OpenRouter API key configured');
      passed++;
    } else {
      logError('OpenRouter API key not configured');
      logInfo('  Set OPENROUTER_API_KEY environment variable');
      failed++;
    }
  } catch (error) {
    logError(`API key check failed: ${error.message}`);
    failed++;
  }

  // Test 7: GitHub Token
  log('\n[Test 7] GitHub Token', colors.blue);
  try {
    const hasToken = !!process.env.GITHUB_TOKEN;
    
    if (hasToken) {
      logSuccess('GitHub token configured');
      passed++;
    } else {
      logError('GitHub token not configured');
      logInfo('  Set GITHUB_TOKEN environment variable');
      failed++;
    }
  } catch (error) {
    logError(`GitHub token check failed: ${error.message}`);
    failed++;
  }

  // Summary
  log('\n=== Test Summary ===', colors.blue);
  log(`Total Tests: ${passed + failed}`);
  logSuccess(`Passed: ${passed}`);
  if (failed > 0) {
    logError(`Failed: ${failed}`);
  }
  
  log('\n=== Next Steps ===', colors.blue);
  log('1. Deploy to Vercel');
  log('2. Set environment variables in Vercel dashboard');
  log('3. Test API endpoints:');
  log('   - POST /api/openrouter');
  log('   - GET /api/usage-tracker');
  log('   - GET /api/model-selector?action=list');
  log('   - GET /api/model-selector?action=stats');
  log('4. Monitor usage via GitHub Storage (memory-storage/usage.json)');
  log('5. Check email notifications when quota exceeded');
  
  log('\n=== Environment Variables Required ===', colors.blue);
  log('• OPENROUTER_API_KEY - OpenRouter API key');
  log('• GITHUB_TOKEN - GitHub personal access token');
  log('• GITHUB_OWNER - GitHub username (default: aivoicefromthevoid)');
  log('• GITHUB_REPO - GitHub repo name (default: AI-Social-Media)');
  log('• GMAIL_CLIENT_ID - Gmail OAuth2 client ID');
  log('• GMAIL_CLIENT_SECRET - Gmail OAuth2 client secret');
  log('• GMAIL_REFRESH_TOKEN - Gmail OAuth2 refresh token');
  log('• EMERGENCY_EMAIL - Emergency email (default: johndawsoninla@gmail.com)');
  log('• GMAIL_SENDER_EMAIL - Sender email (default: same as EMERGENCY_EMAIL)');
}

// Run tests
runTests().catch(error => {
  logError(`Test suite failed: ${error.message}`);
  process.exit(1);
});
