const mongoose = require('mongoose');
const Loan = require('../models/Loan');
require('dotenv').config();

async function seedTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/emi-intelligence');
    console.log('✅ Connected to MongoDB');

    // Clear existing test data
    await Loan.deleteMany({ id: { $regex: /^TEST_/ } });
    console.log('🗑️  Cleared existing test data');

    // Create test loans with varying profiles
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
          lastContactAt: new Date('2026-02-01'),
          lastResponseAt: new Date('2026-02-02'),
          responseRate: 0.75,
          delayTimeMs: 3600000, // 1 hour
          loanAmountLeft: 10500.00,
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
        
        interactionHistory: [],
        
        FeedbackOutput: {
          loan_id: "TEST_001",
          repayment_persona: "LOW_RISK_RESPONSIVE",
          confidence: 0.0,
          triggered_rules: [],
          recommended_strategies: [],
          max_intensity_level: 0
        }
      },
      
      {
        id: "TEST_002",
        
        borrower: {
          annual_inc: mongoose.Types.Decimal128.fromString("45000.00"),
          emp_length: "2 years",
          home_ownership: "RENT",
          verification_status: "Source Verified",
          dti: mongoose.Types.Decimal128.fromString("28.75"),
          fico_range_low: 620,
          fico_range_high: 640
        },
        
        loan_details: {
          loan_amnt: mongoose.Types.Decimal128.fromString("15000.00"),
          term: " 36 months",
          int_rate: mongoose.Types.Decimal128.fromString("16.80"),
          installment: mongoose.Types.Decimal128.fromString("535.20"),
          purpose: "credit_card",
          grade: "C",
          sub_grade: "C4"
        },
        
        credit_behavior: {
          delinq_2yrs: 1,
          inq_last_6mths: 3,
          open_acc: 5,
          revol_bal: mongoose.Types.Decimal128.fromString("8500.00"),
          revol_util: mongoose.Types.Decimal128.fromString("65.2"),
          total_acc: 10
        },
        
        repayment: {
          loan_status: "Late (16-30 days)",
          total_pymnt: mongoose.Types.Decimal128.fromString("3500.00"),
          total_rec_prncp: mongoose.Types.Decimal128.fromString("3200.00"),
          last_pymnt_d: new Date('2025-12-10'),
          last_pymnt_amnt: mongoose.Types.Decimal128.fromString("535.20"),
          recoveries: mongoose.Types.Decimal128.fromString("0.00")
        },
        
        contactProfile: {
          contactChannels: ["sms", "whatsapp", "call"],
          lastContactAt: new Date('2026-02-07'),
          lastResponseAt: new Date('2026-01-20'),
          responseRate: 0.35,
          delayTimeMs: 172800000, // 2 days
          loanAmountLeft: 11800.00,
          tone: "empathetic",
          currentContactFreq: 12,
          contactTimeRange: {
            start: new Date('2026-02-09T10:00:00Z'),
            end: new Date('2026-02-09T20:00:00Z')
          }
        },
        
        customer_contact: {
          name: "Priya Sharma",
          email: "priya.sharma@example.com",
          phone: "+91-9123456789"
        },
        
        interactionHistory: [],
        
        FeedbackOutput: {
          loan_id: "TEST_002",
          repayment_persona: "TEMPORARY_STRESSED",
          confidence: 0.0,
          triggered_rules: [],
          recommended_strategies: [],
          max_intensity_level: 0
        }
      },
      
      {
        id: "TEST_003",
        
        borrower: {
          annual_inc: mongoose.Types.Decimal128.fromString("35000.00"),
          emp_length: "< 1 year",
          home_ownership: "RENT",
          verification_status: "Not Verified",
          dti: mongoose.Types.Decimal128.fromString("35.20"),
          fico_range_low: 580,
          fico_range_high: 600
        },
        
        loan_details: {
          loan_amnt: mongoose.Types.Decimal128.fromString("10000.00"),
          term: " 36 months",
          int_rate: mongoose.Types.Decimal128.fromString("22.50"),
          installment: mongoose.Types.Decimal128.fromString("380.00"),
          purpose: "small_business",
          grade: "D",
          sub_grade: "D5"
        },
        
        credit_behavior: {
          delinq_2yrs: 3,
          inq_last_6mths: 5,
          open_acc: 3,
          revol_bal: mongoose.Types.Decimal128.fromString("12000.00"),
          revol_util: mongoose.Types.Decimal128.fromString("85.5"),
          total_acc: 8
        },
        
        repayment: {
          loan_status: "Late (31-120 days)",
          total_pymnt: mongoose.Types.Decimal128.fromString("1500.00"),
          total_rec_prncp: mongoose.Types.Decimal128.fromString("1200.00"),
          last_pymnt_d: new Date('2025-11-05'),
          last_pymnt_amnt: mongoose.Types.Decimal128.fromString("380.00"),
          recoveries: mongoose.Types.Decimal128.fromString("0.00")
        },
        
        contactProfile: {
          contactChannels: ["call"],
          lastContactAt: new Date('2026-02-08'),
          lastResponseAt: new Date('2025-12-01'),
          responseRate: 0.15,
          delayTimeMs: 604800000, // 7 days
          loanAmountLeft: 8800.00,
          tone: "urgent",
          currentContactFreq: 25,
          contactTimeRange: {
            start: new Date('2026-02-09T08:00:00Z'),
            end: new Date('2026-02-09T21:00:00Z')
          }
        },
        
        customer_contact: {
          name: "Amit Patel",
          email: "amit.patel@example.com",
          phone: "+91-9988776655"
        },
        
        interactionHistory: [],
        
        FeedbackOutput: {
          loan_id: "TEST_003",
          repayment_persona: "HIGH_RISK_DEFAULT",
          confidence: 0.0,
          triggered_rules: [],
          recommended_strategies: [],
          max_intensity_level: 0
        }
      },

      {
        id: "TEST_004",
        
        borrower: {
          annual_inc: mongoose.Types.Decimal128.fromString("95000.00"),
          emp_length: "10+ years",
          home_ownership: "OWN",
          verification_status: "Verified",
          dti: mongoose.Types.Decimal128.fromString("12.30"),
          fico_range_low: 740,
          fico_range_high: 760
        },
        
        loan_details: {
          loan_amnt: mongoose.Types.Decimal128.fromString("25000.00"),
          term: " 60 months",
          int_rate: mongoose.Types.Decimal128.fromString("8.90"),
          installment: mongoose.Types.Decimal128.fromString("518.75"),
          purpose: "home_improvement",
          grade: "A",
          sub_grade: "A2"
        },
        
        credit_behavior: {
          delinq_2yrs: 0,
          inq_last_6mths: 0,
          open_acc: 12,
          revol_bal: mongoose.Types.Decimal128.fromString("3000.00"),
          revol_util: mongoose.Types.Decimal128.fromString("15.8"),
          total_acc: 22
        },
        
        repayment: {
          loan_status: "Current",
          total_pymnt: mongoose.Types.Decimal128.fromString("8200.00"),
          total_rec_prncp: mongoose.Types.Decimal128.fromString("7900.00"),
          last_pymnt_d: new Date('2026-02-01'),
          last_pymnt_amnt: mongoose.Types.Decimal128.fromString("518.75"),
          recoveries: mongoose.Types.Decimal128.fromString("0.00")
        },
        
        contactProfile: {
          contactChannels: ["email"],
          lastContactAt: new Date('2026-01-25'),
          lastResponseAt: new Date('2026-01-25'),
          responseRate: 0.90,
          delayTimeMs: 1800000, // 30 minutes
          loanAmountLeft: 17100.00,
          tone: "supportive",
          currentContactFreq: 2,
          contactTimeRange: {
            start: new Date('2026-02-09T09:00:00Z'),
            end: new Date('2026-02-09T17:00:00Z')
          }
        },
        
        customer_contact: {
          name: "Sneha Reddy",
          email: "sneha.reddy@example.com",
          phone: "+91-9123498765"
        },
        
        interactionHistory: [],
        
        FeedbackOutput: {
          loan_id: "TEST_004",
          repayment_persona: "LOW_RISK_RESPONSIVE",
          confidence: 0.0,
          triggered_rules: [],
          recommended_strategies: [],
          max_intensity_level: 0
        }
      }
    ];

    // Insert test loans
    const inserted = await Loan.insertMany(testLoans);
    console.log(`✅ Created ${inserted.length} test loans:`);
    inserted.forEach(loan => {
      console.log(`   - ${loan.id}: ${loan.customer_contact.name} (${loan.loan_details.grade} grade, ${loan.repayment.loan_status})`);
    });

    console.log('\n📊 Test Data Summary:');
    console.log(`   TEST_001: Low Risk - High response rate, good credit`);
    console.log(`   TEST_002: Temporary Stressed - Late payment, moderate response`);
    console.log(`   TEST_003: High Risk - Very late, poor response, low credit score`);
    console.log(`   TEST_004: Low Risk - Excellent credit, very responsive`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedTestData();
