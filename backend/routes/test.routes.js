const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Lazy-load Loan to avoid circular dependency
const getLoan = () => require('../models/Loan');

// Create test loans
router.post('/create-test-loans', async (req, res) => {
  try {
    const Loan = getLoan();
    await Loan.deleteMany({ id: { $regex: /^TEST_/ } });
    
    const testLoans = [
      {
        id: "TEST_001",
        borrower: {
          annual_inc: mongoose.Types.Decimal128.fromString("75000.00"),
          emp_length: "5 years",
          home_ownership: "MORTGAGE",
          verification_status: "Verified",
          dti: mongoose.Types.Decimal128.fromString("18.50"),
          fico_range_low: 680,
          fico_range_high: 700
        },
        loan_details: {
          loan_amnt: mongoose.Types.Decimal128.fromString("20000.00"),
          term: " 36 months",
          int_rate: mongoose.Types.Decimal128.fromString("12.50"),
          installment: mongoose.Types.Decimal128.fromString("667.50"),
          purpose: "debt_consolidation",
          grade: "B",
          sub_grade: "B3"
        },
        credit_behavior: {
          delinq_2yrs: 0,
          inq_last_6mths: 1,
          open_acc: 8,
          revol_bal: mongoose.Types.Decimal128.fromString("5000.00"),
          revol_util: mongoose.Types.Decimal128.fromString("35.5"),
          total_acc: 15
        },
        repayment: {
          loan_status: "Current",
          total_pymnt: mongoose.Types.Decimal128.fromString("10000.00"),
          total_rec_prncp: mongoose.Types.Decimal128.fromString("9500.00"),
          last_pymnt_d: new Date('2026-01-15'),
          last_pymnt_amnt: mongoose.Types.Decimal128.fromString("667.50"),
          recoveries: mongoose.Types.Decimal128.fromString("0.00")
        },
        contactProfile: {
          contactChannels: ["email", "sms"],
          loanAmountLeft: 10500.00,
          responseRate: 0.75,
          tone: "informational",
          currentContactFreq: 5,
          contactTimeRange: {
            start: new Date('2026-02-09T09:00:00Z'),
            end: new Date('2026-02-09T18:00:00Z')
          }
        },
        customer_contact: {
          name: "Rajesh Kumar",
          email: "rajesh.kumar@example.com",
          phone: "+91-9876543210"
        },
        FeedbackOutput: {
          loan_id: "TEST_001",
          repayment_persona: "LOW_RISK_RESPONSIVE",
          confidence: 0.0,
          triggered_rules: [],
          recommended_strategies: [],
          max_intensity_level: 0
        }
      }
    ];

    const inserted = await Loan.insertMany(testLoans);

    res.json({
      success: true,
      message: `Created ${inserted.length} test loans`,
      loans: inserted.map(l => ({ id: l.id, name: l.customer_contact.name }))
    });
  } catch (error) {
    console.error('Create test loans error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all test loans
router.get('/test-loans', async (req, res) => {
  try {
    const Loan = getLoan();
    const loans = await Loan.find({ id: { $regex: /^TEST_/ } });
    res.json({
      success: true,
      count: loans.length,
      loans: loans.map(l => ({
        id: l.id,
        name: l.customer_contact.name,
        grade: l.loan_details.grade,
        status: l.repayment.loan_status,
        responseRate: l.contactProfile.responseRate
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
