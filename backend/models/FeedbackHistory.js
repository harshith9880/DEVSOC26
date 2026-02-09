const mongoose = require('mongoose');

/**
 * FeedbackHistory Model
 * Stores historical AI intelligence analysis results
 * Enables tracking of persona changes over time and strategy effectiveness
 */
const feedbackHistorySchema = new mongoose.Schema({
  // ===== IDENTIFIERS =====
  loan_id: {
    type: String,
    required: true,
    index: true,
    ref: 'Loan'
  },

  // ===== PERSONA CLASSIFICATION =====
  repayment_persona: {
    type: String,
    enum: [
      'HIGH_RISK_NON_RESPONSIVE',
      'HIGH_RISK_RESPONSIVE',
      'MEDIUM_RISK_INCONSISTENT',
      'LOW_RISK_RESPONSIVE',
      'LOW_RISK_NON_RESPONSIVE',
      'ZERO_CONTACT',
      'UNKNOWN'
    ],
    required: true,
    index: true
  },

  // ===== CONFIDENCE & RULES =====
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },

  triggered_rules: {
    type: [String],
    default: []
  },

  // ===== RECOMMENDED STRATEGIES =====
  recommended_strategies: [{
    channel: {
      type: String,
      enum: ['email', 'sms', 'whatsapp', 'call'],
      required: true
    },
    tone: {
      type: String,
      enum: ['informational', 'empathetic', 'supportive', 'urgent', 'firm'],
      required: true
    },
    frequency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    },
    priority: {
      type: Number,
      min: 1,
      max: 5
    },
    reason: String  // Why this strategy is recommended
  }],

  // ===== INTENSITY CONTROL =====
  max_intensity_level: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },

  // ===== ANALYTICS SCORES =====
  analytics: {
    default_risk_score: {
      type: Number,
      min: 0,
      max: 1
    },
    engagement_score: {
      type: Number,
      min: 0,
      max: 1
    },
    risk_interpretation: {
      type: String,
      enum: ['Very Low', 'Low', 'Medium', 'High', 'Very High']
    },
    engagement_interpretation: {
      type: String,
      enum: ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent']
    }
  },

  // ===== FEATURE SNAPSHOT =====
  // Snapshot of key features used in this analysis
  feature_snapshot: {
    responseRate: Number,
    loanAmountLeft: Number,
    currentContactFreq: Number,
    daysSinceLastResponse: Number,
    daysSinceLastPayment: Number,
    fico_score_avg: Number,
    grade: String,
    loan_status: String,
    total_payments_made: Number
  },

  // ===== METADATA =====
  generated_at: {
    type: Date,
    default: Date.now,
    index: true
  },

  generated_by: {
    type: String,
    default: 'RepaymentIntelligence'
  },

  // ===== DETAILED FEATURES =====
  // Store all features used for analysis (for ML training later)
  features_used: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  // ===== DECISION METADATA =====
  decision_metadata: {
    processing_time_ms: Number,
    model_version: String,
    rules_engine_version: String
  }

}, {
  timestamps: true,
  collection: 'feedback_history'
});

// ===== INDEXES =====
feedbackHistorySchema.index({ loan_id: 1, generated_at: -1 });
feedbackHistorySchema.index({ repayment_persona: 1, generated_at: -1 });
feedbackHistorySchema.index({ 'analytics.default_risk_score': -1 });
feedbackHistorySchema.index({ 'analytics.engagement_score': -1 });

// ===== STATICS =====
/**
 * Get latest feedback for a loan
 */
feedbackHistorySchema.statics.getLatest = function(loan_id) {
  return this.findOne({ loan_id })
    .sort({ generated_at: -1 })
    .exec();
};

/**
 * Get persona history for a loan
 */
feedbackHistorySchema.statics.getPersonaHistory = function(loan_id, limit = 10) {
  return this.find({ loan_id })
    .sort({ generated_at: -1 })
    .limit(limit)
    .select('repayment_persona confidence generated_at')
    .exec();
};

/**
 * Get aggregated statistics by persona
 */
feedbackHistorySchema.statics.getPersonaStats = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$repayment_persona',
        count: { $sum: 1 },
        avg_confidence: { $avg: '$confidence' },
        avg_risk_score: { $avg: '$analytics.default_risk_score' },
        avg_engagement: { $avg: '$analytics.engagement_score' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// ===== METHODS =====
/**
 * Check if persona has changed since last analysis
 */
feedbackHistorySchema.methods.hasPersonaChanged = async function() {
  const previous = await this.constructor.findOne({
    loan_id: this.loan_id,
    generated_at: { $lt: this.generated_at }
  }).sort({ generated_at: -1 });

  if (!previous) return false;
  return previous.repayment_persona !== this.repayment_persona;
};

/**
 * Get recommended action (first strategy with highest priority)
 */
feedbackHistorySchema.methods.getRecommendedAction = function() {
  if (!this.recommended_strategies || this.recommended_strategies.length === 0) {
    return null;
  }
  
  // Sort by priority descending
  const sorted = [...this.recommended_strategies].sort((a, b) => b.priority - a.priority);
  return sorted[0];
};

module.exports = mongoose.model('FeedbackHistory', feedbackHistorySchema);