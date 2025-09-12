const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/auth');

router.get('/me', authenticate, userController.getUser);

module.exports = router;
