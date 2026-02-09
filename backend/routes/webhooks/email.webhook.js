const express = require('express');
const router = express.Router();
const Loan = require('../../models/Loan');
const { getEventPublisher } = require('../../utils/eventPublisher');

const eventPublisher = getEventPublisher();

/**
 * Email sent webhook
 * Called when an email is sent to a customer
 */
router.post('/sent', async (req, res) => {
  try {
    const { loan_id, timestamp, tone, metadata } = req.body;

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Update contact profile
    if (!loan.contactProfile) {
      loan.contactProfile = {};
    }
    loan.contactProfile.lastContactAt = new Date(timestamp || Date.now());
    
    if (!loan.contactProfile.contactChannels) {
      loan.contactProfile.contactChannels = [];
    }
    if (!loan.contactProfile.contactChannels.includes('email')) {
      loan.contactProfile.contactChannels.push('email');
    }
    
    if (tone) {
      loan.contactProfile.tone = tone;
    }
    loan.contactProfile.currentContactFreq = (loan.contactProfile.currentContactFreq || 0) + 1;

    // Add to interaction history
    loan.addInteraction({
      channel: 'email',
      sentAt: new Date(timestamp || Date.now()),
      tone: tone || 'informational',
      status: 'sent',
      message_id: metadata?.message_id,
      ai_generated: metadata?.sent_by === 'ai_agent',
      ai_model: metadata?.ai_model,
      sent_by_agent: metadata?.agent_name
    });

    await loan.save();

    // Publish event to Redis for AI agents
    // This does NOT trigger immediate re-analysis (email sent is not a customer action)
    // But it's tracked for future reference
    await eventPublisher.publish('EMAIL_SENT', {
      loan_id,
      timestamp: timestamp || new Date().toISOString(),
      tone: tone || 'informational',
      metadata: metadata || {}
    }, {
      webhook_name: 'email.sent'
    });

    res.json({
      success: true,
      message: 'Email sent event recorded',
      contact_frequency: loan.contactProfile.currentContactFreq
    });

  } catch (error) {
    console.error('Email sent webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Email opened webhook
 * Called when a customer opens an email
 * This triggers DATA_COLLECTED event for Agent 1
 */
router.post('/opened', async (req, res) => {
  try {
    const { loan_id, timestamp, message_id } = req.body;

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Find the most recent email interaction or one with matching message_id
    let interaction;
    if (message_id) {
      interaction = loan.interactionHistory.find(i => i.message_id === message_id);
    } else {
      interaction = loan.interactionHistory
        .filter(i => i.channel === 'email')
        .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))[0];
    }

    if (interaction) {
      interaction.openedAt = new Date(timestamp || Date.now());
      interaction.status = 'opened';
    }

    await loan.save();

    // ✅ IMPORTANT: Publish to Redis to notify AI agents
    // This triggers Agent 1 (Data Collector) which decides if re-analysis is needed
    await eventPublisher.publish('EMAIL_OPENED', {
      loan_id,
      channel: 'email',
      response_type: 'opened',
      timestamp: timestamp || new Date().toISOString(),
      message_id: message_id
    }, {
      webhook_name: 'email.opened'
    });

    res.json({
      success: true,
      message: 'Email opened event recorded and published',
      interaction_updated: !!interaction
    });

  } catch (error) {
    console.error('Email opened webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Email clicked webhook
 * Called when a customer clicks a link in an email
 * This is HIGH engagement - triggers DATA_COLLECTED event
 */
router.post('/clicked', async (req, res) => {
  try {
    const { loan_id, timestamp, message_id, link_clicked } = req.body;

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Update last response time
    if (!loan.contactProfile) {
      loan.contactProfile = {};
    }
    loan.contactProfile.lastResponseAt = new Date(timestamp || Date.now());

    // Find the interaction
    let interaction;
    if (message_id) {
      interaction = loan.interactionHistory.find(i => i.message_id === message_id);
    } else {
      interaction = loan.interactionHistory
        .filter(i => i.channel === 'email')
        .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))[0];
    }

    if (interaction) {
      interaction.clickedAt = new Date(timestamp || Date.now());
      interaction.status = 'clicked';

      // Calculate response time
      if (interaction.sentAt) {
        const delayMs = new Date(timestamp || Date.now()) - new Date(interaction.sentAt);
        loan.contactProfile.delayTimeMs = delayMs;
      }
    }

    await loan.save();

    // ✅ CRITICAL: Publish to Redis
    // Clicked = HIGH engagement, should trigger re-analysis
    await eventPublisher.publish('EMAIL_CLICKED', {
      loan_id,
      channel: 'email',
      response_type: 'clicked',
      timestamp: timestamp || new Date().toISOString(),
      message_id: message_id,
      link_clicked: link_clicked
    }, {
      webhook_name: 'email.clicked'
    });

    res.json({
      success: true,
      message: 'Email clicked event recorded and published',
      response_rate: loan.contactProfile.responseRate
    });

  } catch (error) {
    console.error('Email clicked webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Email replied webhook
 * Called when a customer replies to an email
 * This is VERY HIGH engagement - triggers DATA_COLLECTED event
 */
router.post('/replied', async (req, res) => {
  try {
    const { loan_id, timestamp, message_id, reply_content } = req.body;

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Update response tracking
    if (!loan.contactProfile) {
      loan.contactProfile = {};
    }
    loan.contactProfile.lastResponseAt = new Date(timestamp || Date.now());

    // Find and update interaction
    let interaction;
    if (message_id) {
      interaction = loan.interactionHistory.find(i => i.message_id === message_id);
    } else {
      interaction = loan.interactionHistory
        .filter(i => i.channel === 'email')
        .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))[0];
    }

    if (interaction) {
      interaction.respondedAt = new Date(timestamp || Date.now());
      interaction.status = 'responded';
    }

    await loan.save();

    // ✅ CRITICAL: Publish to Redis
    // Replied = HIGHEST engagement, ALWAYS trigger re-analysis
    await eventPublisher.publish('CUSTOMER_RESPONDED', {
      loan_id,
      channel: 'email',
      response_type: 'replied',
      timestamp: timestamp || new Date().toISOString(),
      message_id: message_id,
      reply_content: reply_content  // May want to analyze sentiment later
    }, {
      webhook_name: 'email.replied'
    });

    res.json({
      success: true,
      message: 'Email reply event recorded and published',
      response_rate: loan.contactProfile.responseRate
    });

  } catch (error) {
    console.error('Email replied webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;