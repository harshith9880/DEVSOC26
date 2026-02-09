const redis = require('redis');
const { v4: uuidv4 } = require('uuid');
const Event = require('../models/Event');

/**
 * EventPublisher - Publishes events to Redis event bus
 * Used by webhooks to notify AI agents of customer interactions
 */
class EventPublisher {
  constructor() {
    this.client = null;
    this.connected = false;
    this.retryAttempts = 0;
    this.maxRetries = 5;
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    if (this.connected) {
      return true;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = redis.createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > this.maxRetries) {
              console.error('❌ Max Redis reconnection attempts reached');
              return new Error('Max retries reached');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err);
        this.connected = false;
      });

      this.client.on('connect', () => {
        console.log('🔌 Redis client connecting...');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis client ready');
        this.connected = true;
        this.retryAttempts = 0;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis client reconnecting...');
        this.retryAttempts++;
      });

      await this.client.connect();
      return true;

    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error.message);
      this.connected = false;
      return false;
    }
  }

  /**
   * Publish event to Redis and store in MongoDB
   * 
   * @param {string} eventType - Event type (e.g., 'PAYMENT_MADE')
   * @param {object} payload - Event data
   * @param {object} options - Additional options
   * @returns {Promise<object>} - Event record
   */
  async publish(eventType, payload, options = {}) {
    const event_id = options.event_id || uuidv4();
    const loan_id = payload.loan_id || options.loan_id;

    // Define topic mapping
    const topicMap = {
      // Webhook events
      'CUSTOMER_RESPONDED': 'customer.responded',
      'PAYMENT_MADE': 'payment.made',
      'EMAIL_OPENED': 'email.opened',
      'EMAIL_CLICKED': 'email.clicked',
      'WHATSAPP_REPLIED': 'whatsapp.replied',
      'SMS_REPLIED': 'sms.replied',
      'CALL_ANSWERED': 'call.answered',
      
      // Agent events
      'DATA_COLLECTED': 'data.collected',
      'PROFILE_UPDATED': 'profile.updated',
      'STRATEGY_DECIDED': 'strategy.decided',
      'STRATEGY_FAILED': 'strategy.failed',
      'MESSAGE_SENT': 'message.sent',
      'MESSAGE_FAILED': 'message.failed',
      
      // System events
      'AGENT_HEALTH': 'agent.health',
      'SYSTEM_ERROR': 'system.error'
    };

    const topic = topicMap[eventType] || eventType.toLowerCase().replace(/_/g, '.');

    // Create event record in MongoDB
    const eventRecord = new Event({
      event_id,
      event_type: eventType,
      loan_id,
      payload,
      source: {
        type: options.source_type || 'webhook',
        agent_id: options.agent_id,
        agent_name: options.agent_name,
        webhook_name: options.webhook_name
      },
      redis_topic: topic,
      metadata: options.metadata || {}
    });

    try {
      // Ensure Redis connection
      if (!this.connected) {
        await this.connect();
      }

      if (!this.connected) {
        // Redis unavailable - save to DB for retry later
        console.warn('⚠️  Redis not available. Event saved to DB for retry.');
        eventRecord.status = 'pending';
        await eventRecord.save();
        return { success: false, event_id, message: 'Redis unavailable' };
      }

      // Publish to Redis
      const message = JSON.stringify({
        event_id,
        event_type: eventType,
        loan_id,
        ...payload,
        timestamp: new Date().toISOString()
      });

      const subscriberCount = await this.client.publish(topic, message);

      // Update event record
      eventRecord.published_to_redis = true;
      eventRecord.status = subscriberCount > 0 ? 'published' : 'pending';
      await eventRecord.save();

      console.log(
        `📢 Published ${eventType} to '${topic}' ` +
        `(${subscriberCount} subscribers) - Event ID: ${event_id}`
      );

      return {
        success: true,
        event_id,
        topic,
        subscriber_count: subscriberCount,
        message: 'Event published successfully'
      };

    } catch (error) {
      console.error(`❌ Failed to publish event ${event_id}:`, error);
      
      // Save to DB with error status
      eventRecord.status = 'failed';
      eventRecord.error = error.message;
      await eventRecord.save();

      return {
        success: false,
        event_id,
        error: error.message
      };
    }
  }

  /**
   * Retry publishing failed events
   */
  async retryFailedEvents(limit = 100) {
    try {
      const failedEvents = await Event.find({
        status: { $in: ['pending', 'failed'] },
        published_to_redis: false
      })
        .sort({ publish_timestamp: 1 })
        .limit(limit);

      console.log(`🔄 Retrying ${failedEvents.length} failed events...`);

      let successCount = 0;
      for (const event of failedEvents) {
        const result = await this.publish(
          event.event_type,
          event.payload,
          {
            event_id: event.event_id,
            loan_id: event.loan_id,
            source_type: event.source.type,
            metadata: event.metadata
          }
        );

        if (result.success) {
          successCount++;
        }
      }

      console.log(`✅ Successfully retried ${successCount}/${failedEvents.length} events`);
      return { total: failedEvents.length, success: successCount };

    } catch (error) {
      console.error('❌ Error retrying failed events:', error);
      return { error: error.message };
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.connected = false;
      console.log('🔌 Redis connection closed');
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.connected) {
        await this.connect();
      }
      
      if (!this.connected) {
        return { healthy: false, message: 'Not connected to Redis' };
      }

      await this.client.ping();
      return { healthy: true, message: 'Redis connection healthy' };
    } catch (error) {
      return { healthy: false, message: error.message };
    }
  }
}

// Singleton instance
let eventPublisher = null;

function getEventPublisher() {
  if (!eventPublisher) {
    eventPublisher = new EventPublisher();
  }
  return eventPublisher;
}

module.exports = {
  EventPublisher,
  getEventPublisher
};