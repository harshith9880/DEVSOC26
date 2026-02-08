const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('🚀 Starting comprehensive tests...\n');

  try {
    // 1. Create test data
    console.log('1️⃣ Creating test loans...');
    await axios.post(`${BASE_URL}/api/test/create-test-loans`);
    console.log('✅ Test loans created\n');

    // 2. Send test messages
    console.log('2️⃣ Sending test messages...');
    await axios.post(`${BASE_URL}/api/simulation/send`, {
      loan_id: 'TEST_001',
      channel: 'email',
      tone: 'informational'
    });
    console.log('✅ Messages sent\n');

    // Wait for webhooks to process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Run intelligence analysis
    console.log('3️⃣ Running intelligence analysis...');
    const analysis = await axios.post(`${BASE_URL}/api/intelligence/analyze/TEST_001`);
    console.log('✅ Analysis complete:');
    console.log(JSON.stringify(analysis.data, null, 2));
    console.log('\n');

    // 4. Get feedback
    console.log('4️⃣ Retrieving feedback...');
    const feedback = await axios.get(`${BASE_URL}/api/intelligence/feedback/TEST_001`);
    console.log('✅ Feedback retrieved:');
    console.log(JSON.stringify(feedback.data, null, 2));

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

runTests();
