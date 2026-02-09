"""
Main AI Agent - Orchestrates the entire collection workflow
"""
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional
from mcp_client import MCPClient
from message_generator import MessageGenerator
from config import AGENT_NAME, AI_MODEL

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class CollectionAgent:
    """AI Agent for intelligent loan collection"""
    
    def __init__(self):
        self.mcp_client = MCPClient()
        self.message_generator = MessageGenerator(model=AI_MODEL)
        self.agent_name = AGENT_NAME
        logger.info(f"🤖 {self.agent_name} initialized with {AI_MODEL}")
    
    def process_single_customer(self, loan_id: str, 
                               use_ai_generation: bool = True,
                               dry_run: bool = False) -> Dict:
        """Process a single customer"""
        logger.info(f"\n{'='*60}")
        logger.info(f"🎯 Processing customer: {loan_id}")
        logger.info(f"{'='*60}")
        
        # Step 1: Get recommendation
        recommendation = self.mcp_client.get_recommendation(loan_id)
        if not recommendation:
            logger.error(f"❌ No recommendation available for {loan_id}")
            return {"success": False, "error": "No recommendation"}
        
        # Step 2: Check if can send now
        if not recommendation.get('can_send_now'):
            wait_hours = recommendation.get('wait_hours', 24)
            logger.warning(f"⏸️  Should wait {wait_hours}h before contacting again")
            return {
                "success": False,
                "reason": "should_wait",
                "wait_hours": wait_hours
            }
        
        # Step 3: Generate message
        channel = recommendation['recommended_channel']
        tone = recommendation['recommended_tone']
        template = recommendation['message_template']
        
        if use_ai_generation:
            logger.info(f"🤖 Generating AI message...")
            message = self.message_generator.generate_message(
                customer_name=recommendation['customer']['name'],
                loan_amount=recommendation.get('loan_amount_left', 0),
                channel=channel,
                tone=tone,
                persona=recommendation['persona'],
                template=template if isinstance(template, str) else template.get('body', str(template)),
                additional_context={
                    'response_rate': recommendation.get('engagement_score', 0),
                    'contact_count': recommendation.get('current_contact_count', 0),
                    'risk_score': recommendation.get('risk_score', 0),
                    'engagement_score': recommendation.get('engagement_score', 0)
                }
            )
        else:
            logger.info(f"📝 Using template message")
            message = template if isinstance(template, str) else template.get('body', str(template))
        
        logger.info(f"\n📧 Generated Message ({channel}, {tone}):")
        logger.info(f"{'-'*60}")
        logger.info(message)
        logger.info(f"{'-'*60}\n")
        
        # Step 4: Send message (simulated or real)
        message_id = f"msg_{uuid.uuid4().hex[:12]}"
        
        if dry_run:
            logger.info(f"🧪 DRY RUN - Message not actually sent")
        else:
            # Here you would integrate with actual messaging providers
            # For now, we just register with backend
            logger.info(f"📤 Sending message via {channel}...")
            self._send_message(
                channel=channel,
                recipient=recommendation['customer'],
                message=message
            )
        
        # Step 5: Register with backend
        logger.info(f"📝 Registering message with backend...")
        success = self.mcp_client.register_message_sent(
            loan_id=loan_id,
            channel=channel,
            message_id=message_id,
            message_content=message,
            tone=tone,
            sent_by_agent=self.agent_name,
            ai_model=AI_MODEL
        )
        
        if success:
            logger.info(f"✅ Successfully processed {loan_id}")
            return {
                "success": True,
                "loan_id": loan_id,
                "message_id": message_id,
                "channel": channel,
                "tone": tone,
                "tracking_url": f"/api/mcp/feedback/{loan_id}/{message_id}"
            }
        else:
            logger.error(f"❌ Failed to register message for {loan_id}")
            return {"success": False, "error": "Registration failed"}
    
    def process_batch(self, limit: int = 10, 
                     priority_filter: Optional[int] = 3,
                     use_ai_generation: bool = True,
                     dry_run: bool = False) -> Dict:
        """Process multiple customers"""
        logger.info(f"\n{'='*60}")
        logger.info(f"📊 Starting batch processing (limit={limit}, priority>={priority_filter})")
        logger.info(f"{'='*60}\n")
        
        # Get batch recommendations
        recommendations = self.mcp_client.get_batch_recommendations(
            limit=limit,
            priority_filter=priority_filter
        )
        
        if not recommendations:
            logger.warning("⚠️  No customers to process")
            return {"success": True, "processed": 0, "results": []}
        
        logger.info(f"📋 Found {len(recommendations)} customers to process\n")
        
        results = []
        for i, rec in enumerate(recommendations, 1):
            logger.info(f"[{i}/{len(recommendations)}] Processing {rec['loan_id']}...")
            
            result = self.process_single_customer(
                loan_id=rec['loan_id'],
                use_ai_generation=use_ai_generation,
                dry_run=dry_run
            )
            results.append(result)
        
        # Summary
        successful = len([r for r in results if r.get('success')])
        logger.info(f"\n{'='*60}")
        logger.info(f"✅ Batch complete: {successful}/{len(results)} successful")
        logger.info(f"{'='*60}\n")
        
        return {
            "success": True,
            "processed": len(results),
            "successful": successful,
            "failed": len(results) - successful,
            "results": results
        }
    
    def analyze_feedback(self, loan_id: str, message_id: str) -> Optional[Dict]:
        """Analyze feedback for a sent message"""
        logger.info(f"\n📊 Analyzing feedback for {loan_id}/{message_id}")
        
        feedback = self.mcp_client.get_feedback(loan_id, message_id)
        if not feedback:
            logger.error("❌ No feedback available")
            return None
        
        metrics = feedback.get('engagement_metrics', {})
        learnings = feedback.get('learnings', {})
        
        logger.info(f"\n📈 Engagement Metrics:")
        logger.info(f"  • Opened: {metrics.get('was_opened', False)}")
        logger.info(f"  • Clicked: {metrics.get('was_clicked', False)}")
        logger.info(f"  • Responded: {metrics.get('was_responded', False)}")
        logger.info(f"  • Response Time: {metrics.get('response_time_seconds', 'N/A')}s")
        
        logger.info(f"\n🎓 Learnings:")
        if learnings:
            channel_perf = learnings.get('channel_performance', {})
            logger.info(f"  • Channel ({channel_perf.get('channel')}): {'✅ Effective' if channel_perf.get('was_effective') else '❌ Not effective'}")
            
            best_practices = feedback.get('best_practices', {})
            if best_practices:
                logger.info(f"  • Best Channel: {best_practices.get('best_channel', {}).get('channel')}")
                logger.info(f"  • Best Time: {best_practices.get('best_time', {}).get('hour')}:00")
                logger.info(f"  • Best Tone: {best_practices.get('best_tone', {}).get('tone')}")
        
        return feedback
    
    def _send_message(self, channel: str, recipient: Dict, message: str):
        """Send message via actual provider (implement based on your providers)"""
        # TODO: Integrate with real messaging providers
        # For now, just simulate
        logger.info(f"📧 [SIMULATED] Sending to {recipient.get('email', recipient.get('phone'))}")
        pass
    
    def get_system_stats(self):
        """Get system statistics"""
        stats = self.mcp_client.get_stats()
        if stats:
            logger.info(f"\n📊 System Statistics:")
            logger.info(f"  • Total Loans: {stats.get('total_loans')}")
            logger.info(f"  • Active Loans: {stats.get('active_loans')}")
            logger.info(f"  • High Risk: {stats.get('high_risk_loans')}")
            logger.info(f"  • Can Contact Now: {stats.get('can_contact_now')}")
            logger.info(f"  • Total Outstanding: ₹{stats.get('total_outstanding', 0):,.2f}")
        return stats


def main():
    """Main entry point"""
    agent = CollectionAgent()
    
    # Check health
    if not agent.mcp_client.health_check():
        logger.error("❌ Backend not reachable! Start the backend server first.")
        return
    
    logger.info("✅ Backend connection successful\n")
    
    # Get system stats
    agent.get_system_stats()
    
    # Example 1: Process single customer
    # agent.process_single_customer("TEST_001", dry_run=False)
    
    # Example 2: Process batch
    agent.process_batch(
        limit=5,
        priority_filter=3,
        use_ai_generation=True,
        dry_run=False
    )
    
    # Example 3: Analyze feedback (after some time)
    # agent.analyze_feedback("TEST_001", "msg_abc123")


if __name__ == "__main__":
    main()
