const express = require('express');
const router = express.Router();
const Loan = require('../../models/Loan');

// Call initiated webhook
router.post('/initiated', async (req, res) => {
  try {
    const { loan_id, timestamp, tone } = req.body;

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    loan.contactProfile.lastContactAt = new Date(timestamp);
    if (!loan.contactProfile.contactChannels.includes('call')) {
      loan.contactProfile.contactChannels.push('call');
    }
    if (tone) {
      loan.contactProfile.tone = tone;
    }
    loan.contactProfile.currentContactFreq += 1;

    if (!loan.interactionHistory) {
      loan.interactionHistory = [];
    }
    loan.interactionHistory.push({
      channel: 'call',
      sentAt: new Date(timestamp),
      tone: tone || 'informational',
      status: 'sent'
    });

    await loan.save();

    res.json({ success: true, message: 'Call initiated event recorded' });
  } catch (error) {
    console.error('Call initiated webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Call answered webhook
router.post('/answered', async (req, res) => {
  try {
    const { loan_id, timestamp, duration_seconds } = req.body;

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    loan.contactProfile.lastResponseAt = new Date(timestamp);

    const callInteractions = loan.interactionHistory.filter(i => i.channel === 'call');
    const interaction = callInteractions[callInteractions.length - 1];

    if (interaction && interaction.sentAt) {
      interaction.respondedAt = new Date(timestamp);
      interaction.status = 'responded';

      const delayMs = new Date(timestamp) - new Date(interaction.sentAt);
      loan.contactProfile.delayTimeMs = delayMs;
    }

    // Recalculate response rate for calls
    const answeredInteractions = callInteractions.filter(i => i.respondedAt);
    loan.contactProfile.responseRate = callInteractions.length > 0 
      ? answeredInteractions.length / callInteractions.length 
      : 0;

    await loan.save();

    res.json({ 
      success: true, 
      message: 'Call answered event recorded',
      duration_seconds 
    });
  } catch (error) {
    console.error('Call answered webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Call not answered webhook
router.post('/missed', async (req, res) => {
  try {
    const { loan_id, timestamp } = req.body;

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const callInteractions = loan.interactionHistory.filter(i => i.channel === 'call');
    const interaction = callInteractions[callInteractions.length - 1];

    if (interaction && interaction.sentAt) {
      interaction.status = 'failed';
    }

    // Recalculate response rate
    const answeredInteractions = callInteractions.filter(i => i.respondedAt);
    loan.contactProfile.responseRate = callInteractions.length > 0 
      ? answeredInteractions.length / callInteractions.length 
      : 0;

    await loan.save();

    res.json({ success: true, message: 'Call missed event recorded' });
  } catch (error) {
    console.error('Call missed webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
