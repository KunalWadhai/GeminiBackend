const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const authenticate = require('../middleware/auth');

router.post('/pro', authenticate, subscriptionController.subscribePro);
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);
router.get('/status', authenticate, subscriptionController.getSubscriptionStatus);

module.exports = router;
