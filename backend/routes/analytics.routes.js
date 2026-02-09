const express = require('express');
const router = express.Router();
const FeedbackHistory = require('../models/FeedbackHistory');

// Collection stats
router.get('/collection-stats', async (req, res) => {
  try {
    const stats = {
      total_collected: 5250000,
      collection_rate: 0.68,
      trend: [
        { name: 'Jan', value: 850000 },
        { name: 'Feb', value: 920000 },
        { name: 'Mar', value: 780000 },
        { name: 'Apr', value: 1100000 },
        { name: 'May', value: 950000 },
        { name: 'Jun', value: 1200000 }
      ]
    };
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Channel performance
router.get('/channel-performance', async (req, res) => {
  try {
    const performance = await FeedbackHistory.aggregate([
      {
        $group: {
          _id: '$channel',
          value: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          value: 1,
          _id: 0
        }
      }
    ]);
    res.json({ success: true, performance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trends
router.get('/trends', async (req, res) => {
  try {
    const period = req.query.period || 'week';
    // Implement based on your needs
    res.json({ success: true, trends: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
