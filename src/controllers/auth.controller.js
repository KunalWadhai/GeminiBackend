const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const otpService = require('../services/otp.service');
const { generateToken } = require('../utils/jwt');

const signup = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { mobile } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Create user
    const user = await User.create({
      mobile,
      password: hashedPassword
    });

    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const sendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    const user = await User.findOne({ where: { mobile } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const otp = otpService.generateOtp();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await user.update({ otp, otp_expiry: expiry });

    // In production, send OTP via SMS. For now, return in response
    res.json({ message: 'OTP sent successfully', otp });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    const user = await User.findOne({ where: { mobile } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.otp !== otp || new Date() > user.otp_expiry) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Clear OTP
    await user.update({ otp: null, otp_expiry: null });

    // Generate JWT
    const token = generateToken(user.id);

    res.json({ message: 'OTP verified successfully', token });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { mobile } = req.body;

    const user = await User.findOne({ where: { mobile } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const otp = otpService.generateOtp();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    await user.update({ otp, otp_expiry: expiry });

    res.json({ message: 'OTP sent for password reset', otp });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user.password) {
      return res.status(400).json({ error: 'Password not set' });
    }

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid old password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  signup,
  sendOtp,
  verifyOtp,
  forgotPassword,
  changePassword
};
