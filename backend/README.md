# EMI Collection Intelligence System - Backend

## 🎯 Overview

AI-powered EMI collection system with **3-agent architecture** and **event-driven communication** via Redis.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     EVENT BUS (Redis)                       │
│          customer.responded | payment.made | etc.          │
└─────────────────────────────────────────────────────────────┘
         ↑                    ↑                    ↑
         │                    │                    │
    ┌────┴─────┐         ┌───┴────┐          ┌────┴─────┐
    │  AGENT 1 │         │ AGENT 2│          │  AGENT 3 │
    │   Data   │─────────→Strategy│─────────→│ Message  │
    │Collector │         │Decider │          │ Executor │
    └──────────┘         └────────┘          └──────────┘
         ↑                                          │
         │                                          ↓
    ┌────┴──────────────────────────────────────────┴─────┐
    │              BACKEND (Node.js/Express)              │
    │  ┌──────────┐  ┌──────────┐  ┌────────────────┐   │
    │  │ Webhooks │→ │Intelligence│→ │ MCP Controller │   │
    │  └──────────┘  │   Engine   │  └────────────────┘   │
    │                └──────────┘                         │
    └──────────────────────────────────────────────────────┘
                           ↓
                    ┌─────────────┐
                    │   MongoDB   │
                    └─────────────┘
```

### How It Works

1. **Webhooks** receive customer interactions (payment, email opened, etc.)
2. **Event Publisher** publishes events to Redis
3. **Agent 1** (Data Collector) listens for events, decides if re-analysis needed
4. **Agent 2** (Strategy Decider) calls Intelligence Engine, decides best strategy
5. **Agent 3** (Message Executor) generates and sends personalized messages
6. Loop continues as customers respond

---

## 📋 Prerequisites

- **Node.js** >= 16.0.0
- **MongoDB** >= 5.0
- **Redis** >= 6.0
- **Python** >= 3.8 (for AI agents)

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/emi-intelligence
REDIS_URL=redis://localhost:6379
```

### 3. Start Services

**Terminal 1 - MongoDB:**
```bash
mongod
```

**Terminal 2 - Redis:**
```bash
redis-server
```

**Terminal 3 - Initialize Database:**
```bash
npm run init-db
npm run seed
```

**Terminal 4 - Start Backend:**
```bash
npm start
```

### 4. Start AI Agents

**Terminal 5 - Agent 1:**
```bash
cd ../ai-agents
python agent_data_collector.py
```

**Terminal 6 - Agent 2:**
```bash
python agent_strategy_decider.py
```

**Terminal 7 - Agent 3:**
```bash
python agent_message_executor.py
```

---

## 🧪 Testing the System

### Simulate a Payment

```bash
curl -X POST http://localhost:5000/api/webhooks/payment/received \
  -H "Content-Type: application/json" \
  -d '{
    "loan_id": "LOAN_001",
    "amount": 788.45,
    "timestamp": "2025-02-09T10:00:00Z",
    "payment_method": "upi"
  }'
```

**What happens:**
1. ✅ Payment webhook updates database
2. 📢 Event published to Redis (`payment.made`)
3. 🤖 Agent 1 receives event → publishes `data.collected`
4. 🧠 Agent 2 analyzes → publishes `strategy.decided`
5. 📧 Agent 3 generates & sends message → publishes `message.sent`

### Simulate Email Opened

```bash
curl -X POST http://localhost:5000/api/webhooks/email/opened \
  -H "Content-Type: application/json" \
  -d '{
    "loan_id": "LOAN_002",
    "timestamp": "2025-02-09T11:00:00Z"
  }'
```

### Check Health

```bash
curl http://localhost:5000/health
```

---

## 📁 Project Structure

```
backend/
├── models/               # Mongoose schemas
│   ├── Loan.js          # ✅ FIXED - Single source of truth
│   ├── FeedbackHistory.js  # ✅ FIXED - Complete schema
│   └── Event.js         # ✅ NEW - Event tracking
│
├── routes/
│   ├── webhooks/        # Event receivers
│   │   ├── email.webhook.js      # ✅ FIXED - Redis integration
│   │   ├── payment.webhook.js    # ✅ NEW - Payment events
│   │   ├── sms.webhook.js
│   │   ├── whatsapp.webhook.js
│   │   └── call.webhook.js
│   ├── mcp.routes.js    # Agent endpoints
│   └── intelligence.routes.js
│
├── controllers/
│   ├── mcp.controller.js           # Agent communication
│   └── intelligence.controller.js   # AI analysis
│
├── services/
│   ├── repaymentIntelligence.js  # Persona classification
│   ├── personaEngine.js          # Rule engine
│   ├── strategyEngine.js         # Strategy decisions
│   └── featureExtractor.js       # Feature engineering
│
├── utils/
│   └── eventPublisher.js   # ✅ NEW - Redis publisher
│
├── scripts/
│   ├── initDatabase.js    # ✅ NEW - DB setup
│   └── seedTestData.js    # ✅ FIXED - Test data
│
├── config/
│   └── db.js             # MongoDB connection
│
├── .env.example          # ✅ NEW - Environment template
├── package.json          # ✅ FIXED - Added redis, uuid
├── server.js             # Entry point
└── app.js                # Express app
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/emi-intelligence` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `NODE_ENV` | Environment | `development` |

