const express = require('express');
const router = express.Router();
const mcpController = require('../controllers/mcp.controller');

/**
 * MCP (Model Context Protocol) Routes
 * Used by AI agents to get intelligence and track engagement
 */

// ========== RECOMMENDATION ENDPOINTS ==========

/**
 * GET /api/mcp/recommendation/:loan_id
 * Get intelligent recommendation for a specific customer
 * 
 * Returns:
 * - What channel to use
 * - What tone to use
 * - Message template
 * - Optimal timing
 * - Whether can send now
 */
router.get('/recommendation/:loan_id', mcpController.getRecommendation);

router.get('/metrics', mcpController.getMetrics);
/**
 * POST /api/mcp/recommendations/batch
 * Get recommendations for multiple customers at once
 * 
 * Body:
 * {
 *   "loan_ids": ["LOAN_001", "LOAN_002"],  // optional
 *   "limit": 50,                            // optional, default 50
 *   "priority_filter": 3                    // optional, min priority level
 * }
 */
router.post('/recommendations/batch', mcpController.getBatchRecommendations);

// ========== MESSAGE TRACKING ENDPOINTS ==========

/**
 * POST /api/mcp/message/sent
 * Register that AI agent sent a message
 * This triggers webhooks and starts tracking engagement
 * 
 * Body:
 * {
 *   "loan_id": "LOAN_001",
 *   "channel": "email",
 *   "message_id": "msg_abc123",
 *   "message_content": "Hi John, your EMI...",
 *   "tone": "informational",
 *   "sent_by_agent": "gpt-4-agent-1",
 *   "ai_model": "gpt-4",
 *   "scheduled_at": "2026-02-09T10:00:00Z"  // optional
 * }
 */
router.post('/message/sent', mcpController.registerMessageSent);

/**
 * GET /api/mcp/feedback/:loan_id/:message_id
 * Get feedback on a specific message
 * Shows engagement metrics and learnings for AI to improve
 * 
 * Returns:
 * - Was opened/clicked/responded
 * - Response time
 * - What worked
 * - Next best action
 * - Best practices learned
 */
router.get('/feedback/:loan_id/:message_id', mcpController.getFeedback);

router.get('/agent/logs', mcpController.getAgentLogs);
router.post('/agent/trigger', mcpController.triggerCollection);


// ========== QUICK ACCESS ENDPOINTS ==========

/**
 * GET /api/mcp/customer/:loan_id
 * Get complete customer profile with intelligence
 */
router.get('/customer/:loan_id', async (req, res) => {
  try {
    const Loan = require('../models/Loan');
    const RepaymentIntelligence = require('../services/repaymentIntelligence');

    const loan = await Loan.findOne({ id: req.params.loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const intelligence = new RepaymentIntelligence(loan);
    const feedback = await intelligence.analyze();

    res.json({
      success: true,
      customer: {
        loan_id: loan.id,
        name: loan.customer_contact?.name,
        email: loan.customer_contact?.email,
        phone: loan.customer_contact?.phone,
        loan_amount_left: loan.contactProfile?.loanAmountLeft,
        response_rate: loan.contactProfile?.responseRate,
        contact_count: loan.contactProfile?.currentContactFreq,
        last_contact: loan.contactProfile?.lastContactAt,
        last_response: loan.contactProfile?.lastResponseAt
      },
      intelligence: {
        persona: feedback.repayment_persona,
        confidence: feedback.confidence,
        risk_score: feedback.analytics?.default_risk_score,
        engagement_score: feedback.analytics?.engagement_score,
        max_intensity: feedback.max_intensity_level
      },
      interaction_count: loan.interactionHistory?.length || 0
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/mcp/stats
 * Get overall system statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const Loan = require('../models/Loan');

    const totalLoans = await Loan.countDocuments();
    const activeLoans = await Loan.countDocuments({ 
      'contactProfile.loanAmountLeft': { $gt: 0 } 
    });

    const highRiskLoans = await Loan.countDocuments({
      'FeedbackOutput.repayment_persona': { 
        $in: ['HIGH_RISK_NON_RESPONSIVE', 'ZERO_CONTACT'] 
      }
    });

    const canContactNow = await Loan.countDocuments({
      'contactProfile.loanAmountLeft': { $gt: 0 },
      'contactProfile.currentContactFreq': { $lt: 15 }
    });

    // Calculate total outstanding
    const outstandingResult = await Loan.aggregate([
      { $match: { 'contactProfile.loanAmountLeft': { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$contactProfile.loanAmountLeft' } } }
    ]);

    res.json({
      success: true,
      stats: {
        total_loans: totalLoans,
        active_loans: activeLoans,
        high_risk_loans: highRiskLoans,
        can_contact_now: canContactNow,
        total_outstanding: outstandingResult[0]?.total || 0
      },
      timestamp: new Date()
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/mcp/health
 * Health check for MCP endpoints
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'MCP API',
    status: 'operational',
    version: '1.0.0',
    timestamp: new Date(),
    endpoints: {
      recommendation: 'GET /api/mcp/recommendation/:loan_id',
      batch: 'POST /api/mcp/recommendations/batch',
      register_message: 'POST /api/mcp/message/sent',
      feedback: 'GET /api/mcp/feedback/:loan_id/:message_id',
      customer: 'GET /api/mcp/customer/:loan_id',
      stats: 'GET /api/mcp/stats'
    }
  });
});

module.exports = router;
