const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  borrower: {
    annual_inc: mongoose.Schema.Types.Decimal128,
    emp_length: String,
    home_ownership: String,
    verification_status: String,
    dti: mongoose.Schema.Types.Decimal128,
    fico_range_low: Number,
    fico_range_high: Number
  },
  loan_details: {
    loan_amnt: mongoose.Schema.Types.Decimal128,
    term: String,
    int_rate: mongoose.Schema.Types.Decimal128,
    installment: mongoose.Schema.Types.Decimal128,
    purpose: String,
    grade: String,
    sub_grade: String
  },
  credit_behavior: {
    delinq_2yrs: Number,
    inq_last_6mths: Number,
    open_acc: Number,
    revol_bal: mongoose.Schema.Types.Decimal128,
    revol_util: mongoose.Schema.Types.Decimal128,
    total_acc: Number
  },
  repayment: {
    loan_status: String,
    total_pymnt: mongoose.Schema.Types.Decimal128,
    total_rec_prncp: mongoose.Schema.Types.Decimal128,
    last_pymnt_d: Date,
    last_pymnt_amnt: mongoose.Schema.Types.Decimal128,
    recoveries: mongoose.Schema.Types.Decimal128
  },
  contactProfile: {
    lastContactAt: Date,
    contactChannels: [String],
    tone: String,
    currentContactFreq: {
      type: Number,
      default: 0
    },
    contactTimeRange: {
      start: Date,
      end: Date
    },
    loanAmountLeft: Number,
    responseRate: Number
  },
  customer_contact: {
    name: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    postal_code: String,
    country: String
  },
  interactionHistory: [
    {
      channel: String,
      sentAt: Date,
      tone: String,
      status: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ],
  FeedbackOutput: mongoose.Schema.Types.Mixed,
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Loan', loanSchema);
