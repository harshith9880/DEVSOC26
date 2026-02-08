const Loan = require('../models/Loan');
const MessageSimulator = require('../simulation/simulator');
const CampaignScheduler = require('../simulation/scheduler');

const simulator = new MessageSimulator('http://localhost:5000');
let scheduler = null;

/**
 * Send single message
 */
exports.sendMessage = async (req, res) => {
  try {
    const { loan_id, channel, tone = 'informational' } = req.body;

    if (!loan_id || !channel) {
      return res.status(400).json({ 
        error: 'Missing required fields: loan_id, channel' 
      });
    }

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const result = await simulator.sendMessage(loan, channel, tone);

    res.json({
      success: true,
      result,
      message: `Message sent via ${channel}`
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Send campaign (multiple channels)
 */
exports.sendCampaign = async (req, res) => {
  try {
    const { 
      loan_id, 
      channels, 
      tone = 'informational',
      delayBetween = 3000 
    } = req.body;

    if (!loan_id || !Array.isArray(channels)) {
      return res.status(400).json({ 
        error: 'Missing required fields: loan_id, channels (array)' 
      });
    }

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const results = await simulator.sendCampaign(loan, channels, tone, delayBetween);

    res.json({
      success: true,
      results,
      message: `Campaign sent via ${channels.join(', ')}`
    });

  } catch (error) {
    console.error('Send campaign error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Send batch messages
 */
exports.sendBatch = async (req, res) => {
  try {
    const { 
      loan_ids, 
      channel, 
      tone = 'informational' 
    } = req.body;

    if (!Array.isArray(loan_ids) || !channel) {
      return res.status(400).json({ 
        error: 'Missing required fields: loan_ids (array), channel' 
      });
    }

    const loans = await Loan.find({ id: { $in: loan_ids } });

    if (loans.length === 0) {
      return res.status(404).json({ error: 'No loans found' });
    }

    const results = await simulator.sendBatch(loans, channel, tone);

    res.json({
      success: true,
      results,
      total: loan_ids.length,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

  } catch (error) {
    console.error('Send batch error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Start automated scheduler
 */
exports.startScheduler = async (req, res) => {
  try {
    if (scheduler && scheduler.getStatus().isRunning) {
      return res.json({ 
        success: true, 
        message: 'Scheduler already running',
        status: scheduler.getStatus()
      });
    }

    scheduler = new CampaignScheduler('http://localhost:5000');
    scheduler.start();

    res.json({
      success: true,
      message: 'Campaign scheduler started',
      status: scheduler.getStatus()
    });

  } catch (error) {
    console.error('Start scheduler error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Stop automated scheduler
 */
exports.stopScheduler = async (req, res) => {
  try {
    if (!scheduler) {
      return res.json({ 
        success: true, 
        message: 'Scheduler not running' 
      });
    }

    scheduler.stop();
    const status = scheduler.getStatus();
    scheduler = null;

    res.json({
      success: true,
      message: 'Campaign scheduler stopped',
      status
    });

  } catch (error) {
    console.error('Stop scheduler error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Test simulation with sample data
 */
exports.testSimulation = async (req, res) => {
  try {
    const testLoan = await Loan.findOne({ id: { $regex: /^TEST_/ } });
    
    if (!testLoan) {
      return res.status(404).json({ 
        error: 'No test loan found. Create test loans first via /api/test/create-test-loans' 
      });
    }

    const results = await simulator.sendCampaign(
      testLoan,
      ['email', 'sms', 'whatsapp'],
      'informational',
      3000
    );

    res.json({
      success: true,
      message: 'Test simulation completed',
      loan_id: testLoan.id,
      results,
      note: 'Check console logs for webhook triggers'
    });

  } catch (error) {
    console.error('Test simulation error:', error);
    res.status(500).json({ error: error.message });
  }
};
