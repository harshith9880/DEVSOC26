const axios = require('axios');

/**
 * WhatsApp Channel Simulator
 * Simulates WhatsApp messaging with read receipts and replies
 */
class WhatsAppChannel {
  constructor(baseURL) {
    this.baseURL = baseURL || 'http://localhost:5000';
    this.channelName = 'whatsapp';
  }

  async send(recipient, message, options = {}) {
    const {
      loan_id,
      tone = 'informational'
    } = options;

    console.log(`💬 Sending WhatsApp to ${recipient.phone} for loan ${loan_id}`);

    try {
      // 1. Trigger "sent" webhook
      await this.triggerWebhook('/api/webhooks/whatsapp/sent', {
        loan_id,
        timestamp: new Date().toISOString(),
        tone,
        recipient: recipient.phone,
        message: message.text
      });

      // 2. Simulate delivery (instant to 3 seconds)
      const deliveryDelay = this.randomDelay(100, 3000);
      setTimeout(async () => {
        await this.triggerWebhook('/api/webhooks/whatsapp/delivered', {
          loan_id,
          timestamp: new Date().toISOString()
        });
        console.log(`✅ WhatsApp delivered to ${recipient.phone}`);
      }, deliveryDelay);

      // 3. Simulate read receipt (higher probability than email)
      const readProbability = recipient.contactProfile?.responseRate || 0.6;
      if (Math.random() < readProbability) {
        const readDelay = this.randomDelay(10000, 600000); // 10s to 10min
        setTimeout(async () => {
          await this.triggerWebhook('/api/webhooks/whatsapp/read', {
            loan_id,
            timestamp: new Date().toISOString()
          });
          console.log(`👀 WhatsApp read by ${recipient.phone}`);
        }, readDelay);

        // 4. Simulate reply (30% of reads result in replies)
        if (Math.random() < 0.3) {
          const replyDelay = this.randomDelay(60000, 1800000); // 1min to 30min
          setTimeout(async () => {
            await this.triggerWebhook('/api/webhooks/whatsapp/replied', {
              loan_id,
              timestamp: new Date().toISOString(),
              message: this.generateReply()
            });
            console.log(`💬 WhatsApp reply from ${recipient.phone}`);
          }, replyDelay);
        }
      }

      return {
        success: true,
        channel: 'whatsapp',
        messageId: `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sentAt: new Date()
      };

    } catch (error) {
      console.error(`❌ WhatsApp send error:`, error.message);
      throw error;
    }
  }

  generateReply() {
    const replies = [
      "I'll pay soon",
      "When is the due date?",
      "Can I get an extension?",
      "Thank you for the reminder",
      "I already paid",
      "Please call me"
    ];
    return replies[Math.floor(Math.random() * replies.length)];
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

module.exports = WhatsAppChannel;
