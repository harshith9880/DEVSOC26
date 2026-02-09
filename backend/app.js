const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Routes
const intelligenceRoutes = require('./routes/intelligence.routes');
const emailWebhook = require('./routes/webhooks/email.webhook');
const whatsappWebhook = require('./routes/webhooks/whatsapp.webhook');
const smsWebhook = require('./routes/webhooks/sms.webhook');
const callWebhook = require('./routes/webhooks/call.webhook');
const simulationRoutes = require('./routes/simulation.routes');
const testRoutes = require('./routes/test.routes');
const mcpRoutes = require('./routes/mcp.routes');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

console.log('=== Route Types ===');
console.log('intelligenceRoutes:', typeof intelligenceRoutes);
console.log('emailWebhook:', typeof emailWebhook);
console.log('whatsappWebhook:', typeof whatsappWebhook);
console.log('smsWebhook:', typeof smsWebhook);
console.log('callWebhook:', typeof callWebhook);
console.log('simulationRoutes:', typeof simulationRoutes);
console.log('testRoutes:', typeof testRoutes);
console.log('===================');


// Webhook routes
app.use('/api/webhooks/email', emailWebhook);
app.use('/api/webhooks/whatsapp', whatsappWebhook);
app.use('/api/webhooks/sms', smsWebhook);
app.use('/api/webhooks/call', callWebhook);
app.use('/api/mcp', mcpRoutes);

// Intelligence routes
app.use('/api/intelligence', intelligenceRoutes);

// Simulation + test routes
app.use('/api/simulation', simulationRoutes);
app.use('/api/test', testRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;   // <-- this is crucial
