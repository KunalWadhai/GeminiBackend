const { User, Subscription } = require('../models');
const stripeService = require('../services/stripe.service');

const subscribePro = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId);

    const session = await stripeService.createCheckoutSession(userId);
    console.log(session);

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: ['subscription_tier']
    });

    const subscription = await Subscription.findOne({
      where: { user_id: userId, status: 'active' },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      tier: user.subscription_tier,
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const handleWebhook = async (req, res) => {
  try {
    const sig = req.get('stripe-signature');
    const event = stripeService.constructEvent(req.body, sig);

    await stripeService.handleWebhookEvent(event);

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(400).json({ error: 'Webhook error' });
  }
};

module.exports = {
  subscribePro,
  getSubscriptionStatus,
  handleWebhook
};
