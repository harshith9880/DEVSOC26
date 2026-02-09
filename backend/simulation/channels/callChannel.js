const axios = require('axios');

/**
 * Call Channel Simulator
 * Simulates phone calls with answer/miss scenarios
 */
class CallChannel {
  constructor(baseURL) {
    this.baseURL = baseURL || 'http://localhost:5000';
    this.channelName = 'call';
  }

  async send(recipient, message, options = {}) {
    const {
      loan_id,
      tone = 'informational'
    } = options;

    console.log(`📞 Initiating call to ${recipient.phone} for loan ${loan_id}`);

    try {
      // 1. Trigger "initiated" webhook
      await this.triggerWebhook('/api/webhooks/call/initiated', {
        loan_id,
        timestamp: new Date().toISOString(),
        tone,
        recipient: recipient.phone
      });

      // 2. Simulate call connection attempt (3-10 seconds)
      const connectionDelay = this.randomDelay(3000, 10000);
      
      setTimeout(async () => {
        // Determine if call is answered based on customer behavior
        const answerProbability = (recipient.contactProfile?.responseRate || 0.3) * 0.7; // Calls have lower answer rate
        
        if (Math.random() < answerProbability) {
          // Call answered
          const callDuration = this.randomDelay(30, 300); // 30s to 5min
          
          await this.triggerWebhook('/api/webhooks/call/answered', {
            loan_id,
            timestamp: new Date().toISOString(),
            duration_seconds: callDuration
          });
          
          console.log(`✅ Call answered by ${recipient.phone} (${callDuration}s)`);
        } else {
          // Call not answered
          await this.triggerWebhook('/api/webhooks/call/missed', {
            loan_id,
            timestamp: new Date().toISOString()
          });
          
          console.log(`📵 Call missed by ${recipient.phone}`);
        }
      }, connectionDelay);

      return {
        success: true,
        channel: 'call',
        messageId: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sentAt: new Date()
      };

    } catch (error) {
      console.error(`❌ Call initiation error:`, error.message);
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

module.exports = CallChannel;
