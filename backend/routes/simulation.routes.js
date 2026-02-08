const express = require('express');
const router = express.Router();

// Lazy-load controller to avoid circular dependency
const getSimulationController = () => require('../controllers/simulation.controller');

// Send single message
router.post('/send', (req, res, next) => getSimulationController().sendMessage(req, res, next));

// Send campaign (multiple channels)
router.post('/campaign', (req, res, next) => getSimulationController().sendCampaign(req, res, next));

// Send batch messages
router.post('/batch', (req, res, next) => getSimulationController().sendBatch(req, res, next));

// Start automated scheduler
router.post('/scheduler/start', (req, res, next) => getSimulationController().startScheduler(req, res, next));

// Stop automated scheduler
router.post('/scheduler/stop', (req, res, next) => getSimulationController().stopScheduler(req, res, next));

// Test simulation with sample data
router.post('/test', (req, res, next) => getSimulationController().testSimulation(req, res, next));

module.exports = router;
