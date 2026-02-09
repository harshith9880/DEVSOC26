const mongoose = require('mongoose');

/**
 * Loan Model - Core customer loan and collection data
 * This is the single source of truth for customer information
 */
const loanSchema = new mongoose.Schema({
  // Unique identifier
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // ===== BORROWER INFORMATION =====
  borrower: {
    annual_inc: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0
    },
    emp_length: {
      type: String,
      enum: [
        '< 1 year', '1 year', '2 years', '3 years', '4 years',
        '5 years', '6 years', '7 years', '8 years', '9 years',
        '10+ years', 'n/a'
      ],
      required: true
    },
    home_ownership: {
      type: String,
      enum: ['RENT', 'OWN', 'MORTGAGE', 'OTHER', 'NONE', 'ANY'],
      required: true
    },
    verification_status: {
      type: String,
      enum: ['Verified', 'Source Verified', 'Not Verified'],
      required: true
    },
    dti: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0
    },
    fico_range_low: {
      type: Number,
      required: true,
      min: 300,
      max: 850
    },
    fico_range_high: {
      type: Number,
      required: true,
      min: 300,
      max: 850
    }
  },

  // ===== LOAN DETAILS =====
  loan_details: {
    loan_amnt: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0
    },
    term: {
      type: String,
      enum: [' 36 months', ' 60 months'],
      required: true
    },
    int_rate: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0,
      max: 100
    },
    installment: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0
    },
    purpose: {
      type: String,
      enum: [
        'debt_consolidation', 'credit_card', 'home_improvement',
        'major_purchase', 'small_business', 'car', 'medical',
        'moving', 'vacation', 'house', 'wedding', 'renewable_energy',
        'educational', 'other'
      ],
      required: true
    },
    grade: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      required: true,
      index: true
    },
    sub_grade: {
      type: String,
      required: true,
      index: true
    }
  },

  // ===== CREDIT BEHAVIOR =====
  credit_behavior: {
    delinq_2yrs: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    inq_last_6mths: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    open_acc: {
      type: Number,
      required: true,
      min: 0
    },
    revol_bal: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0
    },
    revol_util: {
      type: mongoose.Schema.Types.Decimal128,
      min: 0,
      max: 100
    },
    total_acc: {
      type: Number,
      required: true,
      min: 0
    }
  },

  // ===== REPAYMENT STATUS =====
  repayment: {
    loan_status: {
      type: String,
      enum: [
        'Fully Paid', 'Charged Off', 'Current', 'Default',
        'In Grace Period', 'Late (16-30 days)', 'Late (31-120 days)'
      ],
      required: true,
      index: true
    },
    total_pymnt: {
      type: mongoose.Schema.Types.Decimal128,
      min: 0,
      default: 0
    },
    total_rec_prncp: {
      type: mongoose.Schema.Types.Decimal128,
      min: 0,
      default: 0
    },
    last_pymnt_d: {
      type: Date
    },
    last_pymnt_amnt: {
      type: mongoose.Schema.Types.Decimal128,
      min: 0
    },
    recoveries: {
      type: mongoose.Schema.Types.Decimal128,
      min: 0,
      default: 0
    }
  },

  // ===== CUSTOMER CONTACT INFORMATION =====
  customer_contact: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true
    },
    address: String,
    city: String,
    state: String,
    postal_code: String,
    country: {
      type: String,
      default: 'India'
    }
  },

  // ===== COLLECTION CONTACT PROFILE =====
  // This is used by AI agents to track engagement patterns
  contactProfile: {
    lastContactAt: Date,
    lastResponseAt: Date,
    contactChannels: {
      type: [String],
      default: []
    },
    tone: {
      type: String,
      enum: ['informational', 'empathetic', 'supportive', 'urgent', 'firm'],
      default: 'informational'
    },
    currentContactFreq: {
      type: Number,
      default: 0
    },
    contactTimeRange: {
      start: Date,
      end: Date
    },
    loanAmountLeft: {
      type: Number,
      default: 0
    },
    responseRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    delayTimeMs: Number
  },

  // ===== INTERACTION HISTORY =====
  // Track all messages sent and customer responses
  interactionHistory: [{
    channel: {
      type: String,
      enum: ['email', 'sms', 'whatsapp', 'call']
    },
    message_id: String,  // Unique message ID from AI agent
    message_content: String,  // Actual message sent
    
    // Timing
    sentAt: Date,
    deliveredAt: Date,
    openedAt: Date,
    clickedAt: Date,
    respondedAt: Date,
    
    // Message attributes
    tone: {
      type: String,
      enum: ['informational', 'empathetic', 'supportive', 'urgent', 'firm']
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'opened', 'clicked', 'responded', 'failed'],
      default: 'pending'
    },
    
    // AI metadata
    ai_generated: {
      type: Boolean,
      default: false
    },
    ai_model: String,  // e.g., 'gpt-4', 'claude-3'
    sent_by_agent: String,  // Agent name/ID
    
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // ===== AI FEEDBACK SNAPSHOT =====
  // Latest persona analysis result (cached for performance)
  FeedbackOutput: {
    persona: String,
    confidence: Number,
    recommended_channel: String,
    recommended_tone: String,
    max_intensity: Number,
    analyzed_at: Date
  }

}, {
  timestamps: true,  // Adds createdAt and updatedAt automatically
  collection: 'loans'
});

