const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth');

router.post('/signup', authController.signup);
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/forgot-password', authController.forgotPassword);
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;
