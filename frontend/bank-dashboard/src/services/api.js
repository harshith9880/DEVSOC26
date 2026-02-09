import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Dashboard API
export const dashboardAPI = {
  getOverview: () => api.get('/mcp/overview'),
  getMetrics: () => api.get('/mcp/metrics')
};

// Customer API
export const customerAPI = {
  getAllCustomers: (params) => api.get('/mcp/customers', { params }),
  getCustomer: (loanId) => api.get(`/mcp/customer/${loanId}`),
  updateCustomer: (loanId, data) => api.put(`/mcp/customer/${loanId}`, data),
  getSegments: () => api.get('/intelligence/segments'),
  segmentCustomers: () => api.post('/intelligence/segment')
};

// Analytics API
export const analyticsAPI = {
  getCollectionStats: () => api.get('/analytics/collection-stats'),
  getChannelPerformance: () => api.get('/analytics/channel-performance'),
  getTrendData: (period) => api.get(`/analytics/trends?period=${period}`),
  getPersonaInsights: () => api.get('/intelligence/persona-insights')
};

// Message API
export const messageAPI = {
  getAllMessages: (params) => api.get('/intelligence/feedback/all', { params }),
  getMessagesByCustomer: (loanId) => api.get(`/intelligence/feedback/${loanId}/history`),
  getMessageStats: () => api.get('/intelligence/feedback/stats')
};

// AI Agent API
export const agentAPI = {
  getAgentStatus: () => api.get('/mcp/agent/status'),
  startAgent: () => api.post('/mcp/agent/start'),
  stopAgent: () => api.post('/mcp/agent/stop'),
  getAgentLogs: (limit) => api.get(`/mcp/agent/logs?limit=${limit}`),
  triggerCollection: (batchSize) => api.post('/mcp/agent/trigger', { batch_size: batchSize }),
  getAgentConfig: () => api.get('/mcp/agent/config'),
  updateAgentConfig: (config) => api.put('/mcp/agent/config', config)
};

export default api;
