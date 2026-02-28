import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Stripe is optional for local development
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Plan price IDs - these will be created in Stripe Dashboard
// For now using placeholder IDs that will be replaced with real ones
export const STRIPE_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
  studio: process.env.STRIPE_PRICE_STUDIO,
};

// Plan mapping from Stripe price to plan name
export const getPlanFromPriceId = (priceId) => {
  if (priceId === STRIPE_PRICES.starter) return 'starter';
  if (priceId === STRIPE_PRICES.pro) return 'pro';
  if (priceId === STRIPE_PRICES.studio) return 'studio';
  return 'none';
};

// Create a checkout session for subscription
export const createCheckoutSession = async ({ userId, userEmail, priceId, successUrl, cancelUrl }) => {
  if (!stripe) throw new Error('Stripe not configured');
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: userEmail,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: userId,
    },
    subscription_data: {
      metadata: {
        userId: userId,
      },
    },
  });

  return session;
};

// Create a billing portal session for managing subscription
export const createBillingPortalSession = async ({ customerId, returnUrl }) => {
  if (!stripe) throw new Error('Stripe not configured');
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
};

// Get subscription details
export const getSubscription = async (subscriptionId) => {
  if (!stripe) throw new Error('Stripe not configured');
  return await stripe.subscriptions.retrieve(subscriptionId);
};

// Cancel subscription
export const cancelSubscription = async (subscriptionId) => {
  if (!stripe) throw new Error('Stripe not configured');
  return await stripe.subscriptions.cancel(subscriptionId);
};

// Construct webhook event
export const constructWebhookEvent = (payload, signature) => {
  if (!stripe) throw new Error('Stripe not configured');
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
};

export default stripe;
