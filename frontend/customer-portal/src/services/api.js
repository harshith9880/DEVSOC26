import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Customer API
export const customerAPI = {
  // Get customer profile
  getProfile: (loanId) => api.get(`/mcp/customer/${loanId}`),
  
  // Get customer's interaction history
  getInteractionHistory: (loanId) => 
    api.get(`/intelligence/feedback/${loanId}/history`),
  
  // Mark message as read
  markMessageRead: (loanId, messageId, channel) =>
    api.post(`/webhooks/${channel}/opened`, {
      loan_id: loanId,
      message_id: messageId,
      timestamp: new Date().toISOString()
    }),
  
  // Mark message as clicked
  markMessageClicked: (loanId, messageId, channel) =>
    api.post(`/webhooks/${channel}/clicked`, {
      loan_id: loanId,
      message_id: messageId,
      timestamp: new Date().toISOString()
    }),
  
  // Submit response
  submitResponse: (loanId, messageId, response, channel) =>
    api.post(`/webhooks/${channel}/responded`, {
      loan_id: loanId,
      message_id: messageId,
      response: response,
      timestamp: new Date().toISOString()
    }),
  
  // Get payment link
  getPaymentLink: (loanId) =>
    api.get(`/payments/${loanId}/link`)
};

export default api;
