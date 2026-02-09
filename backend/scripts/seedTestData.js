require('dotenv').config();
const mongoose = require('mongoose');
const Loan = require('../models/Loan');

/**
 * Seed Test Data Script
 * Creates sample loan records for testing the 3-agent system
 */

// Sample loan data representing different personas
const sampleLoans = [
  {
    id: 'LOAN_001',
    borrower: {
      annual_inc: 75000,
      emp_length: '5 years',
      home_ownership: 'MORTGAGE',
      verification_status: 'Verified',
      dti: 18.5,
      fico_range_low: 720,
      fico_range_high: 750
    },
    loan_details: {
      loan_amnt: 25000,
      term: ' 36 months',
      int_rate: 8.5,
      installment: 788.45,
      purpose: 'debt_consolidation',
      grade: 'A',
      sub_grade: 'A3'
    },
    credit_behavior: {
      delinq_2yrs: 0,
      inq_last_6mths: 1,
      open_acc: 8,
      revol_bal: 12000,
      revol_util: 35.5,
      total_acc: 15
    },
    repayment: {
      loan_status: 'Current',
      total_pymnt: 15000,
      total_rec_prncp: 14000,
      last_pymnt_d: new Date('2025-01-15'),
      last_pymnt_amnt: 788.45,
      recoveries: 0
    },
    customer_contact: {
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@example.com',
      phone: '+91-9876543210',
      city: 'Mumbai',
      state: 'Maharashtra',
      postal_code: '400001',
      country: 'India'
    },
    contactProfile: {
      loanAmountLeft: 11000,
      responseRate: 0.75,
      currentContactFreq: 5,
      contactChannels: ['email', 'whatsapp'],
      lastContactAt: new Date('2025-02-01'),
      lastResponseAt: new Date('2025-02-01'),
      tone: 'informational'
    },
    interactionHistory: [
      {
        channel: 'email',
        sentAt: new Date('2025-01-10'),
        openedAt: new Date('2025-01-10'),
        clickedAt: new Date('2025-01-11'),
        tone: 'informational',
        status: 'clicked'
      },
      {
        channel: 'whatsapp',
        sentAt: new Date('2025-01-20'),
        respondedAt: new Date('2025-01-20'),
        tone: 'empathetic',
        status: 'responded'
      }
    ]
  },
  {
    id: 'LOAN_002',
    borrower: {
      annual_inc: 45000,
      emp_length: '2 years',
      home_ownership: 'RENT',
      verification_status: 'Source Verified',
      dti: 25.8,
      fico_range_low: 650,
      fico_range_high: 680
    },
    loan_details: {
      loan_amnt: 15000,
      term: ' 60 months',
      int_rate: 14.5,
      installment: 352.75,
      purpose: 'credit_card',
      grade: 'C',
      sub_grade: 'C2'
    },
    credit_behavior: {
      delinq_2yrs: 1,
      inq_last_6mths: 3,
      open_acc: 5,
      revol_bal: 8500,
      revol_util: 68.2,
      total_acc: 12
    },
    repayment: {
      loan_status: 'Late (16-30 days)',
      total_pymnt: 6000,
      total_rec_prncp: 5500,
      last_pymnt_d: new Date('2024-12-20'),
      last_pymnt_amnt: 352.75,
      recoveries: 0
    },
    customer_contact: {
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      phone: '+91-9123456789',
      city: 'Bangalore',
      state: 'Karnataka',
      postal_code: '560001',
      country: 'India'
    },
    contactProfile: {
      loanAmountLeft: 9500,
      responseRate: 0.25,
      currentContactFreq: 12,
      contactChannels: ['email', 'sms', 'whatsapp'],
      lastContactAt: new Date('2025-02-05'),
      tone: 'urgent'
    },
    interactionHistory: [
      {
        channel: 'email',
        sentAt: new Date('2025-01-15'),
        openedAt: new Date('2025-01-16'),
        tone: 'empathetic',
        status: 'opened'
      },
      {
        channel: 'sms',
        sentAt: new Date('2025-01-25'),
        tone: 'urgent',
        status: 'sent'
      },
      {
        channel: 'whatsapp',
        sentAt: new Date('2025-02-05'),
        tone: 'urgent',
        status: 'sent'
      }
    ]
  },
  {
    id: 'LOAN_003',
    borrower: {
      annual_inc: 120000,
      emp_length: '10+ years',
      home_ownership: 'OWN',
      verification_status: 'Verified',
      dti: 12.3,
      fico_range_low: 780,
      fico_range_high: 810
    },
    loan_details: {
      loan_amnt: 50000,
      term: ' 36 months',
      int_rate: 6.5,
      installment: 1534.56,
      purpose: 'home_improvement',
      grade: 'A',
      sub_grade: 'A1'
    },
    credit_behavior: {
      delinq_2yrs: 0,
      inq_last_6mths: 0,
      open_acc: 12,
      revol_bal: 5000,
      revol_util: 12.5,
      total_acc: 25
    },
    repayment: {
      loan_status: 'Current',
      total_pymnt: 35000,
      total_rec_prncp: 33000,
      last_pymnt_d: new Date('2025-02-01'),
      last_pymnt_amnt: 1534.56,
      recoveries: 0
    },
    customer_contact: {
      name: 'Amit Patel',
      email: 'amit.patel@example.com',
      phone: '+91-9988776655',
      city: 'Ahmedabad',
      state: 'Gujarat',
      postal_code: '380001',
      country: 'India'
    },
    contactProfile: {
      loanAmountLeft: 17000,
      responseRate: 0.95,
      currentContactFreq: 3,
      contactChannels: ['email'],
      lastContactAt: new Date('2025-01-25'),
      lastResponseAt: new Date('2025-01-25'),
      tone: 'informational'
    },
    interactionHistory: [
      {
        channel: 'email',
        sentAt: new Date('2025-01-15'),
        openedAt: new Date('2025-01-15'),
        clickedAt: new Date('2025-01-15'),
        respondedAt: new Date('2025-01-15'),
        tone: 'informational',
        status: 'responded'
      }
    ]
  },
  {
    id: 'LOAN_004',
    borrower: {
      annual_inc: 35000,
      emp_length: '< 1 year',
      home_ownership: 'RENT',
      verification_status: 'Not Verified',
      dti: 32.5,
      fico_range_low: 590,
      fico_range_high: 620
    },
    loan_details: {
      loan_amnt: 10000,
      term: ' 36 months',
      int_rate: 22.5,
      installment: 365.48,
      purpose: 'small_business',
      grade: 'E',
      sub_grade: 'E3'
    },
    credit_behavior: {
      delinq_2yrs: 3,
      inq_last_6mths: 5,
      open_acc: 3,
      revol_bal: 6500,
      revol_util: 92.3,
      total_acc: 8
    },
    repayment: {
      loan_status: 'Late (31-120 days)',
      total_pymnt: 2000,
      total_rec_prncp: 1800,
      last_pymnt_d: new Date('2024-11-10'),
      last_pymnt_amnt: 365.48,
      recoveries: 0
    },
    customer_contact: {
      name: 'Vikram Singh',
      email: 'vikram.singh@example.com',
      phone: '+91-9012345678',
      city: 'Delhi',
      state: 'Delhi',
      postal_code: '110001',
      country: 'India'
    },
    contactProfile: {
      loanAmountLeft: 8200,
      responseRate: 0.05,
      currentContactFreq: 25,
      contactChannels: ['email', 'sms', 'whatsapp', 'call'],
      lastContactAt: new Date('2025-02-08'),
      tone: 'firm'
    },
    interactionHistory: []  // No responses
  },
  {
    id: 'LOAN_005',
    borrower: {
      annual_inc: 85000,
      emp_length: '7 years',
      home_ownership: 'MORTGAGE',
      verification_status: 'Verified',
      dti: 20.1,
      fico_range_low: 700,
      fico_range_high: 730
    },
    loan_details: {
      loan_amnt: 30000,
      term: ' 60 months',
      int_rate: 10.5,
      installment: 645.23,
      purpose: 'car',
      grade: 'B',
      sub_grade: 'B2'
    },
    credit_behavior: {
      delinq_2yrs: 0,
      inq_last_6mths: 2,
      open_acc: 9,
      revol_bal: 10000,
      revol_util: 45.2,
      total_acc: 18
    },
    repayment: {
      loan_status: 'Current',
      total_pymnt: 18000,
      total_rec_prncp: 16500,
      last_pymnt_d: new Date('2025-02-05'),
      last_pymnt_amnt: 645.23,
      recoveries: 0
    },
    customer_contact: {
      name: 'Sneha Reddy',
      email: 'sneha.reddy@example.com',
      phone: '+91-9876501234',
      city: 'Hyderabad',
      state: 'Telangana',
      postal_code: '500001',
      country: 'India'
    },
    contactProfile: {
      loanAmountLeft: 13500,
      responseRate: 0.60,
      currentContactFreq: 7,
      contactChannels: ['email', 'whatsapp'],
      lastContactAt: new Date('2025-02-03'),
      lastResponseAt: new Date('2025-02-03'),
      tone: 'supportive'
    },
    interactionHistory: [
      {
        channel: 'email',
        sentAt: new Date('2025-01-20'),
        openedAt: new Date('2025-01-20'),
        tone: 'informational',
        status: 'opened'
      },
      {
        channel: 'whatsapp',
        sentAt: new Date('2025-02-03'),
        openedAt: new Date('2025-02-03'),
        respondedAt: new Date('2025-02-03'),
        tone: 'supportive',
        status: 'responded'
      }
    ]
  }
];

