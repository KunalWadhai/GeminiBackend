const Stripe = require('stripe');
const { User, Subscription } = require('../models');

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const createCheckoutSession = async (userId) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Pro Subscription',
          description: 'Unlimited AI conversations'
        },
        unit_amount: 999, // $9.99
        recurring: {
          interval: 'month'
        }
      },
      quantity: 1
    }],
    mode: 'subscription',
    success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    metadata: {
      userId: userId.toString()
    }
  });

  return session;
};

const constructEvent = (payload, signature) => {
  return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
};

const handleWebhookEvent = async (event) => {
  const session = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(session);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(session);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(session);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
};

const handleCheckoutCompleted = async (session) => {
  const userId = session.metadata.userId;

  const subscription = await stripe.subscriptions.retrieve(session.subscription);

  await Subscription.create({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    tier: 'pro',
    current_period_end: new Date(subscription.current_period_end * 1000)
  });

  await User.update(
    { subscription_tier: 'pro' },
    { where: { id: userId } }
  );
};

const handlePaymentSucceeded = async (invoice) => {
  const subscriptionId = invoice.subscription;
  const subscription = await Subscription.findOne({
    where: { stripe_subscription_id: subscriptionId }
  });

  if (subscription) {
    await subscription.update({
      status: 'active',
      current_period_end: new Date(invoice.period_end * 1000)
    });
  }
};

const handlePaymentFailed = async (invoice) => {
  const subscriptionId = invoice.subscription;
  const subscription = await Subscription.findOne({
    where: { stripe_subscription_id: subscriptionId }
  });

  if (subscription) {
    await subscription.update({ status: 'past_due' });
  }
};

module.exports = {
  createCheckoutSession,
  constructEvent,
  handleWebhookEvent
};
