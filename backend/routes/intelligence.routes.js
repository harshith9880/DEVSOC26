const express = require('express');
const router = express.Router();
const intelligenceController = require('../controllers/intelligence.controller');

// Generate intelligence feedback for a specific loan
router.post('/analyze/:loan_id', intelligenceController.analyzeCustomer);

// Batch analyze multiple customers
router.post('/analyze-batch', intelligenceController.analyzeBatch);

// Get latest feedback for a loan
router.get('/feedback/:loan_id', intelligenceController.getLatestFeedback);

// Get feedback history
router.get('/feedback/:loan_id/history', intelligenceController.getFeedbackHistory);

module.exports = router;
