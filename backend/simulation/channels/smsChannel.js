const axios = require('axios');

/**
 * SMS Channel Simulator
 * Simulates SMS sending with delivery and click tracking
 */
class SMSChannel {
  constructor(baseURL) {
    this.baseURL = baseURL || 'http://localhost:5000';
    this.channelName = 'sms';
  }

  async send(recipient, message, options = {}) {
    const {
      loan_id,
      tone = 'informational'
    } = options;

    console.log(`📱 Sending SMS to ${recipient.phone} for loan ${loan_id}`);

    try {
      // 1. Trigger "sent" webhook
      await this.triggerWebhook('/api/webhooks/sms/sent', {
        loan_id,
        timestamp: new Date().toISOString(),
        tone,
        recipient: recipient.phone,
        message: message.text
      });

      // 2. Simulate delivery (1-5 seconds)
      const deliveryDelay = this.randomDelay(1000, 5000);
      setTimeout(async () => {
        await this.triggerWebhook('/api/webhooks/sms/delivered', {
          loan_id,
          timestamp: new Date().toISOString()
        });
        console.log(`✅ SMS delivered to ${recipient.phone}`);
      }, deliveryDelay);

      // 3. Simulate link click (if SMS contains link)
      const clickProbability = recipient.contactProfile?.responseRate || 0.4;
      if (message.hasLink && Math.random() < clickProbability) {
        const clickDelay = this.randomDelay(30000, 1800000); // 30s to 30min
        setTimeout(async () => {
          await this.triggerWebhook('/api/webhooks/sms/clicked', {
            loan_id,
            timestamp: new Date().toISOString()
          });
          console.log(`🖱️ SMS link clicked by ${recipient.phone}`);
        }, clickDelay);
      }

      return {
        success: true,
        channel: 'sms',
        messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sentAt: new Date()
      };

    } catch (error) {
      console.error(`❌ SMS send error:`, error.message);
      throw error;
    }
  }

  async triggerWebhook(endpoint, payload) {
    try {
      await axios.post(`${this.baseURL}${endpoint}`, payload);
    } catch (error) {
      console.error(`Webhook error (${endpoint}):`, error.message);
    }
  }

  randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

module.exports = SMSChannel;
