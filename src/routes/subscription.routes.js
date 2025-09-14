const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const authenticate = require('../middleware/auth');

router.post('/pro', authenticate, subscriptionController.subscribePro);
router.get('/status', authenticate, subscriptionController.getSubscriptionStatus);

module.exports = router;