### Agent Configuration

Edit `ai-agents/config.py`:

```python
MCP_BACKEND_URL = "http://localhost:5000"
EVENT_BUS_URL = "redis://localhost:6379"
```

---

## 📊 Database Schema

### Collections

1. **loans** - Customer loan records
2. **feedback_history** - AI analysis history
3. **events** - Event bus activity log

### Key Indexes

- `loans.id` (unique)
- `loans.repayment.loan_status`
- `loans.contactProfile.lastContactAt`
- `feedback_history.loan_id + generated_at`
- `events.event_type + publish_timestamp`

---

## 🔍 API Endpoints

### Webhooks (Receive Events)

- `POST /api/webhooks/payment/received` - Payment made
- `POST /api/webhooks/email/opened` - Email opened
- `POST /api/webhooks/email/clicked` - Link clicked
- `POST /api/webhooks/email/replied` - Customer replied
- `POST /api/webhooks/sms/replied` - SMS response
- `POST /api/webhooks/whatsapp/replied` - WhatsApp response
- `POST /api/webhooks/call/answered` - Call answered

### MCP (Agent Communication)

- `GET /api/mcp/recommendation/:loan_id` - Get AI recommendation
- `POST /api/mcp/message/register` - Register sent message
- `GET /api/mcp/feedback/:loan_id/:message_id` - Get feedback

### Intelligence

- `POST /api/intelligence/analyze/:loan_id` - Analyze customer
- `GET /api/intelligence/personas` - Get persona statistics

---

## 🐛 Troubleshooting

### Redis Connection Failed

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Start Redis
redis-server
```

### MongoDB Connection Failed

```bash
# Check if MongoDB is running
mongosh
# Should connect

# Start MongoDB
mongod --dbpath /path/to/data
```

### Agents Not Receiving Events

1. Check Redis connection in agent logs
2. Verify `EVENT_BUS_URL` in `ai-agents/config.py`
3. Check if events are being published:
   ```bash
   redis-cli
   > PUBSUB CHANNELS
   ```

### No Events in Database

Check `events` collection:
```bash
mongosh emi-intelligence
> db.events.find().limit(5)
```

If empty, check `eventPublisher` initialization in `app.js`.

---

## 📈 Monitoring

### Check Event Stats

```bash
curl http://localhost:5000/api/events/stats
```

### Check Agent Health

```bash
curl http://localhost:5000/api/mcp/agents/health
```

### View Recent Events

```bash
mongosh emi-intelligence
> db.events.find().sort({publish_timestamp: -1}).limit(10)
```

---

## 🔄 Development Workflow

### Adding a New Webhook

1. Create file in `routes/webhooks/`
2. Update database (Loan model)
3. Publish event using `eventPublisher`
4. Update Agent 1 to handle new event type

Example:
```javascript
const { getEventPublisher } = require('../../utils/eventPublisher');
const eventPublisher = getEventPublisher();

await eventPublisher.publish('NEW_EVENT_TYPE', {
  loan_id,
  // ... data
}, {
  webhook_name: 'new.webhook'
});
```

### Adding a New Persona

1. Update `PERSONAS` in `ai-agents/config.py`
2. Add rules in `backend/services/personaEngine.js`
3. Update `FeedbackHistory` model enum

---

## 🚨 Critical Fixes Applied

### 1. ✅ Duplicate Model Issue
**Problem:** `User.js` and `Loan.js` both exported `Loan` model  
**Fix:** Created single `Loan.js` with complete schema

### 2. ✅ Missing Redis Integration
**Problem:** Webhooks didn't publish to event bus  
**Fix:** Created `eventPublisher.js` utility, integrated in all webhooks

### 3. ✅ Empty FeedbackOutput Model
**Problem:** Model file was empty  
**Fix:** Created complete `FeedbackHistory.js` schema

### 4. ✅ No Event Tracking
**Problem:** No way to audit/debug events  
**Fix:** Created `Event` model with TTL index

### 5. ✅ Missing Dependencies
**Problem:** `redis` and `uuid` not in package.json  
**Fix:** Updated package.json

### 6. ✅ No Database Setup
**Problem:** No initialization scripts  
**Fix:** Created `initDatabase.js` and improved `seedTestData.js`

### 7. ✅ Hardcoded API Keys
**Problem:** OpenAI key in `config.py`  
**Fix:** Created `.env.example`, removed hardcoded keys

---

## 📝 Next Steps

1. ✅ Remove old `User.js` file (delete it)
2. ✅ Update `ai-agents/config.py` to remove hardcoded API key
3. ✅ Create `.env` files for both backend and ai-agents
4. ✅ Test complete flow: Payment → Agent 1 → Agent 2 → Agent 3
5. Add authentication for MCP endpoints
6. Implement rate limiting
7. Add logging aggregation (ELK stack)
8. Set up monitoring (Grafana + Prometheus)

---

## 📜 License

MIT

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test with all 3 agents running
5. Submit pull request

---

**Built with ❤️ for intelligent debt collection**