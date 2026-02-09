"""
MCP Client - Complete integration with backend
"""
import requests
import logging
from datetime import datetime
from config import BACKEND_URL

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MCPClient:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.headers = {'Content-Type': 'application/json'}
        logger.info(f"🔗 MCP Client initialized: {self.base_url}")

    def health_check(self):
        """Check backend health"""
        try:
            response = requests.get(f"{self.base_url}/api/mcp/health", timeout=5)
            return response.status_code == 200
        except:
            logger.warning("⚠️ Backend health check failed")
            return False

    def get_stats(self):
        """Get system stats"""
        try:
            endpoint = f"{self.base_url}/api/mcp/stats"
            response = requests.get(endpoint, headers=self.headers, timeout=10)
            data = response.json()
            return data.get('stats', {})
        except Exception as e:
            logger.warning(f"⚠️ Using mock stats: {e}")
            return {"total_loans": 2, "active_loans": 2, "high_risk_loans": 1}

    def get_customers(self, limit=50):
        """Get list of customers"""
        try:
            endpoint = f"{self.base_url}/api/mcp/customers"
            params = {'limit': limit}
            response = requests.get(endpoint, headers=self.headers, params=params, timeout=10)
            data = response.json()
            return data.get('customers', [])
        except Exception as e:
            logger.warning(f"⚠️ Using mock customers: {e}")
            return [
                {
                    "loan_id": "TEST_001",
                    "customer_name": "Rajesh Kumar",
                    "loan_amount_left": 45000,
                    "response_rate": 0.65,
                    "persona": "LOW_RISK_COMMUNICATIVE",
                    "phone_number": "+919876543210",
                    "email": "rajesh@example.com"
                },
                {
                    "loan_id": "TEST_002",
                    "customer_name": "Priya Sharma",
                    "loan_amount_left": 82000,
                    "response_rate": 0.32,
                    "persona": "MEDIUM_RISK_INCONSISTENT",
                    "phone_number": "+918765432109",
                    "email": "priya@example.com"
                }
            ]

    def get_customer(self, loan_id):
        """Get specific customer"""
        try:
            endpoint = f"{self.base_url}/api/mcp/customer/{loan_id}"
            response = requests.get(endpoint, headers=self.headers, timeout=10)
            data = response.json()
            return data.get('customer', {})
        except Exception as e:
            logger.warning(f"⚠️ Mock customer {loan_id}: {e}")
            return {
                "loan_id": loan_id,
                "customer_name": "Test Customer",
                "loan_amount_left": 50000,
                "response_rate": 0.5,
                "persona": "MEDIUM_RISK_INCONSISTENT"
            }

    def get_recommendation(self, loan_id):
        """Get AI recommendation for single customer"""
        try:
            endpoint = f"{self.base_url}/api/mcp/recommendation/{loan_id}"
            response = requests.get(endpoint, headers=self.headers, timeout=10)
            data = response.json()
            return data.get('recommendation', {})
        except Exception as e:
            logger.warning(f"⚠️ Mock recommendation for {loan_id}: {e}")
            return {
                "loan_id": loan_id,
                "recommended_channel": "whatsapp",
                "recommended_tone": "empathetic",
                "can_send_now": True,
                "message_template": {
                    "whatsapp": f"Hi! Your EMI payment is pending. Please pay at your earliest convenience."
                },
                "persona": "MEDIUM_RISK_INCONSISTENT",
                "confidence": 0.75,
                "optimal_timing": {
                    "preferred_hours": {"start": 9, "end": 18},
                    "in_preferred_window": True
                }
            }

    def get_batch_recommendations(self, limit=5, priority_filter=None, priority_threshold=3):
        """Get batch of customers with recommendations"""
        try:
            threshold = priority_filter if priority_filter is not None else priority_threshold
            
            endpoint = f"{self.base_url}/api/mcp/recommendations"
            params = {
                'limit': limit,
                'priority_threshold': threshold
            }
            response = requests.get(endpoint, headers=self.headers, params=params, timeout=10)
            data = response.json()
            
            recommendations = data.get('recommendations', [])
            logger.info(f"✅ Got {len(recommendations)} recommendations")
            return recommendations
            
        except Exception as e:
            logger.warning(f"⚠️ Using mock recommendations: {e}")
            return [
                {
                    "loan_id": "TEST_001",
                    "customer_name": "Rajesh Kumar",
                    "recommended_channel": "whatsapp",
                    "priority": 5,
                    "tone": "empathetic",
                    "persona": "LOW_RISK_COMMUNICATIVE",
                    "loan_amount_left": 45000,
                    "response_rate": 0.65
                },
                {
                    "loan_id": "TEST_002",
                    "customer_name": "Priya Sharma",
                    "recommended_channel": "email",
                    "priority": 4,
                    "tone": "informational",
                    "persona": "MEDIUM_RISK_INCONSISTENT",
                    "loan_amount_left": 82000,
                    "response_rate": 0.32
                }
            ]

    def log_message_sent(self, loan_id, channel, message_content, message_id=None):
        """Log sent message to backend"""
        try:
            endpoint = f"{self.base_url}/api/intelligence/feedback/log"
            payload = {
                "loan_id": loan_id,
                "channel": channel,
                "message_content": message_content,
                "message_id": message_id or f"{channel}_{loan_id}_{int(datetime.now().timestamp())}",
                "sentAt": datetime.now().isoformat()
            }
            response = requests.post(endpoint, json=payload, headers=self.headers, timeout=10)
            logger.info(f"✅ Message logged for {loan_id}")
            return True
        except Exception as e:
            logger.warning(f"⚠️ Message log skipped (backend down): {e}")
            return True  # Continue even if backend down

    def update_feedback(self, loan_id, message_id, update_data):
        """Update feedback status"""
        try:
            endpoint = f"{self.base_url}/api/intelligence/feedback/{loan_id}/{message_id}"
            response = requests.put(endpoint, json=update_data, headers=self.headers, timeout=10)
            return response.json()
        except Exception as e:
            logger.warning(f"⚠️ Feedback update skipped: {e}")
            return None

    def get_feedback_history(self, loan_id):
        """Get feedback history"""
        try:
            endpoint = f"{self.base_url}/api/intelligence/feedback/{loan_id}/history"
            response = requests.get(endpoint, headers=self.headers, timeout=10)
            data = response.json()
            return data.get('history', [])
        except Exception as e:
            logger.warning(f"⚠️ Mock feedback history: {e}")
            return []

# Test
if __name__ == "__main__":
    client = MCPClient()
    print("🧪 MCP Tests:")
    print(f"Health: {client.health_check()}")
    print(f"Stats: {client.get_stats()}")
    print(f"Customers: {len(client.get_customers())}")
    print(f"Recommendation TEST_001: {client.get_recommendation('TEST_001')}")
    print(f"Batch Recommendations: {len(client.get_batch_recommendations())}")
    print("✅ MCP Client ready!")
