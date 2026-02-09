# 🤖 AI Collection Agents - 3-Agent Event-Driven System

## Overview

This is an **event-driven, 3-agent system** for intelligent loan collection. The agents communicate asynchronously via Redis Pub/Sub, making the system scalable, resilient, and easy to monitor.

```
┌─────────────┐
│  Webhooks   │ ──┐
└─────────────┘   │
                  ▼
            ┌──────────┐
            │  Redis   │ Event Bus
            │ Pub/Sub  │
            └──────────┘
                  │
      ┌───────────┼───────────┐
      ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ AGENT 1  │ │ AGENT 2  │ │ AGENT 3  │
│   Data   │ │ Strategy │ │ Message  │
│Collector │ │ Decider  │ │ Executor │
└──────────┘ └──────────┘ └──────────┘
```

## The 3 Agents

### 🔍 Agent 1: Data Collector (`agent_data_collector.py`)

**Role**: Monitor customer interactions and update profiles

**Triggers** (Event-Driven):
- `customer.responded` - Customer opened/clicked/replied
- `payment.made` - Customer made a payment
- Email/WhatsApp/SMS/Call events

**Actions**:
1. Aggregate interaction data
2. Update customer engagement scores
3. Decide if re-analysis is needed
4. **Publish**: `data.collected` event

**Output**: Triggers Agent 2 when significant changes occur

---

### 🎯 Agent 2: Strategy Decider (`agent_strategy_decider.py`)

**Role**: Analyze data and decide collection strategy

**Triggers** (Event-Driven):
- `data.collected` - From Agent 1

**Actions**:
1. Call RepaymentIntelligence service (via MCP backend)
2. Get persona classification
3. Extract strategy recommendations
4. Validate and enrich strategy
5. **Publish**: `strategy.decided` event

**Output**: Triggers Agent 3 with execution plan

---

### 📧 Agent 3: Message Executor (`agent_message_executor.py`)

**Role**: Generate and send personalized messages

**Triggers** (Event-Driven):
- `strategy.decided` - From Agent 2

**Actions**:
1. Generate personalized message using LLM
2. Send via appropriate channel (Email/SMS/WhatsApp/Call)
3. Register message with backend
4. **Publish**: `message.sent` event

**Output**: Message delivered, tracked in backend

---

## Event Flow

```
Customer pays ₹5000
       │
       ▼
[Webhook] → Redis: payment.made
       │
       ▼
[Agent 1] Aggregates data → Redis: data.collected
       │
       ▼
[Agent 2] Analyzes → Decides strategy → Redis: strategy.decided
       │
       ▼
[Agent 3] Generates message → Sends WhatsApp → Redis: message.sent
       │
       ▼
Backend tracks interaction
```

## Installation

### 1. Install Dependencies

```bash
cd ai-agents
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual values
nano .env
```

**Required variables**:
- `MCP_BACKEND_URL` - Your Node.js backend URL
- `EVENT_BUS_URL` - Redis URL
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` - For LLM generation

### 3. Start Redis

```bash
# Option A: Docker
docker run -d -p 6379:6379 redis:7-alpine

# Option B: Local Redis
redis-server
```

### 4. Start Backend

```bash
cd ../backend
npm install
npm start
```

## Running the Agents

### Option A: Run All 3 Agents (Recommended)

Open **3 separate terminals**:

```bash
# Terminal 1: Agent 1 - Data Collector
python agent_data_collector.py

# Terminal 2: Agent 2 - Strategy Decider
python agent_strategy_decider.py

# Terminal 3: Agent 3 - Message Executor
python agent_message_executor.py
```

### Option B: Docker Compose (Production)

```bash
cd ..
docker-compose up -d
```

This starts:
- MongoDB
- Redis
- Backend
- Agent 1
- Agent 2
- Agent 3

## Testing the System

### Test 1: Simulate a Payment Event

```bash
# Trigger a payment webhook
curl -X POST http://localhost:5000/api/webhooks/payment \
  -H "Content-Type: application/json" \
  -d '{
    "loan_id": "TEST_001",
    "amount": 5000,
    "timestamp": "2026-02-09T10:30:00Z"
  }'
```

**Expected Flow**:
1. Backend publishes `payment.made` to Redis
2. Agent 1 receives event, publishes `data.collected`
3. Agent 2 receives event, analyzes, publishes `strategy.decided`
4. Agent 3 receives event, generates message, sends it

Watch the logs in all 3 terminals!

### Test 2: Monitor Redis Events

```bash
# Terminal 4: Watch all events
redis-cli
> PSUBSCRIBE *

# You should see events like:
# 1) "pmessage"
# 2) "payment.made"
# 3) "data.collected"
# 4) "strategy.decided"
# 5) "message.sent"
```

### Test 3: Check Backend

```bash
# Get system stats
curl http://localhost:5000/api/mcp/stats

