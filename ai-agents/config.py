import os
from dotenv import load_dotenv

load_dotenv()

# Backend API Configuration
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")
MCP_API_BASE = f"{BACKEND_URL}/api/mcp"

# AI Model Configuration - Google Gemini
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
AI_MODEL = os.getenv("AI_MODEL", "gemini-2.5-flash")  # or "gemini-1.5-flash" for faster

# Agent Configuration
AGENT_NAME = os.getenv("AGENT_NAME", "ai-agent-gemini")
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "10"))
SCHEDULE_INTERVAL_MINUTES = int(os.getenv("SCHEDULE_INTERVAL_MINUTES", "30"))

# Messaging Provider Configuration (Optional)
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "whatsapp:+14155238886")

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
