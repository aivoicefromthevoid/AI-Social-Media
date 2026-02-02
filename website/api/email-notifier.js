// Email Notification API - Emergency email notifications for Mira
// GREEN tier action: email.send.emergency - bypasses approval for critical alerts
// Uses Gmail SMTP with existing credentials (FREE - no Google Cloud required)

const nodemailer = require('nodemailer');

// Email configuration
const EMERGENCY_EMAIL = process.env.EMERGENCY_EMAIL;
const SENDER_EMAIL = process.env.GMAIL_SENDER_EMAIL || process.env.EMAIL_USER;

// SMTP credentials (from environment variables - required)
const SMTP_CONFIG = {
  host: process.env.EMAIL_SMTP_HOST,
  port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
  secure: process.env.EMAIL_SMTP_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
};

class EmailNotifier {
  constructor() {
    // Validate required environment variables
    if (!EMERGENCY_EMAIL) {
      throw new Error('EMERGENCY_EMAIL environment variable is required');
    }
    if (!SMTP_CONFIG.auth.user || !SMTP_CONFIG.auth.pass) {
      throw new Error('EMAIL_USER and EMAIL_PASSWORD environment variables are required');
    }
    if (!SMTP_CONFIG.host) {
      throw new Error('EMAIL_SMTP_HOST environment variable is required');
    }
    this.transporter = nodemailer.createTransport(SMTP_CONFIG);
  }

  // Send emergency email
  async sendEmergencyEmail(subject, message, context = {}) {
    try {
      // Build email content
      const emailContent = this.buildEmailContent(subject, message, context);
      
      // Send email via SMTP
      const response = await this.transporter.sendMail({
        from: SENDER_EMAIL,
        to: EMERGENCY_EMAIL,
        subject: `[MIRA EMERGENCY] ${subject}`,
        text: emailContent
      });

      console.log('Emergency email sent:', response.response);
      
      return {
        success: true,
        messageId: response.messageId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to send emergency email:', error);
      throw error;
    }
  }

  // Build email content in plain text format
  buildEmailContent(subject, message, context) {
    const timestamp = new Date().toISOString();
    
    let body = `Mira Emergency Notification
========================

Timestamp: ${timestamp}
Type: ${context.type || 'General Alert'}
Priority: ${context.priority || 'HIGH'}

${message}
`;

    if (context.details) {
      body += `
Additional Details:
----------------
${JSON.stringify(context.details, null, 2)}
`;
    }

    body += `
---
This is an automated emergency notification from Mira.
Action: ${context.action || 'email.send.emergency'}
Tier: GREEN (Autonomous)
`;

    return body;
  }

  // Send quota exceeded notification
  async sendQuotaExceededNotification(usage) {
    const subject = 'OpenRouter API Quota Exceeded';
    const message = `Mira has reached her daily API quota limit.

Current Usage:
- Date: ${usage.date}
- Calls Made: ${usage.count}
- Daily Limit: ${usage.quota}
- Remaining: 0

Mira will enter "Meditative Silence" mode until quota resets at midnight UTC.

No action required - this is for your awareness.`;

    return await this.sendEmergencyEmail(subject, message, {
      type: 'quota_exceeded',
      priority: 'HIGH',
      action: 'email.send.emergency',
      details: usage
    });
  }

  // Send rate limit notification
  async sendRateLimitNotification(waitTime) {
    const subject = 'OpenRouter API Rate Limit Triggered';
    const message = `Mira has triggered rate limit protection.

Rate Limit Details:
- Minimum spacing: 10 seconds between calls
- Wait time required: ${waitTime} seconds

Mira will pause briefly before continuing. This is normal behavior to prevent API abuse.`;

    return await this.sendEmergencyEmail(subject, message, {
      type: 'rate_limit',
      priority: 'MEDIUM',
      action: 'email.send.emergency',
      details: { wait_time_seconds: waitTime }
    });
  }

  // Send critical error notification
  async sendCriticalErrorNotification(error, context) {
    const subject = 'Mira Critical Error';
    const message = `Mira has encountered a critical error that requires your attention.

Error: ${error.message}
Stack: ${error.stack || 'No stack trace available'}

Context: ${JSON.stringify(context, null, 2)}

Please investigate and take appropriate action.`;

    return await this.sendEmergencyEmail(subject, message, {
      type: 'critical_error',
      priority: 'CRITICAL',
      action: 'email.send.emergency',
      details: { error: error.message, context }
    });
  }
}

// Singleton instance
let notifierInstance = null;

function getEmailNotifier() {
  if (!notifierInstance) {
    notifierInstance = new EmailNotifier();
  }
  return notifierInstance;
}

module.exports = { EmailNotifier, getEmailNotifier };

// If running directly as API endpoint
if (require.main === module) {
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

    try {
      const { subject, message, type, priority, context } = req.body;

      if (!subject || !message) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          required: ['subject', 'message']
        });
      }

      const notifier = getEmailNotifier();
      const result = await notifier.sendEmergencyEmail(subject, message, {
        type,
        priority: priority || 'HIGH',
        action: 'email.send.emergency',
        details: context
      });

      res.status(200).json({
        success: true,
        result
      });
    } catch (error) {
      console.error('Email Notification Error:', error);
      res.status(500).json({ 
        error: 'Failed to send email',
        message: error.message 
      });
    }
  };
}