# Get recommendation for a customer
curl http://localhost:5000/api/mcp/recommendation/TEST_001
```

## File Structure

```
ai-agents/
├── config.py                    # Configuration & environment variables
├── event_bus.py                 # Redis Pub/Sub wrapper
├── mcp_client.py                # Backend API client
├── message_generator.py         # LLM message generation
│
├── agent_data_collector.py      # AGENT 1
├── agent_strategy_decider.py    # AGENT 2
├── agent_message_executor.py    # AGENT 3
│
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variables template
└── README.md                    # This file
```

## Key Features

### ✅ Event-Driven Architecture
- Agents are **independent** - no direct function calls
- Communicate only via **Redis events**
- Can scale horizontally (multiple instances per agent type)
- Resilient to failures (events queued in Redis)

### ✅ LLM-Powered Personalization
- Uses OpenAI GPT-4 or Anthropic Claude
- Generates contextual, empathetic messages
- Fallback to templates if LLM fails

### ✅ Intelligent Strategy
- Persona-based classification (6 types)
- Risk-aware decision making
- Channel, tone, and timing optimization

### ✅ Production-Ready
- Comprehensive error handling
- Retry logic with exponential backoff
- Duplicate event detection
- Extensive logging

## Configuration

### Event Topics (Redis Channels)

```python
EVENT_TOPICS = {
    # Webhook events
    "CUSTOMER_RESPONDED": "customer.responded",
    "PAYMENT_MADE": "payment.made",
    "EMAIL_OPENED": "email.opened",
    
    # Agent events
    "DATA_COLLECTED": "data.collected",      # Agent 1 → Agent 2
    "STRATEGY_DECIDED": "strategy.decided",  # Agent 2 → Agent 3
    "MESSAGE_SENT": "message.sent",          # Agent 3 → Monitoring
}
```

### Repayment Personas

```python
PERSONAS = {
    "HIGH_RISK_NON_RESPONSIVE": Priority 5, Intensity 5
    "HIGH_RISK_RESPONSIVE": Priority 4, Intensity 4
    "MEDIUM_RISK_INCONSISTENT": Priority 3, Intensity 3
    "LOW_RISK_RESPONSIVE": Priority 1, Intensity 2
    "LOW_RISK_NON_RESPONSIVE": Priority 2, Intensity 3
    "ZERO_CONTACT": Priority 5, Intensity 5
}
```

### Communication Channels

- **Email**: Professional, detailed messages
- **SMS**: Short, urgent updates
- **WhatsApp**: Conversational, supportive
- **Call**: High-priority, automated scripts

## Monitoring & Debugging

### View Agent Logs

```bash
# Agent 1
tail -f agent_data_collector.log

# Agent 2
tail -f agent_strategy_decider.log

# Agent 3
tail -f agent_message_executor.log
```

### Monitor Redis Queue

```bash
redis-cli
> PUBSUB CHANNELS     # See active channels
> PUBSUB NUMSUB customer.responded  # See subscribers
```

### Backend Endpoints

```bash
# Health check
GET /health

# Get recommendation
GET /api/mcp/recommendation/:loan_id

# Get batch recommendations
GET /api/mcp/recommendations/batch?limit=10&priority_filter=3

# Get feedback
GET /api/mcp/feedback/:loan_id/:message_id

# System stats
GET /api/mcp/stats
```

## Deployment

### Docker Compose

See `docker-compose.yml` in root directory.

```bash
docker-compose up -d
docker-compose logs -f agent-data-collector
docker-compose logs -f agent-strategy-decider
docker-compose logs -f agent-message-executor
```

### Kubernetes (TODO)

```bash
kubectl apply -f k8s/
```

## Troubleshooting

### Agent not receiving events

1. **Check Redis connection**:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Check backend is publishing**:
   ```bash
   redis-cli
   > PSUBSCRIBE *
   # Trigger a webhook and watch for events
   ```

3. **Check agent subscriptions**:
   Look for `👂 Subscribed to:` in agent logs

### Message not sending

1. **Check Agent 2 decided strategy**:
   Look for `✅ Published STRATEGY_DECIDED` in Agent 2 logs

2. **Check Agent 3 received event**:
   Look for `📥 Received STRATEGY_DECIDED` in Agent 3 logs

3. **Check simulation mode**:
   Agent 3 defaults to simulation mode (no real messages sent)
   Set `self.simulation_mode = False` to enable real sending

### LLM generation failing

1. **Check API keys**:
   ```bash
   echo $OPENAI_API_KEY
   ```

2. **Check USE_LLM_GENERATION**:
   ```bash
   echo $USE_LLM_GENERATION
   ```

3. **View fallback messages**:
   Agent 3 will use templates if LLM fails

## Next Steps

### 1. Integrate Real Messaging Providers

**File to edit**: `agent_message_executor.py`

Uncomment and implement:
- `_send_via_email()` - SendGrid/SMTP integration
- `_send_via_sms()` - Twilio SMS
- `_send_via_whatsapp()` - Twilio WhatsApp
- `_send_via_call()` - Twilio Voice

### 2. Add Backend Event Publishing

**File to edit**: `backend/routes/webhooks/email.webhook.js` (and others)

Add after `loan.save()`:
```javascript
const eventPublisher = require('../../infrastructure/event_publisher');
await eventPublisher.publish('customer.responded', {
  loan_id: loan.id,
  channel: 'email',
  response_type: 'clicked',
  timestamp: new Date().toISOString()
});
```

### 3. Real-Time Dashboard

Add WebSocket/SSE to frontend to show:
- Live agent activity
- Event stream visualization
- Agent health metrics

### 4. Production Hardening

- [ ] Add Sentry for error tracking
- [ ] Add Prometheus metrics
- [ ] Implement circuit breakers
- [ ] Add rate limiting
- [ ] Database connection pooling
- [ ] Secrets management (AWS Secrets Manager, etc.)

## Architecture Comparison

### ❌ Old (Monolithic Agent)

```python
def process_customer(loan_id):
    recommendation = get_recommendation(loan_id)  # All in one
    message = generate_message(...)
    send_message(...)
```

**Problems**:
- All-or-nothing execution
- Can't scale components independently
- Hard to debug failures
- Tight coupling

### ✅ New (3-Agent Event-Driven)

```
Agent 1 → Redis → Agent 2 → Redis → Agent 3
```

**Benefits**:
- Independent scaling
- Fault isolation
- Easy monitoring
- Loose coupling
- Can add more agents easily

## Support

For questions or issues:
1. Check logs first
2. Verify Redis connection
3. Test with curl commands
4. Review event flow in Redis

## License

MIT

---

**Built with** ❤️ **for intelligent, empathetic loan collection**