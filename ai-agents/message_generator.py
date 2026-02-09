"""
Message Generator - Uses LLM to generate personalized collection messages
Supports OpenAI and Anthropic models with template fallback
"""
import logging
from typing import Dict, Optional
from config import AI_MODEL, OPENAI_API_KEY, ANTHROPIC_API_KEY, USE_LLM_GENERATION

logger = logging.getLogger(__name__)

# Import LLM libraries conditionally
try:
    import openai
    openai.api_key = OPENAI_API_KEY
    OPENAI_AVAILABLE = bool(OPENAI_API_KEY)
except ImportError:
    OPENAI_AVAILABLE = False
    logger.warning("OpenAI library not available")

try:
    import anthropic
    ANTHROPIC_AVAILABLE = bool(ANTHROPIC_API_KEY)
except ImportError:
    ANTHROPIC_AVAILABLE = False
    logger.warning("Anthropic library not available")


class MessageGenerator:
    """Generates personalized collection messages using LLM or templates"""
    
    def __init__(self, model: str = AI_MODEL):
        self.model = model
        self.use_llm = USE_LLM_GENERATION and (OPENAI_AVAILABLE or ANTHROPIC_AVAILABLE)
        
        if self.use_llm:
            logger.info(f"🤖 MessageGenerator initialized with {model}")
        else:
            logger.info("📝 MessageGenerator using templates only (LLM disabled/unavailable)")
    
    def generate_message(
        self,
        customer_name: str,
        loan_amount: float,
        channel: str,
        tone: str,
        persona: str,
        template: str,
        additional_context: Optional[Dict] = None
    ) -> str:
        """
        Generate personalized message
        
        Args:
            customer_name: Customer's name
            loan_amount: Outstanding loan amount
            channel: Communication channel (email, sms, whatsapp, call)
            tone: Message tone (informational, empathetic, supportive, urgent, firm)
            persona: Repayment persona classification
            template: Base template message
            additional_context: Extra context (response_rate, contact_count, etc.)
            
        Returns:
            Generated message string
        """
        if self.use_llm:
            try:
                return self._generate_with_llm(
                    customer_name, loan_amount, channel, tone,
                    persona, template, additional_context or {}
                )
            except Exception as e:
                logger.error(f"❌ LLM generation failed: {e}, falling back to template")
                return self._format_template(
                    template, customer_name, loan_amount
                )
        else:
            return self._format_template(
                template, customer_name, loan_amount
            )
    
    def _generate_with_llm(
        self,
        customer_name: str,
        loan_amount: float,
        channel: str,
        tone: str,
        persona: str,
        template: str,
        context: Dict
    ) -> str:
        """Generate message using LLM"""
        
        prompt = self._build_prompt(
            customer_name, loan_amount, channel, tone,
            persona, template, context
        )
        
        if OPENAI_AVAILABLE and self.model.startswith("gpt"):
            return self._call_openai(prompt, channel)
        elif ANTHROPIC_AVAILABLE and self.model.startswith("claude"):
            return self._call_anthropic(prompt, channel)
        else:
            logger.warning("No LLM available, using template")
            return self._format_template(template, customer_name, loan_amount)
    
    def _build_prompt(
        self,
        customer_name: str,
        loan_amount: float,
        channel: str,
        tone: str,
        persona: str,
        template: str,
        context: Dict
    ) -> str:
        """Build LLM prompt"""
        
        # Channel-specific constraints
        max_length_map = {
            "sms": "160 characters",
            "whatsapp": "300 characters",
            "email": "500 characters",
            "call": "200 words (script format)"
        }
        
        max_length = max_length_map.get(channel, "300 characters")
        
        prompt = f"""You are an empathetic loan collection assistant. Generate a personalized message for a customer.

CUSTOMER DETAILS:
- Name: {customer_name}
- Outstanding Amount: ₹{loan_amount:,.2f}
- Repayment Persona: {persona}
- Response Rate: {context.get('response_rate', 0):.1%}
- Previous Contacts: {context.get('contact_count', 0)}

MESSAGE REQUIREMENTS:
- Channel: {channel}
- Tone: {tone}
- Max Length: {max_length}
- Must include payment link: [LINK]

TONE GUIDELINES:
- informational: Professional, factual, clear call-to-action
- empathetic: Understanding, supportive, offer help
- supportive: Encouraging, positive reinforcement
- urgent: Time-sensitive, emphasize consequences
- firm: Direct, authoritative, no-nonsense

BASE TEMPLATE (for reference):
{template}

Generate a message that:
1. Addresses the customer by name
2. Mentions the specific amount due
3. Matches the {tone} tone
4. Is appropriate for {channel}
5. Stays within {max_length}
6. Includes [LINK] for payment
7. Feels personalized, not robotic

MESSAGE:"""
        
        return prompt
    
    def _call_openai(self, prompt: str, channel: str) -> str:
        """Call OpenAI API"""
        try:
            max_tokens_map = {
                "sms": 50,
                "whatsapp": 100,
                "email": 200,
                "call": 150
            }
            
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at writing empathetic loan collection messages."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=max_tokens_map.get(channel, 150),
                top_p=0.9
            )
            
            message = response.choices[0].message.content.strip()
            logger.info(f"✅ Generated {len(message)} char message via OpenAI")
            return message
            
        except Exception as e:
            logger.error(f"❌ OpenAI API error: {e}")
            raise
    
    def _call_anthropic(self, prompt: str, channel: str) -> str:
        """Call Anthropic API"""
        try:
            client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
            
            max_tokens_map = {
                "sms": 50,
                "whatsapp": 100,
                "email": 200,
                "call": 150
            }
            
            response = client.messages.create(
                model=self.model,
                max_tokens=max_tokens_map.get(channel, 150),
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            message = response.content[0].text.strip()
            logger.info(f"✅ Generated {len(message)} char message via Anthropic")
            return message
            
        except Exception as e:
            logger.error(f"❌ Anthropic API error: {e}")
            raise
    
    def _format_template(
        self,
        template: str,
        customer_name: str,
        loan_amount: float
    ) -> str:
        """Format template with customer details"""
        try:
            # Simple template variable replacement
            message = template.replace("{name}", customer_name)
            message = message.replace("{amount}", f"₹{loan_amount:,.2f}")
            message = message.replace("[LINK]", "[PAYMENT_LINK]")
            
            logger.info(f"📝 Formatted template message ({len(message)} chars)")
            return message
            
        except Exception as e:
            logger.error(f"❌ Template formatting error: {e}")
            return f"Hi {customer_name}, please pay ₹{loan_amount:,.2f}. Click here: [LINK]"


if __name__ == "__main__":
    # Test the message generator
    logging.basicConfig(level=logging.INFO)
    
    generator = MessageGenerator()
    
    test_message = generator.generate_message(
        customer_name="Rahul Kumar",
        loan_amount=15000,
        channel="whatsapp",
        tone="empathetic",
        persona="MEDIUM_RISK_INCONSISTENT",
        template="Hello {name}, your EMI of {amount} is due. Please pay: [LINK]",
        additional_context={
            "response_rate": 0.6,
            "contact_count": 5,
            "risk_score": 0.4
        }
    )
    
    print(f"\nGenerated Message:\n{test_message}")