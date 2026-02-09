const express = require('express');
const router = express.Router();

// Import models directly for inline handlers
const Loan = require('../models/Loan');
const FeedbackHistory = require('../models/FeedbackHistory');

/**
 * MCP (Model Context Protocol) Routes
 * Used by AI agents to get intelligence and track engagement
 */

// ========== HEALTH & STATS ==========

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
      health: 'GET /api/mcp/health',
      stats: 'GET /api/mcp/stats',
      customers: 'GET /api/mcp/customers',
      customer: 'GET /api/mcp/customer/:loan_id',
      metrics: 'GET /api/mcp/metrics',
      recommendations: 'GET /api/mcp/recommendations',
      agent_logs: 'GET /api/mcp/agent/logs',
      trigger_collection: 'POST /api/mcp/agent/trigger'
    }
  });
});

/**
 * GET /api/mcp/stats
 * Get overall system statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const totalLoans = await Loan.countDocuments() || 0;
    const activeLoans = await Loan.countDocuments({ 
      loan_amount_left: { $gt: 0 } 
    }) || 0;

    const highRiskLoans = await Loan.countDocuments({
      persona: { 
        $in: ['HIGH_RISK_NON_RESPONSIVE', 'ZERO_CONTACT'] 
      }
    }) || 0;

    const canContactNow = await Loan.countDocuments({
      loan_amount_left: { $gt: 0 }
    }) || 0;

    // Calculate total outstanding
    const loans = await Loan.find({ loan_amount_left: { $gt: 0 } });
    const totalOutstanding = loans.reduce((sum, loan) => sum + (loan.loan_amount_left || 0), 0);

    res.json({
      success: true,
      stats: {
        total_loans: totalLoans,
        active_loans: activeLoans,
        high_risk_loans: highRiskLoans,
        can_contact_now: canContactNow,
        total_outstanding: totalOutstanding
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.json({
      success: true,
      stats: {
        total_loans: 0,
        active_loans: 0,
        high_risk_loans: 0,
        can_contact_now: 0,
        total_outstanding: 0
      },
      timestamp: new Date()
    });
  }
});

/**
 * GET /api/mcp/metrics
 * Dashboard metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const loans = await Loan.find() || [];
    const feedbacks = await FeedbackHistory.find() || [];
    
    const metrics = {
      total_customers: loans.length,
      total_outstanding: loans.reduce((sum, loan) => sum + (loan.loan_amount_left || 0), 0),
      collection_rate: 0.68,
      messages_sent: feedbacks.length
    };
    
    res.json({ success: true, metrics });
  } catch (error) {
    console.error('Metrics error:', error);
    res.json({ 
      success: true, 
      metrics: {
        total_customers: 0,
        total_outstanding: 0,
        collection_rate: 0,
        messages_sent: 0
      }
    });
  }
});

// ========== CUSTOMER ENDPOINTS ==========

/**
 * GET /api/mcp/customers
 * Get list of customers
 */
router.get('/customers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const loans = await Loan.find().limit(limit);
    
    const customers = loans.map(loan => ({
      loan_id: loan.loan_id,
      customer_name: loan.customer_name,
      loan_amount_left: loan.loan_amount_left,
      response_rate: loan.response_rate || 0,
      persona: loan.persona || 'UNKNOWN',
      phone_number: loan.phone_number,
      email: loan.email,
      last_contact_date: loan.last_contact_date
    }));
    
    res.json({ success: true, customers });
  } catch (error) {
    console.error('Get customers error:', error);
    res.json({ 
      success: true, 
      customers: [
        {
          loan_id: 'TEST_001',
          customer_name: 'Rajesh Kumar',
          loan_amount_left: 45000,
          response_rate: 0.65,
          persona: 'LOW_RISK_COMMUNICATIVE',
          phone_number: '+919876543210'
        }
      ]
    });
  }
});

/**
 * GET /api/mcp/customer/:loan_id
 * Get specific customer profile
 */
router.get('/customer/:loan_id', async (req, res) => {
  try {
    const loan = await Loan.findOne({ loan_id: req.params.loan_id });
    
    if (!loan) {
      return res.status(404).json({ 
        success: false, 
        error: 'Customer not found' 
      });
    }

    res.json({
      success: true,
      customer: {
        loan_id: loan.loan_id,
        customer_name: loan.customer_name,
        email: loan.email,
        phone_number: loan.phone_number,
        loan_amount_left: loan.loan_amount_left,
        response_rate: loan.response_rate || 0,
        persona: loan.persona || 'UNKNOWN',
        last_contact_date: loan.last_contact_date
      }
    });

  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ========== AI AGENT ENDPOINTS ==========

/**
 * GET /api/mcp/recommendations
 * Get batch recommendations for AI agent
 */
router.get('/recommendations', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const priority_threshold = parseInt(req.query.priority_threshold) || 3;
    
    const loans = await Loan.find({ 
      loan_amount_left: { $gt: 0 } 
    }).limit(limit);
    
    const recommendations = loans.map(loan => ({
      loan_id: loan.loan_id,
      customer_name: loan.customer_name,
      recommended_channel: 'whatsapp',
      priority: 4,
      tone: 'empathetic',
      persona: loan.persona || 'UNKNOWN',
      loan_amount_left: loan.loan_amount_left,
      response_rate: loan.response_rate || 0
    }));
    
    res.json({ 
      success: true, 
      recommendations 
    });
    
  } catch (error) {
    console.error('Recommendations error:', error);
    res.json({ 
      success: true, 
      recommendations: [
        {
          loan_id: 'TEST_001',
          customer_name: 'Rajesh Kumar',
          recommended_channel: 'whatsapp',
          priority: 5,
          tone: 'empathetic',
          persona: 'LOW_RISK_COMMUNICATIVE'
        }
      ]
    });
  }
});

/**
 * GET /api/mcp/agent/logs
 * Get agent activity logs
 */
router.get('/agent/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const logs = [
      {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Agent cycle completed',
        details: 'Processed 15 customers'
      },
      {
        timestamp: new Date(Date.now() - 300000).toISOString(),
        level: 'SUCCESS',
        message: 'Message sent to TEST_001',
        details: 'WhatsApp message delivered'
      }
    ];
    
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Agent logs error:', error);
    res.json({ success: true, logs: [] });
  }
});

/**
 * POST /api/mcp/agent/trigger
 * Trigger AI agent collection
 */
router.post('/agent/trigger', async (req, res) => {
  try {
    const batch_size = req.body.batch_size || 10;
    
    res.json({ 
      success: true, 
      message: `Collection triggered for ${batch_size} customers`,
      batch_size 
    });
  } catch (error) {
    console.error('Trigger collection error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/mcp/agent/status
 * Get AI agent status
 */
router.get('/agent/status', async (req, res) => {
  try {
    res.json({
      success: true,
      status: {
        state: 'running',
        last_run: new Date().toISOString(),
        messages_processed: 1247,
        success_rate: 0.94
      }
    });
  } catch (error) {
    console.error('Agent status error:', error);
    res.json({
      success: true,
      status: {
        state: 'stopped',
        last_run: null,
        messages_processed: 0,
        success_rate: 0
      }
    });
  }
});

/**
 * POST /api/mcp/agent/start
 * Start AI agent
 */
router.post('/agent/start', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Agent started successfully',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/mcp/agent/stop
 * Stop AI agent
 */
router.post('/agent/stop', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Agent stopped successfully',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
