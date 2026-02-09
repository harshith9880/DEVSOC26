const mongoose = require('mongoose');

/**
 * Event Model
 * Tracks all events published to the Redis event bus
 * Useful for debugging, auditing, and replaying events
 */
const eventSchema = new mongoose.Schema({
  // ===== EVENT IDENTIFICATION =====
  event_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  event_type: {
    type: String,
    required: true,
    enum: [
      // Webhook events
      'CUSTOMER_RESPONDED',
      'PAYMENT_MADE',
      'EMAIL_OPENED',
      'EMAIL_CLICKED',
      'WHATSAPP_REPLIED',
      'SMS_REPLIED',
      'CALL_ANSWERED',
      
      // Agent events
      'DATA_COLLECTED',
      'PROFILE_UPDATED',
      'STRATEGY_DECIDED',
      'STRATEGY_FAILED',
      'MESSAGE_SENT',
      'MESSAGE_FAILED',
      
      // System events
      'AGENT_HEALTH',
      'SYSTEM_ERROR'
    ],
    index: true
  },

  // ===== LOAN/CUSTOMER REFERENCE =====
  loan_id: {
    type: String,
    index: true
  },

  // ===== EVENT PAYLOAD =====
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // ===== EVENT SOURCE =====
  source: {
    type: {
      type: String,
      enum: ['webhook', 'agent', 'system', 'scheduler'],
      required: true
    },
    agent_id: String,
    agent_name: String,
    webhook_name: String
  },

  // ===== PUBLISHING INFO =====
  published_to_redis: {
    type: Boolean,
    default: false
  },

  redis_topic: String,
  
  publish_timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },

  // ===== PROCESSING INFO =====
  processed_by_agents: [{
    agent_id: String,
    agent_name: String,
    processed_at: Date,
    success: Boolean,
    error: String
  }],

  // ===== STATUS =====
  status: {
    type: String,
    enum: ['pending', 'published', 'processed', 'failed'],
    default: 'pending',
    index: true
  },

  error: String,

  // ===== METADATA =====
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }

}, {
  timestamps: true,
  collection: 'events'
});

// ===== INDEXES =====
eventSchema.index({ event_type: 1, publish_timestamp: -1 });
eventSchema.index({ loan_id: 1, publish_timestamp: -1 });
eventSchema.index({ status: 1, publish_timestamp: -1 });
eventSchema.index({ 'source.type': 1, event_type: 1 });

// ===== STATICS =====
/**
 * Get events for a specific loan
 */
eventSchema.statics.getForLoan = function(loan_id, limit = 50) {
  return this.find({ loan_id })
    .sort({ publish_timestamp: -1 })
    .limit(limit)
    .exec();
};

/**
 * Get unprocessed events
 */
eventSchema.statics.getUnprocessed = function(limit = 100) {
  return this.find({ status: { $in: ['pending', 'published'] } })
    .sort({ publish_timestamp: 1 })
    .limit(limit)
    .exec();
};

/**
 * Get event statistics
 */
eventSchema.statics.getStats = async function(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        publish_timestamp: { $gte: since }
      }
    },
    {
      $group: {
        _id: '$event_type',
        count: { $sum: 1 },
        success_count: {
          $sum: { $cond: [{ $eq: ['$status', 'processed'] }, 1, 0] }
        },
        failed_count: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// ===== METHODS =====
/**
 * Mark event as processed by an agent
 */
eventSchema.methods.markProcessed = function(agent_id, agent_name, success = true, error = null) {
  if (!this.processed_by_agents) {
    this.processed_by_agents = [];
  }
  
  this.processed_by_agents.push({
    agent_id,
    agent_name,
    processed_at: new Date(),
    success,
    error
  });
  
  if (success) {
    this.status = 'processed';
  } else {
    this.status = 'failed';
    this.error = error;
  }
  
  return this.save();
};

// TTL index - automatically delete events older than 30 days
eventSchema.index(
  { publish_timestamp: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }  // 30 days
);

module.exports = mongoose.model('Event', eventSchema);