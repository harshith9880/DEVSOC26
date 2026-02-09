"""
Event Bus - Redis Pub/Sub wrapper for event-driven agent communication
Enables asynchronous, decoupled communication between the 3 agents
"""
import redis
import json
import logging
from typing import Callable, Dict, List
from config import EVENT_BUS_URL

logger = logging.getLogger(__name__)


class EventBus:
    """Wrapper around Redis Pub/Sub for event publishing and subscribing"""
    
    def __init__(self, redis_url: str = EVENT_BUS_URL):
        try:
            self.redis = redis.Redis.from_url(redis_url, decode_responses=True)
            self.pubsub = self.redis.pubsub()
            
            # Test connection
            self.redis.ping()
            logger.info(f"✅ Connected to Redis at {redis_url}")
            
        except redis.ConnectionError as e:
            logger.error(f"❌ Failed to connect to Redis: {e}")
            raise
    
    def publish(self, topic: str, data: Dict) -> bool:
        """
        Publish an event to a topic
        
        Args:
            topic: Event topic/channel name
            data: Dictionary containing event data
            
        Returns:
            True if published successfully, False otherwise
        """
        try:
            message = json.dumps(data)
            subscribers = self.redis.publish(topic, message)
            
            logger.info(
                f"📢 Published to '{topic}': loan_id={data.get('loan_id', 'N/A')} "
                f"({subscribers} subscribers)"
            )
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to publish to '{topic}': {e}")
            return False
    
    def subscribe(self, topics: List[str], callback: Callable[[str, Dict], None]):
        """
        Subscribe to topics and call callback for each message
        
        Args:
            topics: List of topic names to subscribe to
            callback: Function(topic: str, data: Dict) to handle events
        
        Note: This is a blocking call that runs forever
        """
        try:
            self.pubsub.subscribe(*topics)
            logger.info(f"👂 Subscribed to topics: {topics}")
            logger.info("🎧 Listening for events... (Press Ctrl+C to stop)")
            
            for message in self.pubsub.listen():
                if message['type'] == 'message':
                    try:
                        topic = message['channel']
                        data = json.loads(message['data'])
                        
                        logger.debug(f"📥 Received on '{topic}': {data}")
                        callback(topic, data)
                        
                    except json.JSONDecodeError as e:
                        logger.error(f"❌ Invalid JSON in message: {e}")
                    except Exception as e:
                        logger.error(f"❌ Error processing message: {e}")
                        
        except KeyboardInterrupt:
            logger.info("🛑 Subscription interrupted by user")
            self.pubsub.unsubscribe()
        except Exception as e:
            logger.error(f"❌ Subscription error: {e}")
            raise
    
    def close(self):
        """Close Redis connections"""
        try:
            self.pubsub.close()
            self.redis.close()
            logger.info("🔌 Redis connections closed")
        except Exception as e:
            logger.error(f"❌ Error closing connections: {e}")


# Singleton instance
_event_bus_instance = None

def get_event_bus() -> EventBus:
    """Get or create singleton EventBus instance"""
    global _event_bus_instance
    if _event_bus_instance is None:
        _event_bus_instance = EventBus()
    return _event_bus_instance


if __name__ == "__main__":
    # Test the event bus
    import time
    from config import EVENT_TOPICS
    
    logging.basicConfig(level=logging.INFO)
    
    bus = get_event_bus()
    
    # Test publish
    test_event = {
        "loan_id": "TEST_001",
        "amount": 5000,
        "timestamp": time.time()
    }
    
    bus.publish(EVENT_TOPICS["PAYMENT_MADE"], test_event)
    
    # Test subscribe (run in separate terminal)
    # def handler(topic, data):
    #     print(f"Received: {topic} -> {data}")
    # 
    # bus.subscribe([EVENT_TOPICS["PAYMENT_MADE"]], handler)