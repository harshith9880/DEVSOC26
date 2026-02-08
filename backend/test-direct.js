console.log('Testing direct require...\n');

try {
  const RI = require('./services/repaymentIntelligence');
  console.log('✅ File found');
  console.log('Type:', typeof RI);
  console.log('Name:', RI.name);
  console.log('Is function:', typeof RI === 'function');
  
  if (typeof RI === 'function') {
    const testLoan = { 
      id: 'TEST', 
      contactProfile: { responseRate: 0.5 }, 
      loan_details: { grade: 'B' }, 
      borrower: { fico_range_low: 680, fico_range_high: 700 },
      credit_behavior: {},
      repayment: {}
    };
    const instance = new RI(testLoan);
    console.log('✅ Constructor works!');
  } else {
    console.log('❌ Not a constructor - it exports:', Object.keys(RI));
  }
} catch (e) {
  console.error('❌ Error:', e.message);
  console.error('Stack:', e.stack);
}
