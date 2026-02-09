"""
AI Message Generator - Uses Google Gemini to generate personalized messages
"""
import logging
from typing import Dict, Optional
import google.generativeai as genai
from config import GOOGLE_API_KEY, AI_MODEL

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MessageGenerator:
    """Generate personalized messages using Google Gemini"""
    
    def __init__(self, model: str = AI_MODEL):
        if not GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        
        self.model_name = model
        genai.configure(api_key=GOOGLE_API_KEY)
        
        # Initialize Gemini model
        self.model = genai.GenerativeModel(
            model_name=model,
            generation_config={
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 500,
            },
            safety_settings={
                "HARM_CATEGORY_HARASSMENT": "BLOCK_NONE",
                "HARM_CATEGORY_HATE_SPEECH": "BLOCK_NONE",
                "HARM_CATEGORY_SEXUALLY_EXPLICIT": "BLOCK_NONE",
                "HARM_CATEGORY_DANGEROUS_CONTENT": "BLOCK_NONE",
            }
        )
        
        logger.info(f"🤖 Initialized Gemini: {model}")
    
    def generate_message(self,
                        customer_name: str,
                        loan_amount: float,
                        channel: str,
                        tone: str,
                        persona: str,
                        template: str,
                        additional_context: Optional[Dict] = None) -> str:
        """Generate personalized message using Google Gemini"""
        
        # Build prompt
        prompt = self._build_prompt(
            customer_name, loan_amount, channel, tone, 
            persona, template, additional_context
        )
        
        try:
            logger.info(f"🤖 Generating message with Gemini {self.model_name}...")
            
            # Generate with Gemini
            response = self.model.generate_content(prompt)
            
            # Extract text
            if response.text:
                message = response.text.strip()
                logger.info(f"✅ Generated {len(message)} characters")
                return message
            else:
                logger.warning("⚠️ Empty response from Gemini, using template")
                return self._extract_template_text(template)
                
        except Exception as e:
            logger.error(f"❌ Gemini generation error: {e}")
            # Fallback to template
            return self._extract_template_text(template)
    
    def _build_prompt(self, customer_name, loan_amount, channel, 
                     tone, persona, template, additional_context):
        """Build prompt for Gemini"""
        
        # Format loan amount in Indian currency
        formatted_amount = f"₹{loan_amount:,.2f}"
        
        context_str = ""
        if additional_context:
            response_rate = additional_context.get('response_rate', 0) * 100
            contact_count = additional_context.get('contact_count', 0)
            risk_score = additional_context.get('risk_score', 0) * 100
            engagement_score = additional_context.get('engagement_score', 0) * 100
            
            context_str = f"""
Additional Context:
- Response Rate: {response_rate:.1f}%
- Previous Contact Count: {contact_count}
- Risk Score: {risk_score:.1f}%
- Engagement Score: {engagement_score:.1f}%
"""
        
        # Channel-specific guidelines
        channel_guidelines = {
            'email': "Write a professional email. Include subject line if template has one. Be detailed but concise.",
            'sms': "Keep it very short (under 160 characters). Direct and clear.",
            'whatsapp': "Conversational and friendly. Can use emojis appropriately. 2-3 sentences max.",
            'call': "Write a call script with natural conversation flow."
        }
        
        # Tone-specific guidelines
        tone_guidelines = {
            'informational': "Be clear, factual, and professional. Focus on the facts.",
            'empathetic': "Show understanding and compassion. Acknowledge financial challenges. Offer help.",
            'supportive': "Be encouraging and positive. Appreciate their efforts. Build confidence.",
            'urgent': "Be firm but respectful. Create urgency without being aggressive. Mention consequences clearly."
        }
        
        prompt = f"""You are an AI assistant helping with loan collection communications in India.

Customer Information:
- Name: {customer_name}
- Outstanding Loan Amount: {formatted_amount}
- Repayment Persona: {persona}

Communication Requirements:
- Channel: {channel}
- Tone: {tone}
- Base Template: {self._extract_template_text(template)}

{context_str}

Channel Guidelines:
{channel_guidelines.get(channel, 'Be clear and professional.')}

Tone Guidelines:
{tone_guidelines.get(tone, 'Be professional and respectful.')}

Task: Generate a personalized message for this customer.

Important Rules:
1. Use ONLY {tone} tone throughout
2. Be respectful, professional, and culturally appropriate for India
3. Include the loan amount ({formatted_amount}) naturally in the message
4. Address the customer by name ({customer_name})
5. Keep the message length appropriate for {channel}
6. Do NOT add any meta-text, explanations, or notes
7. Output ONLY the message text itself
8. For email: include subject line first, then body separated by newline
9. Use Indian English and currency format (₹)

Generate the message now:"""

        return prompt
    
    def _extract_template_text(self, template) -> str:
        """Extract text from template (handle both string and dict)"""
        if isinstance(template, str):
            return template
        elif isinstance(template, dict):
            # For email templates with subject/body
            if 'subject' in template and 'body' in template:
                return f"{template['subject']}\n\n{template['body']}"
            return template.get('body', str(template))
        return str(template)
    
    def enhance_template(self, template: str, customer_name: str) -> str:
        """Lightly enhance template without full AI generation"""
        enhanced = template.replace("Customer", customer_name)
        enhanced = enhanced.replace("customer", customer_name)
        enhanced = enhanced.replace("[NAME]", customer_name)
        enhanced = enhanced.replace("{name}", customer_name)
        return enhanced
    
    def generate_batch(self, messages_config: list) -> list:
        """Generate multiple messages in batch"""
        results = []
        
        for config in messages_config:
            try:
                message = self.generate_message(**config)
                results.append({
                    "success": True,
                    "message": message,
                    "config": config
                })
            except Exception as e:
                logger.error(f"❌ Batch generation error: {e}")
                results.append({
                    "success": False,
                    "error": str(e),
                    "config": config
                })
        
        return results


# Test function
def test_generator():
    """Test the message generator"""
    generator = MessageGenerator()
    
    test_message = generator.generate_message(
        customer_name="Rajesh Kumar",
        loan_amount=25000.50,
        channel="whatsapp",
        tone="empathetic",
        persona="MEDIUM_RISK_INCONSISTENT",
        template="Your EMI payment is pending.",
        additional_context={
            'response_rate': 0.45,
            'contact_count': 3,
            'risk_score': 0.65,
            'engagement_score': 0.55
        }
    )
    
    print("\n" + "="*60)
    print("Generated Message:")
    print("="*60)
    print(test_message)
    print("="*60)


if __name__ == "__main__":
    test_generator()
