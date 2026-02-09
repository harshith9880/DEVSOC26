const mongoose = require('mongoose');

const feedbackOutputSchema = new mongoose.Schema({
  loan_id: {
    type: String,
    required: true,
    index: true
  },

  repayment_persona: {
    type: String,
    enum: [
      "LOW_RISK_RESPONSIVE",
      "TEMPORARY_STRESSED",
      "CHRONIC_DELAYED",
      "HIGH_RISK_DEFAULT",
      "WILFUL_DEFAULTER",
      "RECOVERY_CANDIDATE"
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

  recommended_strategies: {
    type: [String],
    enum: [
      "EMAIL",
      "SMS",
      "WHATSAPP",
      "CALL",
      "HUMAN_ESCALATION"
    ],
    default: []
  },

  max_intensity_level: {
    type: Number,
    min: 0,
    max: 4,
    required: true
  },

  // Metadata for tracking
  generated_at: {
    type: Date,
    default: Date.now
  },

  features_used: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }

}, { timestamps: true });

// Index for efficient lookups
feedbackOutputSchema.index({ loan_id: 1, generated_at: -1 });

module.exports = mongoose.model('FeedbackOutput', feedbackOutputSchema);
