// MongoDB initialization script
// This runs automatically when MongoDB container starts for the first time

print('========================================');
print('Initializing EMI Intelligence Database');
print('========================================');

// Switch to database
db = db.getSiblingDB('emi-intelligence');

// Create collections
db.createCollection('loans');
db.createCollection('feedback_history');
db.createCollection('events');

print('✅ Collections created');

// Create indexes for loans
db.loans.createIndex({ "id": 1 }, { unique: true });
db.loans.createIndex({ "repayment.loan_status": 1 });
db.loans.createIndex({ "customer_contact.email": 1 });
db.loans.createIndex({ "loan_details.grade": 1, "repayment.loan_status": 1 });
db.loans.createIndex({ "borrower.fico_range_low": 1, "borrower.fico_range_high": 1 });
db.loans.createIndex({ "repayment.last_pymnt_d": -1 });
db.loans.createIndex({ "contactProfile.lastContactAt": -1 });

print('✅ Loan indexes created');

// Create indexes for feedback_history
db.feedback_history.createIndex({ "loan_id": 1, "generated_at": -1 });
db.feedback_history.createIndex({ "repayment_persona": 1 });
db.feedback_history.createIndex({ "analytics.default_risk_score": -1 });
db.feedback_history.createIndex({ "analytics.engagement_score": -1 });

print('✅ Feedback history indexes created');

// Create indexes for events
db.events.createIndex({ "event_id": 1 }, { unique: true });
db.events.createIndex({ "event_type": 1, "publish_timestamp": -1 });
db.events.createIndex({ "loan_id": 1, "publish_timestamp": -1 });
db.events.createIndex({ "status": 1, "publish_timestamp": -1 });
db.events.createIndex({ "source.type": 1, "event_type": 1 });

// TTL index - auto-delete events after 30 days
db.events.createIndex(
  { "publish_timestamp": 1 },
  { expireAfterSeconds: 2592000 }  // 30 days = 30 * 24 * 60 * 60
);

print('✅ Event indexes created');

// Optional: Create application user (uncomment if needed)
/*
db.createUser({
  user: "emi-app",
  pwd: "your-secure-password",
  roles: [
    { role: "readWrite", db: "emi-intelligence" }
  ]
});
print('✅ Application user created');
*/

print('========================================');
print('Database initialization complete!');
print('========================================');