async function seedDatabase() {
  console.log('='.repeat(60));
  console.log('SEED TEST DATA SCRIPT');
  console.log('='.repeat(60));

  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/emi-intelligence';
    console.log(`\n📡 Connecting to MongoDB: ${mongoUri}`);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB\n');

    // Clear existing test data (optional)
    const shouldClear = process.argv.includes('--clear');
    if (shouldClear) {
      console.log('🗑️  Clearing existing loan data...');
      await Loan.deleteMany({});
      console.log('  ✓ Cleared loans collection\n');
    }

    // Insert sample loans
    console.log(`📝 Inserting ${sampleLoans.length} sample loans...`);
    
    for (const loanData of sampleLoans) {
      try {
        const loan = new Loan(loanData);
        await loan.save();
        console.log(`  ✓ Created loan: ${loanData.id} - ${loanData.customer_contact.name}`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`  ⏭️  Loan ${loanData.id} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    console.log('');

    // Verify
    const totalLoans = await Loan.countDocuments();
    console.log(`✅ Database now contains ${totalLoans} loans\n`);

    // Show loan summary
    console.log('📊 Loan Summary by Status:');
    const statuses = await Loan.aggregate([
      {
        $group: {
          _id: '$repayment.loan_status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    statuses.forEach(s => {
      console.log(`  ${s._id}: ${s.count}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED DATA COMPLETE');
    console.log('='.repeat(60));
    console.log('\nNext steps:');
    console.log('  1. Run: npm start (to start the backend)');
    console.log('  2. Start Redis: redis-server');
    console.log('  3. Start AI agents in separate terminals:');
    console.log('     - python ai-agents/agent_data_collector.py');
    console.log('     - python ai-agents/agent_strategy_decider.py');
    console.log('     - python ai-agents/agent_message_executor.py');
    console.log('  4. Test with: POST /api/webhooks/payment/received');
    console.log('');

  } catch (error) {
    console.error('\n❌ SEED DATA FAILED');
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed\n');
  }
}

// Run the seeding
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase;