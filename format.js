const mongoose = require('mongoose');
const { Schema } = mongoose;

const loanSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  borrower: {
    annual_inc: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0
    },
    emp_length: {
      type: String,
      enum: ['< 1 year', '1 year', '2 years', '3 years', '4 years', 
             '5 years', '6 years', '7 years', '8 years', '9 years', 
             '10+ years', 'n/a'],
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
      enum: ['debt_consolidation', 'credit_card', 'home_improvement', 
             'major_purchase', 'small_business', 'car', 'medical', 
             'moving', 'vacation', 'house', 'wedding', 'renewable_energy', 
             'educational', 'other'],
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
  
  repayment: {
    loan_status: {
      type: String,
      enum: ['Fully Paid', 'Charged Off', 'Current', 'Default', 
             'In Grace Period', 'Late (16-30 days)', 'Late (31-120 days)'],
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

}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound indexes for common queries
loanSchema.index({ 'loan_details.grade': 1, 'repayment.loan_status': 1 });
loanSchema.index({ 'borrower.fico_range_low': 1, 'borrower.fico_range_high': 1 });
loanSchema.index({ 'loan_details.purpose': 1, 'repayment.loan_status': 1 });
loanSchema.index({ 'repayment.last_pymnt_d': -1 });

const Loan = mongoose.model('Loan', loanSchema);

module.exports = Loan;