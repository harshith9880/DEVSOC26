delete require.cache[require.resolve('../services/repaymentIntelligence')];

const RepaymentIntelligence = require('../services/repaymentIntelligence');
const Loan = require('../models/Loan');
const FeedbackHistory = require('../models/FeedbackHistory');

// Analyze single customer
exports.analyzeCustomer = async (req, res) => {
  try {
    const { loan_id } = req.params;

    const loan = await Loan.findOne({ id: loan_id });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Run intelligence engine
    const intelligence = new RepaymentIntelligence(loan);
    const feedback = await intelligence.analyze();

    // Update embedded FeedbackOutput in loan document
    loan.FeedbackOutput = {
      loan_id: loan.id,
      repayment_persona: feedback.repayment_persona,
      confidence: feedback.confidence,
      triggered_rules: feedback.triggered_rules,
      recommended_strategies: feedback.recommended_strategies,
      max_intensity_level: feedback.max_intensity_level
    };
    await loan.save();

    // Also save to feedback history for tracking
    const feedbackDoc = new FeedbackHistory(feedback);
    await feedbackDoc.save();

    res.json({
      success: true,
      feedback,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Analyze customer error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Batch analyze multiple customers
exports.analyzeBatch = async (req, res) => {
  try {
    const { loan_ids } = req.body;

    if (!Array.isArray(loan_ids)) {
      return res.status(400).json({ error: 'loan_ids must be an array' });
    }

    const results = [];
    const errors = [];

    for (const loan_id of loan_ids) {
      try {
        const loan = await Loan.findOne({ id: loan_id });
        if (!loan) {
          errors.push({ loan_id, error: 'Loan not found' });
          continue;
        }

        const intelligence = new RepaymentIntelligence(loan);
        const feedback = await intelligence.analyze();

        // Update embedded feedback
        loan.FeedbackOutput = {
          loan_id: loan.id,
          repayment_persona: feedback.repayment_persona,
          confidence: feedback.confidence,
          triggered_rules: feedback.triggered_rules,
          recommended_strategies: feedback.recommended_strategies,
          max_intensity_level: feedback.max_intensity_level
        };
        await loan.save();

        // Save to history
        const feedbackDoc = new FeedbackHistory(feedback);
        await feedbackDoc.save();

        results.push({ loan_id, feedback });
      } catch (error) {
        errors.push({ loan_id, error: error.message });
      }
    }

    res.json({
      success: true,
      results,
      errors,
      total: loan_ids.length,
      successful: results.length,
      failed: errors.length
    });

  } catch (error) {
    console.error('Batch analyze error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get latest feedback for a loan
exports.getLatestFeedback = async (req, res) => {
  try {
    const { loan_id } = req.params;

    // First try embedded feedback
    const loan = await Loan.findOne({ id: loan_id });
    if (loan && loan.FeedbackOutput && loan.FeedbackOutput.repayment_persona) {
      return res.json({ success: true, feedback: loan.FeedbackOutput });
    }

    // Fallback to history
    const feedback = await FeedbackHistory
      .findOne({ loan_id })
      .sort({ generated_at: -1 });

    if (!feedback) {
      return res.status(404).json({ error: 'No feedback found for this loan' });
    }

    res.json({ success: true, feedback });

  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get feedback history
exports.getFeedbackHistory = async (req, res) => {
  try {
    const { loan_id } = req.params;
    const { limit = 10, skip = 0 } = req.query;

    const feedbacks = await FeedbackHistory
      .find({ loan_id })
      .sort({ generated_at: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await FeedbackHistory.countDocuments({ loan_id });

    res.json({
      success: true,
      feedbacks,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > parseInt(skip) + feedbacks.length
      }
    });

  } catch (error) {
    console.error('Get feedback history error:', error);
    res.status(500).json({ error: error.message });
  }
};


// Channel performance
exports.getChannelPerformance = async (req, res) => {
  try {
    const stats = await FeedbackHistory.aggregate([
      {
        $group: {
          _id: '$channel',
          count: { $sum: 1 },
          opened: { $sum: { $cond: ['$openedAt', 1, 0] } },
          responded: { $sum: { $cond: ['$respondedAt', 1, 0] } }
        }
      }
    ]);
    
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Message stats
exports.getMessageStats = async (req, res) => {
  try {
    const total = await FeedbackHistory.countDocuments();
    const sent = await FeedbackHistory.countDocuments({ openedAt: null });
    const opened = await FeedbackHistory.countDocuments({ 
      openedAt: { $ne: null }, 
      respondedAt: null 
    });
    const responded = await FeedbackHistory.countDocuments({ respondedAt: { $ne: null } });
    
    res.json({ success: true, stats: { total, sent, opened, responded } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
