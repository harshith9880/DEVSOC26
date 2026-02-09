"""
AGENT 3: Message Execution Agent
Generates personalized messages using LLM
Sends messages via appropriate channels (Email/SMS/WhatsApp/Call)
Registers sent messages with backend for tracking
Publishes MESSAGE_SENT event
"""
import logging
import uuid
from datetime import datetime
from typing import Dict, Optional
from event_bus import get_event_bus
from mcp_client import MCPClient
from message_generator import MessageGenerator
from config import EVENT_TOPICS, AGENT_NAME, AGENT_ID, AI_MODEL

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [AGENT-3-EXECUTOR] - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MessageExecutorAgent:
    """
    Agent 3: Message Execution Agent
    
    Responsibilities:
    - Listen for STRATEGY_DECIDED events from Agent 2
    - Generate personalized message using LLM
    - Send message via appropriate channel
    - Register message with backend for tracking
    - Publish MESSAGE_SENT event
    """
    
    def __init__(self):
        self.agent_id = AGENT_ID
        self.agent_name = AGENT_NAME or "MessageExecutorAgent"
        self.event_bus = get_event_bus()
        self.mcp_client = MCPClient()
        self.message_generator = MessageGenerator(model=AI_MODEL)
        
        # Track processed events
        self.processed_events = set()
        
        # Message sending simulation mode (set to True for testing without real channels)
        self.simulation_mode = True  # TODO: Set to False when integrating real channels
        
        logger.info(f"🤖 {self.agent_name} ({self.agent_id}) initialized")
        if self.simulation_mode:
            logger.warning("⚠️  Running in SIMULATION MODE - messages not actually sent")
    
    def start(self):
        """Start listening for STRATEGY_DECIDED events from Agent 2"""
        logger.info(f"🎧 {self.agent_name} starting event listener...")
        
        # Check backend health
        if not self.mcp_client.health_check():
            logger.error("❌ Backend not reachable! Cannot start agent.")
            return
        
        logger.info("✅ Backend connection established")
        
        # Subscribe to STRATEGY_DECIDED events (from Agent 2)
        topics = [EVENT_TOPICS["STRATEGY_DECIDED"]]
        
        logger.info(f"👂 Subscribing to: {topics}")
        
        # Blocking call
        self.event_bus.subscribe(topics, self.handle_event)
    
    def handle_event(self, topic: str, data: Dict):
        """
        Handle STRATEGY_DECIDED events from Agent 2
        
        Args:
            topic: Should be 'strategy.decided'
            data: Event payload from Agent 2 containing strategy
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
            
            strategy = data.get('strategy')
            if not strategy:
                logger.warning(f"⚠️  Event missing strategy: {data}")
                return
            
            loan_id = strategy.get('loan_id')
            logger.info(
                f"📥 Received STRATEGY_DECIDED for {loan_id}: "
                f"{strategy.get('channel')} / {strategy.get('tone')}"
            )
            
            # Execute the strategy
            self.execute_strategy(strategy)
            
        except Exception as e:
            logger.error(f"❌ Error handling event: {e}", exc_info=True)
    
    def execute_strategy(self, strategy: Dict):
        """
        Execute the collection strategy
        
        Steps:
        1. Generate personalized message using LLM
        2. Send message via channel
        3. Register with backend
        4. Publish MESSAGE_SENT event
        """
        loan_id = strategy['loan_id']
        
        logger.info(f"🎯 Executing strategy for {loan_id}...")
        
        # Step 1: Generate personalized message
        message = self._generate_message(strategy)
        
        if not message:
            logger.error(f"❌ Failed to generate message for {loan_id}")
            self.publish_message_failed(loan_id, "GENERATION_FAILED")
            return
        
        # Step 2: Send message via channel
        message_id = f"msg_{uuid.uuid4().hex[:12]}"
        channel = strategy['channel']
        customer = strategy['customer']
        
        send_result = self._send_message(
            channel=channel,
            recipient=customer,
            message=message,
            message_id=message_id
        )
        
        if not send_result['success']:
            logger.error(f"❌ Failed to send message to {loan_id}")
            self.publish_message_failed(loan_id, "SEND_FAILED")
            return
        
        # Step 3: Register with backend for tracking
        registration_success = self._register_with_backend(
            loan_id=loan_id,
            channel=channel,
            message_id=message_id,
            message_content=message,
            tone=strategy['tone'],
            strategy=strategy
        )
        
        if not registration_success:
            logger.warning(f"⚠️  Message sent but registration failed for {loan_id}")
        
        # Step 4: Publish MESSAGE_SENT event
        self.publish_message_sent(
            loan_id=loan_id,
            message_id=message_id,
            channel=channel,
            strategy=strategy
        )
    
    def _generate_message(self, strategy: Dict) -> Optional[str]:
        """
        Generate personalized message using LLM or template
        
        Args:
            strategy: Strategy dict from Agent 2
            
        Returns:
            Generated message string or None if failed
        """
        try:
            customer = strategy['customer']
            
            message = self.message_generator.generate_message(
                customer_name=customer.get('name', 'Customer'),
                loan_amount=strategy.get('loan_amount', 0),
                channel=strategy['channel'],
                tone=strategy['tone'],
                persona=strategy.get('persona', 'UNKNOWN'),
                template=strategy['message_template'] if isinstance(strategy['message_template'], str) 
                         else strategy['message_template'].get('body', str(strategy['message_template'])),
                additional_context={
                    'response_rate': strategy.get('engagement_score', 0),
                    'contact_count': strategy.get('current_contact_count', 0),
                    'risk_score': strategy.get('risk_score', 0),
                    'confidence': strategy.get('confidence', 0)
                }
            )
            
            logger.info(
                f"✅ Generated {len(message)} char message "
                f"({strategy['channel']}, {strategy['tone']})"
            )
            logger.debug(f"Message preview: {message[:100]}...")
            
            return message
            
        except Exception as e:
            logger.error(f"❌ Message generation error: {e}")
            return None
    
    def _send_message(
        self,
        channel: str,
        recipient: Dict,
        message: str,
        message_id: str
    ) -> Dict:
        """
        Send message via appropriate channel
        
        Args:
            channel: Communication channel (email, sms, whatsapp, call)
            recipient: Customer contact info
            message: Message content
            message_id: Unique message identifier
            
        Returns:
            Dict with success status and details
        """
        if self.simulation_mode:
            # Simulate sending
            logger.info(
                f"🎭 [SIMULATED] Sending {channel} to "
                f"{recipient.get('email') or recipient.get('phone')}"
            )
            logger.info(f"📧 Message: {message[:150]}...")
            
            return {
                "success": True,
                "simulated": True,
                "message_id": message_id
            }
        
        # TODO: Integrate with real messaging providers
        # For now, return simulated success
        
        try:
            if channel == 'email':
                return self._send_via_email(recipient, message, message_id)
            elif channel == 'sms':
                return self._send_via_sms(recipient, message, message_id)
            elif channel == 'whatsapp':
                return self._send_via_whatsapp(recipient, message, message_id)
            elif channel == 'call':
                return self._send_via_call(recipient, message, message_id)
            else:
                logger.error(f"❌ Unknown channel: {channel}")
                return {"success": False, "error": "Unknown channel"}
                
        except Exception as e:
            logger.error(f"❌ Send error: {e}")
            return {"success": False, "error": str(e)}
    
    def _send_via_email(self, recipient: Dict, message: str, message_id: str) -> Dict:
        """Send via email (SendGrid/SMTP)"""
        # TODO: Integrate with SendGrid or SMTP
        logger.info(f"📧 [STUB] Would send email to {recipient.get('email')}")
        return {"success": True, "provider": "email_stub"}
    
    def _send_via_sms(self, recipient: Dict, message: str, message_id: str) -> Dict:
        """Send via SMS (Twilio)"""
        # TODO: Integrate with Twilio SMS
        logger.info(f"💬 [STUB] Would send SMS to {recipient.get('phone')}")
        return {"success": True, "provider": "sms_stub"}
    
    def _send_via_whatsapp(self, recipient: Dict, message: str, message_id: str) -> Dict:
        """Send via WhatsApp (Twilio)"""
        # TODO: Integrate with Twilio WhatsApp
        logger.info(f"💚 [STUB] Would send WhatsApp to {recipient.get('phone')}")
        return {"success": True, "provider": "whatsapp_stub"}
    
    def _send_via_call(self, recipient: Dict, message: str, message_id: str) -> Dict:
        """Send via automated call (Twilio Voice)"""
        # TODO: Integrate with Twilio Voice
        logger.info(f"📞 [STUB] Would call {recipient.get('phone')}")
        return {"success": True, "provider": "call_stub"}
    
    def _register_with_backend(
        self,
        loan_id: str,
        channel: str,
        message_id: str,
        message_content: str,
        tone: str,
        strategy: Dict
    ) -> bool:
        """
        Register sent message with backend for tracking
        
        This triggers webhook to update interaction history
        """
        try:
            success = self.mcp_client.register_message_sent(
                loan_id=loan_id,
                channel=channel,
                message_id=message_id,
                message_content=message_content,
                tone=tone,
                sent_by_agent=self.agent_name,
                ai_model=AI_MODEL,
                scheduled_at=strategy.get('decided_at')
            )
            
            if success:
                logger.info(f"✅ Registered message {message_id} with backend")
            else:
                logger.error(f"❌ Failed to register message {message_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Registration error: {e}")
            return False
    
    def publish_message_sent(
        self,
        loan_id: str,
        message_id: str,
        channel: str,
        strategy: Dict
    ):
        """
        Publish MESSAGE_SENT event for monitoring/analytics
        """
        event_payload = {
            "event_id": str(uuid.uuid4()),
            "agent_id": self.agent_id,
            "agent_name": self.agent_name,
            "loan_id": loan_id,
            "message_id": message_id,
            "channel": channel,
            "tone": strategy.get('tone'),
            "persona": strategy.get('persona'),
            "timestamp": datetime.now().isoformat()
        }
        
        success = self.event_bus.publish(
            EVENT_TOPICS["MESSAGE_SENT"],
            event_payload
        )
        
        if success:
            logger.info(
                f"✅ Published MESSAGE_SENT for {loan_id}: "
                f"{message_id} via {channel}"
            )
        else:
            logger.error(f"❌ Failed to publish MESSAGE_SENT event")
    
    def publish_message_failed(self, loan_id: str, reason: str):
        """Publish failure event for monitoring"""
        event_payload = {
            "event_id": str(uuid.uuid4()),
            "agent_id": self.agent_id,
            "loan_id": loan_id,
            "reason": reason,
            "timestamp": datetime.now().isoformat()
        }
        
        self.event_bus.publish(
            EVENT_TOPICS["MESSAGE_FAILED"],
            event_payload
        )
        
        logger.error(f"❌ Message execution failed for {loan_id}: {reason}")


def main():
    """Main entry point for Agent 3"""
    logger.info("=" * 60)
    logger.info("AGENT 3: MESSAGE EXECUTION AGENT")
    logger.info("=" * 60)
    
    agent = MessageExecutorAgent()
    
    try:
        agent.start()
    except KeyboardInterrupt:
        logger.info("\n🛑 Agent stopped by user")
    except Exception as e:
        logger.error(f"❌ Agent crashed: {e}", exc_info=True)


if __name__ == "__main__":
    main()