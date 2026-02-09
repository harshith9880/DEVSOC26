const Loan = require('../models/Loan');
const RepaymentIntelligence = require('../services/repaymentIntelligence');
const FeedbackHistory = require('../models/FeedbackHistory');

class MCPController {
  /**
   * Get AI recommendation for a customer
   * Called by: MCP Agent before sending message
   */
  async getRecommendation(req, res) {
    try {
      const { loan_id } = req.params;

      const loan = await Loan.findOne({ id: loan_id });
      if (!loan) {
        return res.status(404).json({ error: 'Loan not found' });
      }

      // Run intelligence
      const intelligence = new RepaymentIntelligence(loan);
      const feedback = await intelligence.analyze();
      const nextAction = intelligence.getNextBestAction(feedback);

      // Check timing
      const optimalTiming = this.getOptimalTiming(loan.contactProfile);
      const canSendNow = this.canSendNow(loan.contactProfile, optimalTiming);

      // Build response
      const recommendation = {
        loan_id: loan.id,
        customer: {
          name: loan.customer_contact?.name,
          email: loan.customer_contact?.email,
          phone: loan.customer_contact?.phone
        },
        
        // What to send
        recommended_channel: nextAction.channel,
        recommended_tone: nextAction.tone,
        message_template: this.getMessageTemplate(nextAction.channel, nextAction.tone, loan),
        
        // When to send
        optimal_timing: optimalTiming,
        can_send_now: canSendNow,
        suggested_send_time: this.getSuggestedSendTime(loan),
        
        // How often
        max_intensity: feedback.max_intensity_level,
        current_contact_count: loan.contactProfile?.currentContactFreq || 0,
        should_wait: loan.contactProfile?.currentContactFreq > 15,
        wait_hours: this.calculateWaitHours(loan.contactProfile),
        
        // Context
        persona: feedback.repayment_persona,
        confidence: feedback.confidence,
        risk_score: feedback.analytics?.default_risk_score,
        engagement_score: feedback.analytics?.engagement_score,
        
        // Alternatives
        alternative_strategies: feedback.recommended_strategies.slice(1).map(s => ({
          channel: s.channel,
          tone: s.tone,
          frequency: s.frequency,
          priority: s.priority
        }))
      };

      res.json({
        success: true,
        recommendation,
        metadata: {
          generated_at: new Date(),
          valid_for_minutes: 60,
          api_version: '1.0'
        }
      });

    } catch (error) {
      console.error('MCP recommendation error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  /**
   * Register message sent by AI agent
   * Triggers webhook to track engagement
   */
  async registerMessageSent(req, res) {
    try {
      const {
        loan_id,
        channel,
        message_id,
        message_content,
        tone,
        sent_by_agent,
        scheduled_at,
        ai_model
      } = req.body;

      if (!loan_id || !channel || !message_id) {
        return res.status(400).json({ 
          error: 'Missing required fields: loan_id, channel, message_id' 
        });
      }

      // Update loan with message metadata
      const loan = await Loan.findOne({ id: loan_id });
      if (!loan) {
        return res.status(404).json({ error: 'Loan not found' });
      }

      // Trigger webhook internally
      const axios = require('axios');
      const webhookUrl = `http://localhost:${process.env.PORT || 5000}/api/webhooks/${channel}/sent`;
      
      await axios.post(webhookUrl, {
        loan_id,
        timestamp: new Date().toISOString(),
        tone: tone || 'informational',
        metadata: {
          message_id,
          sent_by: 'ai_agent',
          agent_name: sent_by_agent,
          ai_model: ai_model || 'gpt-4',
          scheduled_at
        }
      });

      // Store in interaction history with message_id
      if (!loan.interactionHistory) {
        loan.interactionHistory = [];
      }

      const lastInteraction = loan.interactionHistory[loan.interactionHistory.length - 1];
      if (lastInteraction) {
        lastInteraction.message_id = message_id;
        lastInteraction.message_content = message_content;
        lastInteraction.ai_generated = true;
        lastInteraction.ai_model = ai_model;
      }

      await loan.save();

      res.json({
        success: true,
        message: 'Message registered and webhook triggered',
        tracking: {
          loan_id,
          message_id,
          channel,
          webhook_triggered: true,
          will_track_engagement: true,
          tracking_url: `/api/mcp/feedback/${loan_id}/${message_id}`
        }
      });

    } catch (error) {
      console.error('Register message error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  /**
   * Get feedback after customer engagement
   * AI agent learns from this
   */
  async getFeedback(req, res) {
    try {
      const { loan_id, message_id } = req.params;

      const loan = await Loan.findOne({ id: loan_id });
      if (!loan) {
        return res.status(404).json({ error: 'Loan not found' });
      }

      // Find the specific interaction
      const interaction = loan.interactionHistory?.find(
        i => i.message_id === message_id
      );

      if (!interaction) {
        return res.status(404).json({ 
          error: 'Interaction not found',
          message: 'Message may not have been registered or tracked yet'
        });
      }

      // Re-analyze with updated data
      const intelligence = new RepaymentIntelligence(loan);
      const feedback = await intelligence.analyze();

      // Calculate engagement metrics
      const engagement_metrics = {
        was_sent: !!interaction.sentAt,
        was_delivered: !!interaction.deliveredAt,
        was_opened: !!interaction.openedAt,
        was_clicked: !!interaction.clickedAt,
        was_responded: !!interaction.respondedAt,
        
        delivery_time_seconds: interaction.deliveredAt 
          ? (new Date(interaction.deliveredAt) - new Date(interaction.sentAt)) / 1000
          : null,
        
        open_time_seconds: interaction.openedAt
          ? (new Date(interaction.openedAt) - new Date(interaction.sentAt)) / 1000
          : null,
        
        response_time_seconds: interaction.respondedAt 
          ? (new Date(interaction.respondedAt) - new Date(interaction.sentAt)) / 1000
          : null,
        
        updated_response_rate: loan.contactProfile?.responseRate,
        engagement_improved: this.didEngagementImprove(loan)
      };

      // Analyze what worked
      const learnings = {
        channel_performance: {
          channel: interaction.channel,
          was_effective: !!interaction.openedAt || !!interaction.clickedAt,
          resulted_in_response: !!interaction.respondedAt
        },
        
        tone_performance: {
          tone_used: interaction.tone,
          was_appropriate: !!interaction.respondedAt,
          engagement_rate: engagement_metrics.was_opened ? 1 : 0
        },
        
        timing_analysis: {
          sent_at_hour: new Date(interaction.sentAt).getHours(),
          was_optimal: this.wasTimingOptimal(interaction, loan),
          best_time: this.getBestContactTime(loan.interactionHistory)
        },
        
        persona_evolution: {
          before: feedback.repayment_persona, // Current after update
          changed: true, // You'd track previous persona
          confidence_delta: 0 // Calculate difference
        }
      };

      // Get next recommendation
      const nextAction = intelligence.getNextBestAction(feedback);

      res.json({
        success: true,
        feedback: {
          loan_id,
          message_id,
          engagement_metrics,
          learnings,
          
          // Updated intelligence
          current_persona: feedback.repayment_persona,
          confidence: feedback.confidence,
          risk_score: feedback.analytics?.default_risk_score,
          engagement_score: feedback.analytics?.engagement_score,
          
          // Next steps
          next_recommendation: {
            channel: nextAction.channel,
            tone: nextAction.tone,
            message: nextAction.message,
            suggested_wait_hours: this.calculateWaitHours(loan.contactProfile)
          },
          
          // Best practices learned
          best_practices: {
            best_channel: this.getBestChannel(loan.interactionHistory),
            best_time: this.getBestContactTime(loan.interactionHistory),
            best_tone: this.getBestTone(loan.interactionHistory),
            avg_response_time: this.getAvgResponseTime(loan.interactionHistory)
          }
        },
        metadata: {
          generated_at: new Date(),
          interaction_count: loan.interactionHistory?.length || 0
        }
      });

    } catch (error) {
      console.error('Get feedback error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  /**
   * Batch recommendations for managing multiple customers
   */
  async getBatchRecommendations(req, res) {
    try {
      const { loan_ids, limit = 50, priority_filter } = req.body;

      let query = {};
      if (loan_ids) {
        query.id = { $in: loan_ids };
      } else {
        query['contactProfile.loanAmountLeft'] = { $gt: 0 };
      }

      const loans = await Loan.find(query).limit(parseInt(limit));

      const recommendations = [];

      for (const loan of loans) {
        try {
          const intelligence = new RepaymentIntelligence(loan);
          const feedback = await intelligence.analyze();
          const nextAction = intelligence.getNextBestAction(feedback);
          const priority = this.calculatePriority(feedback, loan);

          // Apply priority filter if specified
          if (priority_filter && priority < priority_filter) {
            continue;
          }

          const optimalTiming = this.getOptimalTiming(loan.contactProfile);

          recommendations.push({
            loan_id: loan.id,
            customer_name: loan.customer_contact?.name,
            customer_phone: loan.customer_contact?.phone,
            customer_email: loan.customer_contact?.email,
            
            priority,
            urgency_level: this.getUrgencyLevel(priority),
            
            recommended_channel: nextAction.channel,
            recommended_tone: nextAction.tone,
            message_template: this.getMessageTemplate(nextAction.channel, nextAction.tone, loan),
            
            can_send_now: this.canSendNow(loan.contactProfile, optimalTiming),
            suggested_send_time: this.getSuggestedSendTime(loan),
            
            risk_score: feedback.analytics?.default_risk_score,
            engagement_score: feedback.analytics?.engagement_score,
            persona: feedback.repayment_persona,
            confidence: feedback.confidence,
            
            loan_amount_left: loan.contactProfile?.loanAmountLeft,
            current_contact_count: loan.contactProfile?.currentContactFreq || 0
          });

        } catch (error) {
          console.error(`Error processing loan ${loan.id}:`, error.message);
        }
      }

      // Sort by priority (highest first)
      recommendations.sort((a, b) => b.priority - a.priority);

      res.json({
        success: true,
        total: recommendations.length,
        recommendations,
        summary: {
          high_priority: recommendations.filter(r => r.priority >= 4).length,
          medium_priority: recommendations.filter(r => r.priority === 3).length,
          low_priority: recommendations.filter(r => r.priority <= 2).length,
          can_send_now: recommendations.filter(r => r.can_send_now).length,
          total_outstanding: recommendations.reduce((sum, r) => sum + (r.loan_amount_left || 0), 0)
        },
        metadata: {
          generated_at: new Date(),
          limit_applied: limit,
          priority_filter_applied: priority_filter || 'none'
        }
      });

    } catch (error) {
      console.error('Batch recommendations error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // ========== HELPER METHODS ==========

  getOptimalTiming(contactProfile) {
    const now = new Date();
    const currentHour = now.getHours();

    const timeRange = contactProfile?.contactTimeRange;
    
    if (timeRange) {
      const startHour = new Date(timeRange.start).getHours();
      const endHour = new Date(timeRange.end).getHours();
      
      return {
        preferred_hours: { start: startHour, end: endHour },
        current_hour: currentHour,
        in_preferred_window: currentHour >= startHour && currentHour <= endHour,
        timezone: 'Asia/Kolkata'
      };
    }

    return {
      preferred_hours: { start: 9, end: 18 },
      current_hour: currentHour,
      in_preferred_window: currentHour >= 9 && currentHour <= 18,
      timezone: 'Asia/Kolkata'
    };
  }

  canSendNow(contactProfile, optimalTiming) {
    const recentContactCount = contactProfile?.currentContactFreq || 0;
    const inPreferredWindow = optimalTiming?.in_preferred_window !== false;
    const lastContactAt = contactProfile?.lastContactAt;
    
    // Check minimum gap (1 hour)
    let minimumGapMet = true;
    if (lastContactAt) {
      const hoursSinceLastContact = (new Date() - new Date(lastContactAt)) / (1000 * 60 * 60);
      minimumGapMet = hoursSinceLastContact >= 1;
    }
    
    return recentContactCount < 15 && inPreferredWindow && minimumGapMet;
  }

  getSuggestedSendTime(loan) {
    const bestTime = this.getBestContactTime(loan.interactionHistory);
    const today = new Date();
    
    const suggestedTime = new Date(today);
    suggestedTime.setHours(bestTime.hour, 0, 0, 0);
    
    // If suggested time has passed, schedule for tomorrow
    if (suggestedTime < new Date()) {
      suggestedTime.setDate(suggestedTime.getDate() + 1);
    }
    
    return {
      datetime: suggestedTime.toISOString(),
      hour: bestTime.hour,
      confidence: bestTime.confidence,
      timezone: 'Asia/Kolkata'
    };
  }

  calculateWaitHours(contactProfile) {
    const currentFreq = contactProfile?.currentContactFreq || 0;
    
    if (currentFreq < 5) return 24; // 1 day
    if (currentFreq < 10) return 48; // 2 days
    if (currentFreq < 15) return 72; // 3 days
    return 168; // 1 week
  }

  getMessageTemplate(channel, tone, loan) {
    const name = loan.customer_contact?.name || 'Customer';
    const amount = loan.contactProfile?.loanAmountLeft || 0;
    const formattedAmount = `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

    const templates = {
      email: {
        informational: {
          subject: `EMI Payment Reminder - ${formattedAmount}`,
          body: `Dear ${name},\n\nThis is a gentle reminder that your EMI payment of ${formattedAmount} is due. Please make the payment at your earliest convenience to maintain your good credit standing.\n\nBest regards,\nLoan Management Team`
        },
        empathetic: {
          subject: `We're Here to Help - EMI Reminder`,
          body: `Dear ${name},\n\nWe understand that managing finances can sometimes be challenging. Your EMI payment of ${formattedAmount} is pending, and we're here to help you with any concerns or payment arrangements.\n\nPlease feel free to reach out to us.\n\nWarm regards,\nLoan Management Team`
        },
        supportive: {
          subject: `Great Progress! - Payment Reminder`,
          body: `Dear ${name},\n\nYou've been doing great with your repayments! Just a friendly reminder about your upcoming EMI of ${formattedAmount}.\n\nThank you for being a valued customer.\n\nBest regards,\nLoan Management Team`
        },
        urgent: {
          subject: `URGENT: Immediate Action Required - EMI ${formattedAmount}`,
          body: `Dear ${name},\n\nThis is an urgent reminder regarding your overdue EMI payment of ${formattedAmount}. Immediate action is required to avoid late fees and impact on your credit score.\n\nPlease contact us immediately.\n\nLoan Management Team`
        }
      },
      sms: {
        informational: `Hi ${name}, your EMI of ${formattedAmount} is due. Please pay to avoid penalties. Pay now: [LINK]`,
        empathetic: `Hi ${name}, we understand finances can be tough. Your EMI ${formattedAmount} is pending. We're here to help: [LINK]`,
        supportive: `${name}, you're doing great! Just a reminder: EMI ${formattedAmount} due soon. Pay now: [LINK]`,
        urgent: `URGENT ${name}: EMI ${formattedAmount} OVERDUE. Pay NOW to avoid legal action: [LINK]`
      },
      whatsapp: {
        informational: `Hello ${name} 👋\n\nYour EMI payment of ${formattedAmount} is due.\n\n💳 Pay now to avoid penalties\n\nClick here to pay: [LINK]`,
        empathetic: `Hello ${name} 👋\n\nWe understand managing finances can be challenging. Your EMI of ${formattedAmount} is pending.\n\n💙 We're here to help\n\nLet's discuss: [LINK]`,
        supportive: `Hello ${name} 👋\n\nYou're doing amazing! 🎉\n\nJust a friendly reminder about your EMI payment of ${formattedAmount}.\n\nPay now: [LINK]`,
        urgent: `⚠️ URGENT ${name}\n\nYour EMI ${formattedAmount} is OVERDUE\n\n🚨 Immediate action required\n\nPay now: [LINK]`
      },
      call: {
        informational: `Script: Greet customer, remind about EMI ${formattedAmount}, offer payment options`,
        empathetic: `Script: Express understanding, discuss payment challenges, offer flexible arrangements`,
        supportive: `Script: Appreciate good payment history, gentle reminder about ${formattedAmount}`,
        urgent: `Script: Serious tone, emphasize urgency, discuss immediate payment or consequences`
      }
    };

    return templates[channel]?.[tone] || `Payment reminder for ${name}: ${formattedAmount}`;
  }

  calculatePriority(feedback, loan) {
    let priority = 0;
    
    // Persona-based priority
    const personaPriority = {
      'HIGH_RISK_NON_RESPONSIVE': 5,
      'ZERO_CONTACT': 5,
      'HIGH_RISK_RESPONSIVE': 4,
      'MEDIUM_RISK_INCONSISTENT': 3,
      'LOW_RISK_NON_RESPONSIVE': 2,
      'LOW_RISK_RESPONSIVE': 1,
      'UNKNOWN': 2
    };
    
    priority = personaPriority[feedback.repayment_persona] || 2;

    // Adjust for loan amount
    const loanAmount = loan.contactProfile?.loanAmountLeft || 0;
    if (loanAmount > 50000) priority = Math.min(priority + 1, 5);
    else if (loanAmount > 30000) priority = Math.min(priority + 0.5, 5);

    // Adjust for risk score
    if (feedback.analytics?.default_risk_score > 0.8) {
      priority = Math.min(priority + 1, 5);
    }

    // Adjust for contact frequency (reduce if over-contacted)
    const contactFreq = loan.contactProfile?.currentContactFreq || 0;
    if (contactFreq > 20) priority = Math.max(priority - 1, 1);

    return Math.round(priority);
  }

  getUrgencyLevel(priority) {
    if (priority >= 5) return 'CRITICAL';
    if (priority >= 4) return 'HIGH';
    if (priority >= 3) return 'MEDIUM';
    return 'LOW';
  }

  didEngagementImprove(loan) {
    const history = loan.interactionHistory || [];
    if (history.length < 2) return null;

    const recent = history.slice(-5);
    const older = history.length > 5 ? history.slice(-10, -5) : [];

    if (older.length === 0) return null;

    const recentEngagement = recent.filter(i => i.openedAt || i.clickedAt || i.respondedAt).length / recent.length;
    const olderEngagement = older.filter(i => i.openedAt || i.clickedAt || i.respondedAt).length / older.length;

    return recentEngagement > olderEngagement;
  }

  wasTimingOptimal(interaction, loan) {
    const sentHour = new Date(interaction.sentAt).getHours();
    const bestTime = this.getBestContactTime(loan.interactionHistory);
    
    return Math.abs(sentHour - bestTime.hour) <= 2; // Within 2 hours of optimal
  }

  getBestContactTime(interactionHistory = []) {
    const successfulInteractions = interactionHistory.filter(
      i => i.respondedAt || i.clickedAt || i.openedAt
    );
    
    if (successfulInteractions.length === 0) {
      return { hour: 10, confidence: 'low', sample_size: 0 };
    }

    const hours = successfulInteractions.map(i => new Date(i.sentAt).getHours());
    const avgHour = Math.round(hours.reduce((a, b) => a + b, 0) / hours.length);

    let confidence = 'low';
    if (successfulInteractions.length >= 10) confidence = 'high';
    else if (successfulInteractions.length >= 5) confidence = 'medium';

    return {
      hour: avgHour,
      confidence,
      sample_size: successfulInteractions.length
    };
  }

  getBestChannel(interactionHistory = []) {
    const channelStats = {};

    interactionHistory.forEach(i => {
      if (!channelStats[i.channel]) {
        channelStats[i.channel] = { sent: 0, responded: 0, engaged: 0 };
      }
      channelStats[i.channel].sent++;
      if (i.respondedAt) channelStats[i.channel].responded++;
      if (i.openedAt || i.clickedAt) channelStats[i.channel].engaged++;
    });

    let bestChannel = 'email';
    let bestRate = 0;

    Object.entries(channelStats).forEach(([channel, stats]) => {
      const rate = (stats.responded + stats.engaged * 0.5) / stats.sent;
      if (rate > bestRate && stats.sent >= 3) {
        bestRate = rate;
        bestChannel = channel;
      }
    });

    return {
      channel: bestChannel,
      response_rate: bestRate,
      confidence: channelStats[bestChannel]?.sent >= 5 ? 'high' : 'low',
      stats: channelStats[bestChannel]
    };
  }

  getBestTone(interactionHistory = []) {
    const toneStats = {};

    interactionHistory.forEach(i => {
      const tone = i.tone || 'informational';
      if (!toneStats[tone]) {
        toneStats[tone] = { sent: 0, responded: 0 };
      }
      toneStats[tone].sent++;
      if (i.respondedAt) toneStats[tone].responded++;
    });

    let bestTone = 'informational';
    let bestRate = 0;

    Object.entries(toneStats).forEach(([tone, stats]) => {
      const rate = stats.responded / stats.sent;
      if (rate > bestRate && stats.sent >= 2) {
        bestRate = rate;
        bestTone = tone;
      }
    });

    return {
      tone: bestTone,
      response_rate: bestRate,
      confidence: toneStats[bestTone]?.sent >= 5 ? 'high' : 'low'
    };
  }

  getAvgResponseTime(interactionHistory = []) {
    const responseTimes = interactionHistory
      .filter(i => i.respondedAt && i.sentAt)
      .map(i => (new Date(i.respondedAt) - new Date(i.sentAt)) / 1000);

    if (responseTimes.length === 0) {
      return { seconds: null, formatted: 'No data', sample_size: 0 };
    }

    const avgSeconds = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const hours = Math.floor(avgSeconds / 3600);
    const minutes = Math.floor((avgSeconds % 3600) / 60);

    return {
      seconds: avgSeconds,
      formatted: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
      sample_size: responseTimes.length
    };
  }
}

// Add this method
exports.getMetrics = async (req, res) => {
  try {
    const loans = await Loan.find();
    const feedbacks = await FeedbackHistory.find();
    
    const metrics = {
      total_customers: loans.length,
      total_outstanding: loans.reduce((sum, loan) => sum + loan.loan_amount_left, 0),
      collection_rate: 0.68, // Calculate from your logic
      messages_sent: feedbacks.length
    };
    
    res.json({ success: true, metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAgentLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    // Mock logs for now - implement actual logging later
    const logs = [
      {
        timestamp: new Date(),
        level: 'INFO',
        message: 'Agent running',
        details: 'Processing customers'
      }
    ];
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.triggerCollection = async (req, res) => {
  try {
    const batchSize = req.body.batch_size || 10;
    // Trigger your AI agent collection logic here
    res.json({ success: true, message: `Collection triggered for ${batchSize} customers` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


module.exports = new MCPController();
  mcp.controller.js