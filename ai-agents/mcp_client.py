"""
MCP Client - Interface to backend Decision Intelligence Engine
Handles all HTTP communication with the Node.js backend
"""
import requests
import logging
from typing import Dict, List, Optional
from tenacity import retry, stop_after_attempt, wait_exponential
from config import MCP_BACKEND_URL, MAX_RETRIES

logger = logging.getLogger(__name__)


class MCPClient:
    """Client for communicating with MCP (Message Control Platform) backend"""
    
    def __init__(self, base_url: str = MCP_BACKEND_URL):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'AI-Agent/1.0'
        })
    
    @retry(stop=stop_after_attempt(MAX_RETRIES), wait=wait_exponential(multiplier=1, min=2, max=10))
    def health_check(self) -> bool:
        """Check if backend is reachable"""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=5)
            is_healthy = response.status_code == 200
            
            if is_healthy:
                logger.debug("✅ Backend health check passed")
            else:
                logger.warning(f"⚠️  Backend health check failed: {response.status_code}")
                
            return is_healthy
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Backend health check failed: {e}")
            return False
    
    def get_recommendation(self, loan_id: str) -> Optional[Dict]:
        """
        Get AI recommendation for a customer
        
        Args:
            loan_id: Customer loan ID
            
        Returns:
            Recommendation dict with channel, tone, timing, etc.
            None if request fails
        """
        try:
            response = self.session.get(
                f"{self.base_url}/api/mcp/recommendation/{loan_id}",
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            if data.get('success'):
                recommendation = data.get('recommendation')
                logger.info(f"✅ Got recommendation for {loan_id}: {recommendation.get('recommended_channel')}")
                return recommendation
            else:
                logger.error(f"❌ Recommendation request failed: {data}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Failed to get recommendation for {loan_id}: {e}")
            return None
    
    def get_batch_recommendations(
        self, 
        limit: int = 10,
        priority_filter: Optional[int] = 3
    ) -> List[Dict]:
        """
        Get batch recommendations for multiple customers
        
        Args:
            limit: Maximum number of recommendations
            priority_filter: Minimum priority level (1-5)
            
        Returns:
            List of recommendation dicts
        """
        try:
            params = {
                'limit': limit,
                'priority_filter': priority_filter
            }
            
            response = self.session.get(
                f"{self.base_url}/api/mcp/recommendations/batch",
                params=params,
                timeout=60
            )
            response.raise_for_status()
            
            data = response.json()
            if data.get('success'):
                recommendations = data.get('recommendations', [])
                logger.info(f"✅ Got {len(recommendations)} batch recommendations")
                return recommendations
            else:
                logger.error(f"❌ Batch recommendation request failed: {data}")
                return []
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Failed to get batch recommendations: {e}")
            return []
    
    def register_message_sent(
        self,
        loan_id: str,
        channel: str,
        message_id: str,
        message_content: str,
        tone: str,
        sent_by_agent: str,
        ai_model: str = "gpt-4",
        scheduled_at: Optional[str] = None
    ) -> bool:
        """
        Register that a message was sent
        
        Args:
            loan_id: Customer loan ID
            channel: Communication channel (email, sms, whatsapp, call)
            message_id: Unique message identifier
            message_content: The message text
            tone: Message tone (informational, empathetic, etc.)
            sent_by_agent: Agent name that sent the message
            ai_model: AI model used for generation
            scheduled_at: When message was scheduled (ISO format)
            
        Returns:
            True if registration successful, False otherwise
        """
        try:
            payload = {
                "loan_id": loan_id,
                "channel": channel,
                "message_id": message_id,
                "message_content": message_content,
                "tone": tone,
                "sent_by_agent": sent_by_agent,
                "ai_model": ai_model
            }
            
            if scheduled_at:
                payload["scheduled_at"] = scheduled_at
            
            response = self.session.post(
                f"{self.base_url}/api/mcp/message/sent",
                json=payload,
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            if data.get('success'):
                logger.info(f"✅ Registered message {message_id} for {loan_id}")
                return True
            else:
                logger.error(f"❌ Message registration failed: {data}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Failed to register message: {e}")
            return False
    
    def get_feedback(self, loan_id: str, message_id: str) -> Optional[Dict]:
        """
        Get feedback/engagement data for a sent message
        
        Args:
            loan_id: Customer loan ID
            message_id: Message identifier
            
        Returns:
            Feedback dict with engagement metrics
            None if request fails
        """
        try:
            response = self.session.get(
                f"{self.base_url}/api/mcp/feedback/{loan_id}/{message_id}",
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            if data.get('success'):
                feedback = data.get('feedback')
                logger.info(f"✅ Got feedback for {loan_id}/{message_id}")
                return feedback
            else:
                logger.error(f"❌ Feedback request failed: {data}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Failed to get feedback: {e}")
            return None
    
    def get_stats(self) -> Optional[Dict]:
        """Get system statistics"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/mcp/stats",
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            if data.get('success'):
                return data.get('stats')
            return None
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Failed to get stats: {e}")
            return None
    
    def analyze_customer(self, loan_id: str) -> Optional[Dict]:
        """
        Trigger intelligence analysis for a customer
        
        Args:
            loan_id: Customer loan ID
            
        Returns:
            Analysis feedback with persona, strategies, etc.
        """
        try:
            response = self.session.post(
                f"{self.base_url}/api/intelligence/analyze/{loan_id}",
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            if data.get('success'):
                feedback = data.get('feedback')
                logger.info(
                    f"✅ Analyzed {loan_id}: {feedback.get('repayment_persona')} "
                    f"(confidence: {feedback.get('confidence'):.2f})"
                )
                return feedback
            else:
                logger.error(f"❌ Analysis failed: {data}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Failed to analyze customer {loan_id}: {e}")
            return None


if __name__ == "__main__":
    # Test the MCP client
    logging.basicConfig(level=logging.INFO)
    
    client = MCPClient()
    
    # Test health check
    if client.health_check():
        print("✅ Backend is healthy")
        
        # Test stats
        stats = client.get_stats()
        if stats:
            print(f"📊 Stats: {stats}")
    else:
        print("❌ Backend is not reachable")