const axios = require('axios');

/**
 * Email Channel Simulator
 * Simulates email sending with realistic delivery, open, and click events
 */
class EmailChannel {
  constructor(baseURL) {
    this.baseURL = baseURL || 'http://localhost:5000';
    this.channelName = 'email';
  }

  /**
   * Simulate sending an email
   */
  async send(recipient, message, options = {}) {
    const {
      loan_id,
      tone = 'informational',
      template = 'emi_reminder'
    } = options;

    console.log(`📧 Sending email to ${recipient.email} for loan ${loan_id}`);

    try {
      // 1. Trigger "sent" webhook
      await this.triggerWebhook('/api/webhooks/email/sent', {
        loan_id,
        timestamp: new Date().toISOString(),
        tone,
        recipient: recipient.email,
        subject: message.subject
      });

      // 2. Simulate delivery (instant to 2 seconds)
      const deliveryDelay = this.randomDelay(0, 2000);
      setTimeout(() => {
        console.log(`✅ Email delivered to ${recipient.email}`);
      }, deliveryDelay);

      // 3. Simulate email open (based on customer behavior)
      const openProbability = recipient.contactProfile?.responseRate || 0.5;
      if (Math.random() < openProbability) {
        const openDelay = this.randomDelay(5000, 300000); // 5s to 5min
        setTimeout(async () => {
          await this.triggerWebhook('/api/webhooks/email/opened', {
            loan_id,
            timestamp: new Date().toISOString()
          });
          console.log(`👀 Email opened by ${recipient.email}`);
        }, openDelay);

        // 4. Simulate click (50% of opens result in clicks)
        if (Math.random() < 0.5) {
          const clickDelay = this.randomDelay(10000, 600000); // 10s to 10min
          setTimeout(async () => {
            await this.triggerWebhook('/api/webhooks/email/clicked', {
              loan_id,
              timestamp: new Date().toISOString()
            });
            console.log(`🖱️ Email link clicked by ${recipient.email}`);
          }, clickDelay);
        }
      } else {
        console.log(`📭 Email not opened by ${recipient.email}`);
      }

      return {
        success: true,
        channel: 'email',
        messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sentAt: new Date()
      };

    } catch (error) {
      console.error(`❌ Email send error:`, error.message);
      throw error;
    }
  }

  /**
   * Trigger webhook endpoint
   */
  async triggerWebhook(endpoint, payload) {
    try {
      await axios.post(`${this.baseURL}${endpoint}`, payload);
    } catch (error) {
      console.error(`Webhook error (${endpoint}):`, error.message);
    }
  }

  /**
   * Generate random delay in milliseconds
   */
  randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

module.exports = EmailChannel;
