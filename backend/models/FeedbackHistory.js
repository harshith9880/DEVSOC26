const mongoose = require('mongoose');

const feedbackHistorySchema = new mongoose.Schema({
  loan_id: {
    type: String,
    required: true,
    index: true
  },

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
    required: true
  },

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

  recommended_strategies: [{
    channel: {
      type: String,
      enum: ['email', 'sms', 'whatsapp', 'call']
    },
    tone: {
      type: String,
      enum: ['informational', 'empathetic', 'supportive', 'urgent']
    },
    frequency: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    priority: Number
  }],

  max_intensity_level: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },

  analytics: {
    default_risk_score: Number,
    engagement_score: Number,
    risk_interpretation: String,
    engagement_interpretation: String
  },

  feature_snapshot: {
    responseRate: Number,
    loanAmountLeft: Number,
    currentContactFreq: Number,
    daysSinceLastResponse: Number,
    fico_score_avg: Number,
    grade: String
  },

  generated_at: {
    type: Date,
    default: Date.now
  },

  features_used: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }

}, { timestamps: true });

feedbackHistorySchema.index({ loan_id: 1, generated_at: -1 });
feedbackHistorySchema.index({ repayment_persona: 1 });

module.exports = mongoose.model('FeedbackHistory', feedbackHistorySchema);
