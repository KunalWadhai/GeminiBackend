const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true // For OTP-based, password optional
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  otp_expiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  subscription_tier: {
    type: DataTypes.ENUM('basic', 'pro'),
    defaultValue: 'basic'
  }
}, {
  timestamps: true
});

module.exports = User;
