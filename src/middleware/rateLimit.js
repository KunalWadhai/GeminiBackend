const rateLimit = require('express-rate-limit');
const { User } = require('../models');

// Rate limiter for Basic tier users
const messageRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: async (req) => {
    const userId = req.user?.id;
    if (!userId) return 0;

    const user = await User.findByPk(userId);
    return user.subscription_tier === 'basic' ? 5 : 1000; // Basic: 5/day, Pro: 1000/day
  },
  message: {
    error: 'Daily message limit exceeded. Upgrade to Pro for unlimited access.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip
});

module.exports = {
  messageRateLimit
};
