const express = require('express');
const router = express.Router();
const Loan = require('../../models/Loan');

// Email sent webhook
router.post('/sent', async (req, res) => {
  try {
    const { loan_id, timestamp, tone } = req.body;

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Update contact profile
    loan.contactProfile.lastContactAt = new Date(timestamp);
    if (!loan.contactProfile.contactChannels.includes('email')) {
      loan.contactProfile.contactChannels.push('email');
    }
    if (tone) {
      loan.contactProfile.tone = tone;
    }
    loan.contactProfile.currentContactFreq += 1;

    // Add to interaction history
    if (!loan.interactionHistory) {
      loan.interactionHistory = [];
    }
    loan.interactionHistory.push({
      channel: 'email',
      sentAt: new Date(timestamp),
      tone: tone || 'informational',
      status: 'sent'
    });

    await loan.save();

    res.json({ success: true, message: 'Email sent event recorded' });
  } catch (error) {
    console.error('Email sent webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Email opened webhook
router.post('/opened', async (req, res) => {
  try {
    const { loan_id, timestamp } = req.body;

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const interaction = loan.interactionHistory[loan.interactionHistory.length - 1];
    if (interaction && interaction.channel === 'email') {
      interaction.openedAt = new Date(timestamp);
      interaction.status = 'opened';
    }

    await loan.save();

    res.json({ success: true, message: 'Email opened event recorded' });
  } catch (error) {
    console.error('Email opened webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Email clicked webhook
router.post('/clicked', async (req, res) => {
  try {
    const { loan_id, timestamp } = req.body;

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    loan.contactProfile.lastResponseAt = new Date(timestamp);

    const interaction = loan.interactionHistory
      .reverse()
      .find(i => i.channel === 'email' && i.sentAt);

    if (interaction) {
      interaction.clickedAt = new Date(timestamp);
      interaction.status = 'clicked';

      const delayMs = new Date(timestamp) - new Date(interaction.sentAt);
      loan.contactProfile.delayTimeMs = delayMs;
    }

    // Recalculate response rate
    const emailInteractions = loan.interactionHistory.filter(i => i.channel === 'email');
    const clickedInteractions = emailInteractions.filter(i => i.clickedAt || i.respondedAt);
    loan.contactProfile.responseRate = emailInteractions.length > 0 
      ? clickedInteractions.length / emailInteractions.length 
      : 0;

    await loan.save();

    res.json({ success: true, message: 'Email clicked event recorded' });
  } catch (error) {
    console.error('Email clicked webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
