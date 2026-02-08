const axios = require('axios');

class MessageSimulator {
  constructor(baseURL) {
    this.baseURL = baseURL || 'http://localhost:5000';
  }

  async sendMessage(loan, channel, tone = 'informational') {
    const loan_id = loan.id;
    const timestamp = new Date().toISOString();

    try {
      await axios.post(`${this.baseURL}/api/webhooks/${channel}/sent`, {
        loan_id,
        timestamp,
        tone
      });

      console.log(`✅ Sent ${channel} message for loan ${loan_id}`);

      setTimeout(async () => {
        try {
          if (channel === 'email') {
            if (Math.random() < (loan.contactProfile?.responseRate || 0.5)) {
              await axios.post(`${this.baseURL}/api/webhooks/email/opened`, {
                loan_id,
                timestamp: new Date().toISOString()
              });
              console.log(`📧 Email opened by ${loan_id}`);

              if (Math.random() < 0.6) {
                setTimeout(async () => {
                  await axios.post(`${this.baseURL}/api/webhooks/email/clicked`, {
                    loan_id,
                    timestamp: new Date().toISOString()
                  });
                  console.log(`🖱️ Email clicked by ${loan_id}`);
                }, 5000);
              }
            }
          } else if (channel === 'sms') {
            await axios.post(`${this.baseURL}/api/webhooks/sms/delivered`, {
              loan_id,
              timestamp: new Date().toISOString()
            });
            console.log(`📱 SMS delivered to ${loan_id}`);

            if (Math.random() < (loan.contactProfile?.responseRate || 0.4)) {
              setTimeout(async () => {
                await axios.post(`${this.baseURL}/api/webhooks/sms/clicked`, {
                  loan_id,
                  timestamp: new Date().toISOString()
                });
                console.log(`🖱️ SMS clicked by ${loan_id}`);
              }, 8000);
            }
          } else if (channel === 'whatsapp') {
            await axios.post(`${this.baseURL}/api/webhooks/whatsapp/delivered`, {
              loan_id,
              timestamp: new Date().toISOString()
            });
            console.log(`💬 WhatsApp delivered to ${loan_id}`);

            if (Math.random() < (loan.contactProfile?.responseRate || 0.6)) {
              setTimeout(async () => {
                await axios.post(`${this.baseURL}/api/webhooks/whatsapp/read`, {
                  loan_id,
                  timestamp: new Date().toISOString()
                });
                console.log(`👀 WhatsApp read by ${loan_id}`);
              }, 6000);
            }
          } else if (channel === 'call') {
            const answered = Math.random() < (loan.contactProfile?.responseRate || 0.3) * 0.7;
            const endpoint = answered ? 'answered' : 'missed';
            
            await axios.post(`${this.baseURL}/api/webhooks/call/${endpoint}`, {
              loan_id,
              timestamp: new Date().toISOString(),
              duration_seconds: answered ? Math.floor(Math.random() * 180) + 30 : 0
            });
            console.log(`📞 Call ${endpoint} for ${loan_id}`);
          }
        } catch (err) {
          console.error(`Webhook trigger error:`, err.message);
        }
      }, 2000);

      return {
        success: true,
        channel,
        loan_id,
        sentAt: timestamp
      };

    } catch (error) {
      console.error(`Error sending ${channel} message:`, error.message);
      throw error;
    }
  }

  async sendCampaign(loan, channels, tone = 'informational', delayBetween = 3000) {
    const results = [];

    for (const channel of channels) {
      try {
        const result = await this.sendMessage(loan, channel, tone);
        results.push(result);

        if (delayBetween > 0) {
          await this.delay(delayBetween);
        }
      } catch (error) {
        results.push({
          success: false,
          channel,
          error: error.message
        });
      }
    }

    return results;
  }

  async sendBatch(loans, channel, tone = 'informational') {
    const results = [];

    for (const loan of loans) {
      try {
        const result = await this.sendMessage(loan, channel, tone);
        results.push({
          loan_id: loan.id,
          ...result
        });
      } catch (error) {
        results.push({
          loan_id: loan.id,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = MessageSimulator;
