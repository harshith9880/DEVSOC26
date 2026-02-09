require('dotenv').config();
const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const FeedbackHistory = require('../models/FeedbackHistory');
const Event = require('../models/Event');

/**
 * Database Initialization Script
 * Sets up MongoDB database, creates indexes, and prepares collections
 */

async function initializeDatabase() {
  console.log('='.repeat(60));
  console.log('DATABASE INITIALIZATION SCRIPT');
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

    // Drop existing collections if they exist (CAREFUL: This deletes data!)
    const shouldDrop = process.argv.includes('--drop');
    
    if (shouldDrop) {
      console.log('⚠️  DROP MODE: Dropping existing collections...');
      
      try {
        await mongoose.connection.dropCollection('loans');
        console.log('  ✓ Dropped loans collection');
      } catch (e) {
        console.log('  - loans collection does not exist (skip)');
      }
      
      try {
        await mongoose.connection.dropCollection('feedback_history');
        console.log('  ✓ Dropped feedback_history collection');
      } catch (e) {
        console.log('  - feedback_history collection does not exist (skip)');
      }
      
      try {
        await mongoose.connection.dropCollection('events');
        console.log('  ✓ Dropped events collection');
      } catch (e) {
        console.log('  - events collection does not exist (skip)');
      }
      
      console.log('');
    }

    // Create collections
    console.log('📋 Creating collections...');
    
    // Create Loans collection
    await Loan.createCollection();
    console.log('  ✓ Created loans collection');
    
    // Create FeedbackHistory collection
    await FeedbackHistory.createCollection();
    console.log('  ✓ Created feedback_history collection');
    
    // Create Events collection
    await Event.createCollection();
    console.log('  ✓ Created events collection');

    console.log('');

    // Create indexes
    console.log('🔍 Creating indexes...');
    
    await Loan.createIndexes();
    console.log('  ✓ Created indexes for loans');
    
    await FeedbackHistory.createIndexes();
    console.log('  ✓ Created indexes for feedback_history');
    
    await Event.createIndexes();
    console.log('  ✓ Created indexes for events');

    console.log('');

    // Verify collections
    console.log('✅ Verifying database setup...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('  Collections:', collections.map(c => c.name).join(', '));

    // Count documents
    const loanCount = await Loan.countDocuments();
    const feedbackCount = await FeedbackHistory.countDocuments();
    const eventCount = await Event.countDocuments();

    console.log('\n📊 Current document counts:');
    console.log(`  - Loans: ${loanCount}`);
    console.log(`  - Feedback History: ${feedbackCount}`);
    console.log(`  - Events: ${eventCount}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ DATABASE INITIALIZATION COMPLETE');
    console.log('='.repeat(60));
    console.log('\nNext steps:');
    console.log('  1. Run: npm run seed     (to add test data)');
    console.log('  2. Run: npm start        (to start the backend)');
    console.log('  3. Start AI agents       (cd ../ai-agents && python agent_*.py)');
    console.log('');

  } catch (error) {
    console.error('\n❌ DATABASE INITIALIZATION FAILED');
    console.error('Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed\n');
  }
}

// Run the initialization
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = initializeDatabase;