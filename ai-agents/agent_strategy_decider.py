"""
AGENT 2: Strategy Decision Agent
Analyzes customer data using Intelligence Engine
Decides optimal collection strategy (channel, tone, timing, frequency)
Publishes STRATEGY_DECIDED event to trigger Agent 3
"""
import logging
import uuid
from datetime import datetime
from typing import Dict, Optional
from event_bus import get_event_bus
from mcp_client import MCPClient
from config import EVENT_TOPICS, AGENT_NAME, AGENT_ID, PERSONAS

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [AGENT-2-STRATEGY] - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class StrategyDeciderAgent:
    """
    Agent 2: Strategy Decision Agent
    
    Responsibilities:
    - Listen for DATA_COLLECTED events from Agent 1
    - Trigger intelligence analysis via backend
    - Extract strategy recommendations
    - Decide next best action (channel, tone, timing)
    - Publish STRATEGY_DECIDED event for Agent 3
    """
    
    def __init__(self):
        self.agent_id = AGENT_ID
        self.agent_name = AGENT_NAME or "StrategyDeciderAgent"
        self.event_bus = get_event_bus()
        self.mcp_client = MCPClient()
        
        # Track processed events
        self.processed_events = set()
        
        logger.info(f"🤖 {self.agent_name} ({self.agent_id}) initialized")
    
    def start(self):
        """Start listening for DATA_COLLECTED events from Agent 1"""
        logger.info(f"🎧 {self.agent_name} starting event listener...")
        
        # Check backend health
        if not self.mcp_client.health_check():
            logger.error("❌ Backend not reachable! Cannot start agent.")
            return
        
        logger.info("✅ Backend connection established")
        
        # Subscribe to DATA_COLLECTED events (from Agent 1)
        topics = [EVENT_TOPICS["DATA_COLLECTED"]]
        
        logger.info(f"👂 Subscribing to: {topics}")
        
        # Blocking call
        self.event_bus.subscribe(topics, self.handle_event)
    
    def handle_event(self, topic: str, data: Dict):
        """
        Handle DATA_COLLECTED events from Agent 1
        
        Args:
            topic: Should be 'data.collected'
            data: Event payload from Agent 1
        """
        try:
            event_id = data.get('event_id')
            
            # Avoid duplicates
            if event_id in self.processed_events:
                logger.debug(f"⏭️  Skipping duplicate event {event_id}")
                return
            
            self.processed_events.add(event_id)
            if len(self.processed_events) > 1000:
                self.processed_events.clear()
            
            loan_id = data.get('loan_id')
            if not loan_id:
                logger.warning(f"⚠️  Event missing loan_id: {data}")
                return
            
            trigger_analysis = data.get('trigger_analysis', False)
            
            logger.info(
                f"📥 Received DATA_COLLECTED for {loan_id} "
                f"(trigger_analysis={trigger_analysis})"
            )
            
            # Only analyze if Agent 1 says we should
            if trigger_analysis:
                self.analyze_and_decide_strategy(loan_id, data)
            else:
                logger.info(f"ℹ️  Skipping analysis for {loan_id} (not triggered)")
                
        except Exception as e:
            logger.error(f"❌ Error handling event: {e}", exc_info=True)
    
    def analyze_and_decide_strategy(self, loan_id: str, context_data: Dict):
        """
        Main decision logic
        
        Steps:
        1. Get recommendation from MCP backend (triggers intelligence analysis)
        2. Extract strategy components
        3. Build decision payload
        4. Publish STRATEGY_DECIDED event for Agent 3
        """
        logger.info(f"🧠 Analyzing strategy for {loan_id}...")
        
        # Step 1: Get AI recommendation from backend
        # This internally calls RepaymentIntelligence service
        recommendation = self.mcp_client.get_recommendation(loan_id)
        
        if not recommendation:
            logger.error(f"❌ Failed to get recommendation for {loan_id}")
            self.publish_strategy_failed(loan_id, "NO_RECOMMENDATION")
            return
        
        # Step 2: Extract key components
        strategy = self._extract_strategy(recommendation, context_data)
        
        if not strategy:
            logger.error(f"❌ Failed to extract strategy for {loan_id}")
            self.publish_strategy_failed(loan_id, "EXTRACTION_FAILED")
            return
        
        # Step 3: Validate strategy
        if not self._validate_strategy(strategy):
            logger.error(f"❌ Strategy validation failed for {loan_id}")
            self.publish_strategy_failed(loan_id, "VALIDATION_FAILED")
            return
        
        # Step 4: Check timing constraints
        if not strategy.get('can_send_now', True):
            wait_hours = strategy.get('wait_hours', 24)
            logger.warning(
                f"⏸️  Should wait {wait_hours}h before contacting {loan_id}"
            )
            # Don't publish STRATEGY_DECIDED yet - wait period active
            return
        
        # Step 5: Publish STRATEGY_DECIDED event for Agent 3
        self.publish_strategy_decided(strategy)
    
    def _extract_strategy(
        self,
        recommendation: Dict,
        context_data: Dict
    ) -> Optional[Dict]:
        """
        Extract strategy components from backend recommendation
        
        Returns:
            Strategy dict with all info Agent 3 needs to execute
        """
        try:
            strategy = {
                # Identifiers
                "loan_id": recommendation.get('loan_id'),
                
                # Customer info
                "customer": recommendation.get('customer', {}),
                
                # Strategy components (WHAT to send)
                "channel": recommendation.get('recommended_channel'),
                "tone": recommendation.get('recommended_tone'),
                "message_template": recommendation.get('message_template'),
                
                # Timing (WHEN to send)
                "can_send_now": recommendation.get('can_send_now', True),
                "suggested_send_time": recommendation.get('suggested_send_time'),
                "wait_hours": recommendation.get('wait_hours', 0),
                
                # Frequency (HOW OFTEN)
                "max_intensity": recommendation.get('max_intensity'),
                "current_contact_count": recommendation.get('current_contact_count', 0),
                "should_wait": recommendation.get('should_wait', False),
                
                # Context (WHY this strategy)
                "persona": recommendation.get('persona'),
                "confidence": recommendation.get('confidence'),
                "risk_score": recommendation.get('risk_score'),
                "engagement_score": recommendation.get('engagement_score'),
                
                # Alternatives
                "alternative_strategies": recommendation.get('alternative_strategies', []),
                
                # Metadata
                "decided_at": datetime.now().isoformat(),
                "decided_by_agent": self.agent_name,
                "trigger_reason": context_data.get('data', {}).get('reason', 'UNKNOWN')
            }
            
            # Add loan amount if available
            if 'loan_amount_left' in recommendation:
                strategy['loan_amount'] = recommendation['loan_amount_left']
            
            logger.info(
                f"✅ Extracted strategy: {strategy['channel']} / {strategy['tone']} "
                f"for {strategy['persona']} (confidence: {strategy['confidence']:.2f})"
            )
            
            return strategy
            
        except Exception as e:
            logger.error(f"❌ Strategy extraction error: {e}")
            return None
    
    def _validate_strategy(self, strategy: Dict) -> bool:
        """Validate that strategy has all required fields"""
        required_fields = [
            'loan_id',
            'customer',
            'channel',
            'tone',
            'message_template',
            'persona'
        ]
        
        for field in required_fields:
            if not strategy.get(field):
                logger.error(f"❌ Missing required field: {field}")
                return False
        
        # Validate channel
        valid_channels = ['email', 'sms', 'whatsapp', 'call']
        if strategy['channel'] not in valid_channels:
            logger.error(f"❌ Invalid channel: {strategy['channel']}")
            return False
        
        # Validate tone
        valid_tones = ['informational', 'empathetic', 'supportive', 'urgent', 'firm']
        if strategy['tone'] not in valid_tones:
            logger.error(f"❌ Invalid tone: {strategy['tone']}")
            return False
        
        return True
    
    def publish_strategy_decided(self, strategy: Dict):
        """
        Publish STRATEGY_DECIDED event to trigger Agent 3
        
        This is the OUTPUT of Agent 2 and INPUT to Agent 3
        """
        event_payload = {
            "event_id": str(uuid.uuid4()),
            "agent_id": self.agent_id,
            "agent_name": self.agent_name,
            "loan_id": strategy['loan_id'],
            "strategy": strategy,
            "timestamp": datetime.now().isoformat()
        }
        
        success = self.event_bus.publish(
            EVENT_TOPICS["STRATEGY_DECIDED"],
            event_payload
        )
        
        if success:
            logger.info(
                f"✅ Published STRATEGY_DECIDED for {strategy['loan_id']}: "
                f"{strategy['channel']} / {strategy['tone']}"
            )
        else:
            logger.error(f"❌ Failed to publish STRATEGY_DECIDED event")
    
    def publish_strategy_failed(self, loan_id: str, reason: str):
        """Publish failure event for monitoring"""
        event_payload = {
            "event_id": str(uuid.uuid4()),
            "agent_id": self.agent_id,
            "loan_id": loan_id,
            "reason": reason,
            "timestamp": datetime.now().isoformat()
        }
        
        self.event_bus.publish(
            EVENT_TOPICS["STRATEGY_FAILED"],
            event_payload
        )
        
        logger.error(f"❌ Strategy decision failed for {loan_id}: {reason}")


def main():
    """Main entry point for Agent 2"""
    logger.info("=" * 60)
    logger.info("AGENT 2: STRATEGY DECISION AGENT")
    logger.info("=" * 60)
    
    agent = StrategyDeciderAgent()
    
    try:
        agent.start()
    except KeyboardInterrupt:
        logger.info("\n🛑 Agent stopped by user")
    except Exception as e:
        logger.error(f"❌ Agent crashed: {e}", exc_info=True)


if __name__ == "__main__":
    main()