// ===== INDEXES =====
loanSchema.index({ 'loan_details.grade': 1, 'repayment.loan_status': 1 });
loanSchema.index({ 'borrower.fico_range_low': 1, 'borrower.fico_range_high': 1 });
loanSchema.index({ 'loan_details.purpose': 1, 'repayment.loan_status': 1 });
loanSchema.index({ 'repayment.last_pymnt_d': -1 });
loanSchema.index({ 'contactProfile.lastContactAt': -1 });
loanSchema.index({ 'customer_contact.email': 1 });

// ===== VIRTUALS =====
// Calculate FICO score average
loanSchema.virtual('fico_score_avg').get(function() {
  return (this.borrower.fico_range_low + this.borrower.fico_range_high) / 2;
});

// Calculate days since last payment
loanSchema.virtual('days_since_last_payment').get(function() {
  if (!this.repayment.last_pymnt_d) return null;
  const diff = Date.now() - new Date(this.repayment.last_pymnt_d);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// ===== METHODS =====
// Update contact frequency safely
loanSchema.methods.incrementContactFrequency = function() {
  this.contactProfile.currentContactFreq = (this.contactProfile.currentContactFreq || 0) + 1;
  this.contactProfile.lastContactAt = new Date();
};

// Add interaction to history
loanSchema.methods.addInteraction = function(interaction) {
  if (!this.interactionHistory) {
    this.interactionHistory = [];
  }
  this.interactionHistory.push({
    ...interaction,
    timestamp: new Date()
  });
  
  // Keep only last 100 interactions to prevent document bloat
  if (this.interactionHistory.length > 100) {
    this.interactionHistory = this.interactionHistory.slice(-100);
  }
};

// Calculate response rate based on interaction history
loanSchema.methods.calculateResponseRate = function() {
  if (!this.interactionHistory || this.interactionHistory.length === 0) {
    return 0;
  }
  
  const responded = this.interactionHistory.filter(
    i => i.respondedAt || i.clickedAt
  ).length;
  
  return responded / this.interactionHistory.length;
};

// Update response rate
loanSchema.pre('save', function(next) {
  if (this.isModified('interactionHistory')) {
    this.contactProfile.responseRate = this.calculateResponseRate();
  }
  next();
});

// Ensure virtuals are included in JSON output
loanSchema.set('toJSON', { virtuals: true });
loanSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Loan', loanSchema);