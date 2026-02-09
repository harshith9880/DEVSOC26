"""
Configuration for AI Collection Agents
Loads environment variables and defines constants for the 3-agent system
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ============================================================================
# AGENT IDENTIFICATION
# ============================================================================
AGENT_NAME = os.getenv("AGENT_NAME", "CollectionAgent_1")
AGENT_TYPE = os.getenv("AGENT_TYPE", "data_collector")  # data_collector | strategy_decider | message_executor
AGENT_ID = os.getenv("AGENT_ID", "agent_001")

# ============================================================================
# BACKEND URLS
# ============================================================================
MCP_BACKEND_URL = os.getenv("MCP_BACKEND_URL", "http://localhost:5000")
EVENT_BUS_URL = os.getenv("EVENT_BUS_URL", "redis://localhost:6379")

# ============================================================================
# AI/LLM CONFIGURATION
# ============================================================================
AI_MODEL = os.getenv("AI_MODEL", "gpt-4")
OPENAI_API_KEY = os.getenv("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")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# Fallback to template messages if LLM fails
USE_LLM_GENERATION = "true"

# ============================================================================
# PROCESSING CONFIGURATION
# ============================================================================
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "10"))
SCHEDULE_INTERVAL_MINUTES = int(os.getenv("SCHEDULE_INTERVAL_MINUTES", "30"))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))
RETRY_DELAY_SECONDS = int(os.getenv("RETRY_DELAY_SECONDS", "5"))

# ============================================================================
# EVENT TOPICS (Redis Pub/Sub channels)
# ============================================================================
EVENT_TOPICS = {
    # Webhook events (published by backend)
    "CUSTOMER_RESPONDED": "customer.responded",
    "PAYMENT_MADE": "payment.made",
    "EMAIL_OPENED": "email.opened",
    "EMAIL_CLICKED": "email.clicked",
    "WHATSAPP_REPLIED": "whatsapp.replied",
    "SMS_REPLIED": "sms.replied",
    "CALL_ANSWERED": "call.answered",
    
    # Agent 1 events
    "DATA_COLLECTED": "data.collected",
    "PROFILE_UPDATED": "profile.updated",
    
    # Agent 2 events  
    "STRATEGY_DECIDED": "strategy.decided",
    "STRATEGY_FAILED": "strategy.failed",
    
    # Agent 3 events
    "MESSAGE_SENT": "message.sent",
    "MESSAGE_FAILED": "message.failed",
    
    # System events
    "AGENT_HEALTH": "agent.health",
    "SYSTEM_ERROR": "system.error"
}

# ============================================================================
# REPAYMENT PERSONAS (from existing PersonaEngine)
# ============================================================================
PERSONAS = {
    "HIGH_RISK_NON_RESPONSIVE": {
        "description": "High debt, rarely responds",
        "priority": 5,
        "max_intensity": 5
    },
    "HIGH_RISK_RESPONSIVE": {
        "description": "High debt, engages regularly", 
        "priority": 4,
        "max_intensity": 4
    },
    "MEDIUM_RISK_INCONSISTENT": {
        "description": "Moderate debt, inconsistent engagement",
        "priority": 3,
        "max_intensity": 3
    },
    "LOW_RISK_RESPONSIVE": {
        "description": "Low debt, responds well",
        "priority": 1,
        "max_intensity": 2
    },
    "LOW_RISK_NON_RESPONSIVE": {
        "description": "Low debt, minimal engagement",
        "priority": 2,
        "max_intensity": 3
    },
    "ZERO_CONTACT": {
        "description": "Never contacted or responded",
        "priority": 5,
        "max_intensity": 5
    },
    "UNKNOWN": {
        "description": "Insufficient data for classification",
        "priority": 2,
        "max_intensity": 2
    }
}

# ============================================================================
# COMMUNICATION CHANNELS
# ============================================================================
CHANNELS = ["email", "sms", "whatsapp", "call"]
TONES = ["informational", "empathetic", "supportive", "urgent", "firm"]

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# ============================================================================
# VALIDATION
# ============================================================================
def validate_config():
    """Validate critical configuration"""
    errors = []
    
    if not MCP_BACKEND_URL:
        errors.append("MCP_BACKEND_URL is required")
    
    if not EVENT_BUS_URL:
        errors.append("EVENT_BUS_URL is required")
    
    if USE_LLM_GENERATION and not (OPENAI_API_KEY or ANTHROPIC_API_KEY):
        errors.append("OPENAI_API_KEY or ANTHROPIC_API_KEY required when USE_LLM_GENERATION=true")
    
    if AGENT_TYPE not in ["data_collector", "strategy_decider", "message_executor"]:
        errors.append(f"Invalid AGENT_TYPE: {AGENT_TYPE}")
    
    if errors:
        raise ValueError(f"Configuration errors: {', '.join(errors)}")
    
    return True

# Validate on import
try:
    validate_config()
except ValueError as e:
    print(f"⚠️  Configuration warning: {e}")