const cron = require('node-cron');
const Loan = require('../models/Loan');
const MessageSimulator = require('./simulator');

class CampaignScheduler {
  constructor(baseURL) {
    this.simulator = new MessageSimulator(baseURL);
    this.jobs = [];
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Scheduler already running');
      return;
    }

    console.log('📅 Campaign Scheduler started');

    const dailyJob = cron.schedule('0 9 * * *', () => this.sendDailyReminders(), {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    this.jobs.push(dailyJob);
    this.isRunning = true;
    console.log('✅ Scheduled daily reminders at 9 AM IST');
  }

  async sendDailyReminders() {
    console.log('📬 Sending daily EMI reminders...');

    try {
      const loans = await Loan.find({
        'contactProfile.loanAmountLeft': { $gt: 0 }
      }).limit(50);

      for (const loan of loans) {
        const responseRate = loan.contactProfile?.responseRate || 0.5;
        
        let tone = 'informational';
        if (responseRate < 0.3) {
          tone = 'empathetic';
        } else if (responseRate > 0.7) {
          tone = 'supportive';
        }

        const channels = loan.contactProfile?.contactChannels?.length > 0
          ? loan.contactProfile.contactChannels.slice(0, 2)
          : ['email', 'sms'];

        await this.simulator.sendCampaign(loan, channels, tone, 5000);
      }

      console.log(`✅ Daily reminders sent to ${loans.length} customers`);
    } catch (error) {
      console.error('❌ Daily reminders error:', error);
    }
  }

  stop() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    this.isRunning = false;
    console.log('⏹️ Campaign Scheduler stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: this.jobs.length
    };
  }
}

module.exports = CampaignScheduler;
