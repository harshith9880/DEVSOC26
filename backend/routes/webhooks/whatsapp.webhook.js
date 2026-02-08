const express = require('express');
const router = express.Router();
const Loan = require('../../models/Loan');

// WhatsApp message sent
router.post('/sent', async (req, res) => {
  try {
    const { loan_id, timestamp, tone } = req.body;

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    loan.contactProfile.lastContactAt = new Date(timestamp);
    if (!loan.contactProfile.contactChannels.includes('whatsapp')) {
      loan.contactProfile.contactChannels.push('whatsapp');
    }
    if (tone) {
      loan.contactProfile.tone = tone;
    }
    loan.contactProfile.currentContactFreq += 1;

    if (!loan.interactionHistory) {
      loan.interactionHistory = [];
    }
    loan.interactionHistory.push({
      channel: 'whatsapp',
      sentAt: new Date(timestamp),
      tone: tone || 'informational',
      status: 'sent'
    });

    await loan.save();

    res.json({ success: true, message: 'WhatsApp sent event recorded' });
  } catch (error) {
    console.error('WhatsApp sent webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// WhatsApp message delivered
router.post('/delivered', async (req, res) => {
  try {
    const { loan_id, timestamp } = req.body;

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const whatsappInteractions = loan.interactionHistory.filter(i => i.channel === 'whatsapp');
    const interaction = whatsappInteractions[whatsappInteractions.length - 1];

    if (interaction && interaction.sentAt) {
      interaction.deliveredAt = new Date(timestamp);
      interaction.status = 'delivered';
    }

    await loan.save();

    res.json({ success: true, message: 'WhatsApp delivered event recorded' });
  } catch (error) {
    console.error('WhatsApp delivered webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// WhatsApp message read/clicked
router.post('/read', async (req, res) => {
  try {
    const { loan_id, timestamp } = req.body;

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    loan.contactProfile.lastResponseAt = new Date(timestamp);

    const whatsappInteractions = loan.interactionHistory.filter(i => i.channel === 'whatsapp');
    const interaction = whatsappInteractions[whatsappInteractions.length - 1];

    if (interaction && interaction.sentAt) {
      interaction.openedAt = new Date(timestamp);
      interaction.status = 'opened';

      const delayMs = new Date(timestamp) - new Date(interaction.sentAt);
      loan.contactProfile.delayTimeMs = delayMs;
    }

    // Recalculate response rate
    const readInteractions = whatsappInteractions.filter(i => i.openedAt || i.respondedAt);
    loan.contactProfile.responseRate = whatsappInteractions.length > 0 
      ? readInteractions.length / whatsappInteractions.length 
      : 0;

    await loan.save();

    res.json({ success: true, message: 'WhatsApp read event recorded' });
  } catch (error) {
    console.error('WhatsApp read webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// WhatsApp customer reply
router.post('/replied', async (req, res) => {
  try {
    const { loan_id, timestamp, message } = req.body;

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    loan.contactProfile.lastResponseAt = new Date(timestamp);

    const whatsappInteractions = loan.interactionHistory.filter(i => i.channel === 'whatsapp');
    const interaction = whatsappInteractions[whatsappInteractions.length - 1];

    if (interaction && interaction.sentAt) {
      interaction.respondedAt = new Date(timestamp);
      interaction.status = 'responded';

      const delayMs = new Date(timestamp) - new Date(interaction.sentAt);
      loan.contactProfile.delayTimeMs = delayMs;
    }

    // Recalculate response rate
    const repliedInteractions = whatsappInteractions.filter(i => i.respondedAt);
    loan.contactProfile.responseRate = whatsappInteractions.length > 0 
      ? repliedInteractions.length / whatsappInteractions.length 
      : 0;

    await loan.save();

    res.json({ success: true, message: 'WhatsApp reply event recorded' });
  } catch (error) {
    console.error('WhatsApp reply webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
