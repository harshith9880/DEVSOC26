const express = require('express');
const router = express.Router();
const Loan = require('../../models/Loan');

// SMS sent webhook
router.post('/sent', async (req, res) => {
  try {
    const { loan_id, timestamp, tone } = req.body;

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    loan.contactProfile.lastContactAt = new Date(timestamp);
    if (!loan.contactProfile.contactChannels.includes('sms')) {
      loan.contactProfile.contactChannels.push('sms');
    }
    if (tone) {
      loan.contactProfile.tone = tone;
    }
    loan.contactProfile.currentContactFreq += 1;

    if (!loan.interactionHistory) {
      loan.interactionHistory = [];
    }
    loan.interactionHistory.push({
      channel: 'sms',
      sentAt: new Date(timestamp),
      tone: tone || 'informational',
      status: 'sent'
    });

    await loan.save();

    res.json({ success: true, message: 'SMS sent event recorded' });
  } catch (error) {
    console.error('SMS sent webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// SMS delivered webhook
router.post('/delivered', async (req, res) => {
  try {
    const { loan_id, timestamp } = req.body;

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const interaction = loan.interactionHistory[loan.interactionHistory.length - 1];
    if (interaction && interaction.channel === 'sms') {
      interaction.deliveredAt = new Date(timestamp);
      interaction.status = 'delivered';
    }

    await loan.save();

    res.json({ success: true, message: 'SMS delivered event recorded' });
  } catch (error) {
    console.error('SMS delivered webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// SMS link clicked webhook
router.post('/clicked', async (req, res) => {
  try {
    const { loan_id, timestamp } = req.body;

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    loan.contactProfile.lastResponseAt = new Date(timestamp);

    // Find the latest SMS interaction
    const smsInteractions = loan.interactionHistory.filter(i => i.channel === 'sms');
    const interaction = smsInteractions[smsInteractions.length - 1];

    if (interaction && interaction.sentAt) {
      interaction.clickedAt = new Date(timestamp);
      interaction.status = 'clicked';

      const delayMs = new Date(timestamp) - new Date(interaction.sentAt);
      loan.contactProfile.delayTimeMs = delayMs;
    }

    // Recalculate response rate
    const clickedInteractions = smsInteractions.filter(i => i.clickedAt || i.respondedAt);
    loan.contactProfile.responseRate = smsInteractions.length > 0 
      ? clickedInteractions.length / smsInteractions.length 
      : 0;

    await loan.save();

    res.json({ success: true, message: 'SMS clicked event recorded' });
  } catch (error) {
    console.error('SMS clicked webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
