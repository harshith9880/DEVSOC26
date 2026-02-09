"""
AGENT 1: Data Collection Agent
Monitors customer interactions (payments, responses, opens, clicks)
Aggregates data and updates customer profiles
Publishes DATA_COLLECTED event to trigger Agent 2
"""
import logging
import uuid
from datetime import datetime
from typing import Dict
from event_bus import get_event_bus
from mcp_client import MCPClient
from config import EVENT_TOPICS, AGENT_NAME, AGENT_ID

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [AGENT-1-DATA] - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DataCollectorAgent:
    """
    Agent 1: Data Collection Agent
    
    Responsibilities:
    - Listen for customer interaction events (webhooks trigger these)
    - Aggregate interaction data
    - Update customer profiles
    - Decide when to trigger strategy analysis
    - Publish DATA_COLLECTED event
    """
    
    def __init__(self):
        self.agent_id = AGENT_ID
        self.agent_name = AGENT_NAME or "DataCollectorAgent"
        self.event_bus = get_event_bus()
        self.mcp_client = MCPClient()
        
        # Track processed events to avoid duplicates
        self.processed_events = set()
        
        logger.info(f"🤖 {self.agent_name} ({self.agent_id}) initialized")
    
    def start(self):
        """Start listening for customer interaction events"""
        logger.info(f"🎧 {self.agent_name} starting event listener...")
        
        # Check backend health first
        if not self.mcp_client.health_check():
            logger.error("❌ Backend not reachable! Cannot start agent.")
            return
        
        logger.info("✅ Backend connection established")
        
        # Subscribe to customer interaction events
        topics = [
            EVENT_TOPICS["CUSTOMER_RESPONDED"],
            EVENT_TOPICS["PAYMENT_MADE"],
            EVENT_TOPICS["EMAIL_OPENED"],
            EVENT_TOPICS["EMAIL_CLICKED"],
            EVENT_TOPICS["WHATSAPP_REPLIED"],
            EVENT_TOPICS["SMS_REPLIED"],
            EVENT_TOPICS["CALL_ANSWERED"]
        ]
        
        logger.info(f"👂 Subscribing to: {topics}")
        
        # This is a blocking call - it will run forever
        self.event_bus.subscribe(topics, self.handle_event)
    
    def handle_event(self, topic: str, data: Dict):
        """
        Main event handler - routes events to appropriate processors
        
        Args:
            topic: Event topic name
            data: Event payload
        """
        try:
            event_id = data.get('event_id', str(uuid.uuid4()))
            
            # Avoid duplicate processing
            if event_id in self.processed_events:
                logger.debug(f"⏭️  Skipping duplicate event {event_id}")
                return
            
            self.processed_events.add(event_id)
            
            # Keep only last 1000 event IDs to prevent memory leak
            if len(self.processed_events) > 1000:
                self.processed_events.clear()
            
            loan_id = data.get('loan_id')
            if not loan_id:
                logger.warning(f"⚠️  Event missing loan_id: {data}")
                return
            
            logger.info(f"📥 Processing {topic} for loan_id={loan_id}")
            
            # Route to appropriate handler
            if topic == EVENT_TOPICS["PAYMENT_MADE"]:
                self.handle_payment(data)
            elif topic in [
                EVENT_TOPICS["CUSTOMER_RESPONDED"],
                EVENT_TOPICS["EMAIL_OPENED"],
                EVENT_TOPICS["EMAIL_CLICKED"],
                EVENT_TOPICS["WHATSAPP_REPLIED"],
                EVENT_TOPICS["SMS_REPLIED"],
                EVENT_TOPICS["CALL_ANSWERED"]
            ]:
                self.handle_customer_response(data)
            else:
                logger.warning(f"⚠️  Unknown topic: {topic}")
            
        except Exception as e:
            logger.error(f"❌ Error handling event: {e}", exc_info=True)
    
    def handle_payment(self, data: Dict):
        """
        Handle payment events
        
        Payment events are critical - they indicate positive customer behavior
        and should trigger immediate re-analysis
        """
        loan_id = data['loan_id']
        amount = data.get('amount', 0)
        
        logger.info(f"💰 Payment received: {loan_id} paid ₹{amount:,.2f}")
        
        # Aggregate data: payment means POSITIVE engagement
        aggregated_data = {
            "loan_id": loan_id,
            "event_type": "payment",
            "amount_paid": amount,
            "timestamp": data.get('timestamp', datetime.now().isoformat()),
            "engagement_score_delta": +0.2,  # Payment improves engagement
            "should_trigger_analysis": True,  # Always re-analyze after payment
            "reason": "PAYMENT_RECEIVED"
        }
        
        # Publish DATA_COLLECTED event to trigger Agent 2
        self.publish_data_collected(aggregated_data)
    
    def handle_customer_response(self, data: Dict):
        """
        Handle customer response/engagement events
        (opened email, clicked link, replied to WhatsApp, etc.)
        """
        loan_id = data['loan_id']
        channel = data.get('channel', 'unknown')
        response_type = data.get('response_type', 'responded')
        
        logger.info(f"📧 Customer engagement: {loan_id} {response_type} via {channel}")
        
        # Calculate engagement score impact
        engagement_delta = self._calculate_engagement_delta(response_type)
        
        # Decide if this warrants triggering strategy analysis
        should_trigger = self._should_trigger_analysis(data, engagement_delta)
        
        aggregated_data = {
            "loan_id": loan_id,
            "event_type": "customer_response",
            "channel": channel,
            "response_type": response_type,
            "timestamp": data.get('timestamp', datetime.now().isoformat()),
            "engagement_score_delta": engagement_delta,
            "should_trigger_analysis": should_trigger,
            "reason": f"{response_type.upper()}_VIA_{channel.upper()}"
        }
        
        if should_trigger:
            # Publish DATA_COLLECTED event to trigger Agent 2
            self.publish_data_collected(aggregated_data)
        else:
            logger.info(f"ℹ️  Engagement noted but not triggering analysis (minor event)")
    
    def _calculate_engagement_delta(self, response_type: str) -> float:
        """Calculate how much this response improves engagement score"""
        engagement_weights = {
            "payment": 0.3,
            "replied": 0.2,
            "clicked": 0.15,
            "opened": 0.05,
            "answered": 0.2,
            "delivered": 0.01
        }
        return engagement_weights.get(response_type, 0.1)
    
    def _should_trigger_analysis(self, data: Dict, engagement_delta: float) -> bool:
        """
        Decide if this event should trigger strategy re-analysis
        
        Criteria:
        - High engagement events (replied, clicked) = YES
        - Low engagement events (opened) = NO (unless pattern changes)
        - Payment events = ALWAYS YES
        """
        response_type = data.get('response_type', '')
        
        # Always trigger for high-value interactions
        if response_type in ['replied', 'clicked', 'answered', 'payment']:
            return True
        
        # For low-value interactions, only trigger if it's been a while
        # (This logic can be enhanced with time-based checks)
        if engagement_delta > 0.1:
            return True
        
        return False
    
    def publish_data_collected(self, aggregated_data: Dict):
        """
        Publish DATA_COLLECTED event to trigger Agent 2 (Strategy Decider)
        
        This is the OUTPUT of Agent 1 and INPUT to Agent 2
        """
        event_payload = {
            "event_id": str(uuid.uuid4()),
            "agent_id": self.agent_id,
            "agent_name": self.agent_name,
            "loan_id": aggregated_data['loan_id'],
            "trigger_analysis": aggregated_data.get('should_trigger_analysis', False),
            "data": aggregated_data,
            "timestamp": datetime.now().isoformat()
        }
        
        success = self.event_bus.publish(
            EVENT_TOPICS["DATA_COLLECTED"],
            event_payload
        )
        
        if success:
            logger.info(
                f"✅ Published DATA_COLLECTED for {aggregated_data['loan_id']} "
                f"(trigger_analysis={aggregated_data.get('should_trigger_analysis')})"
            )
        else:
            logger.error(f"❌ Failed to publish DATA_COLLECTED event")


def main():
    """Main entry point for Agent 1"""
    logger.info("=" * 60)
    logger.info("AGENT 1: DATA COLLECTION AGENT")
    logger.info("=" * 60)
    
    agent = DataCollectorAgent()
    
    try:
        agent.start()
    except KeyboardInterrupt:
        logger.info("\n🛑 Agent stopped by user")
    except Exception as e:
        logger.error(f"❌ Agent crashed: {e}", exc_info=True)


if __name__ == "__main__":
    main()