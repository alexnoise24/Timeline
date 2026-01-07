import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { isMaster } from '../config/constants.js';
import stripe, {
  createCheckoutSession,
  createBillingPortalSession,
  constructWebhookEvent,
  getPlanFromPriceId,
  STRIPE_PRICES,
} from '../services/stripe.js';

const router = express.Router();

// Get available prices
router.get('/prices', (req, res) => {
  res.json({
    starter: {
      priceId: STRIPE_PRICES.starter,
      amount: 900, // $9.00 in cents
      currency: 'usd',
    },
    pro: {
      priceId: STRIPE_PRICES.pro,
      amount: 1900, // $19.00 in cents
      currency: 'usd',
    },
    studio: {
      priceId: STRIPE_PRICES.studio,
      amount: 3900, // $39.00 in cents
      currency: 'usd',
    },
  });
});

// Create checkout session
router.post('/create-checkout-session', authenticate, async (req, res) => {
  console.log('🔵 Stripe checkout request received:', req.body);
  try {
    const { planId } = req.body;
    console.log('🔵 Plan ID:', planId);
    const user = await User.findById(req.userId);
    console.log('🔵 User found:', user?.email);

    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Master users don't need to pay
    if (isMaster(user)) {
      return res.status(400).json({ message: 'El usuario master no necesita suscripción' });
    }

    // Get the price ID for the plan
    const priceId = STRIPE_PRICES[planId];
    console.log('🔵 Price ID for plan:', priceId);
    if (!priceId) {
      console.log('❌ Invalid plan - no price ID found');
      return res.status(400).json({ message: 'Plan no válido' });
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://lenzu.app';
    console.log('🔵 Creating checkout session with baseUrl:', baseUrl);
    
    const session = await createCheckoutSession({
      userId: user._id.toString(),
      userEmail: user.email,
      priceId,
      successUrl: `${baseUrl}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/pricing?canceled=true`,
    });

    console.log('🔵 Session created successfully:', session.url);
    res.json({ url: session.url });
  } catch (error) {
    console.error('❌ Error creating checkout session:', error.message);
    console.error('❌ Full error:', error);
    res.status(500).json({ message: 'Error al crear sesión de pago' });
  }
});

// Create billing portal session (for managing subscription)
router.post('/create-portal-session', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!user.stripe_customer_id) {
      return res.status(400).json({ message: 'No tienes una suscripción activa' });
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://lenzu.app';

    const session = await createBillingPortalSession({
      customerId: user.stripe_customer_id,
      returnUrl: `${baseUrl}/pricing`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ message: 'Error al crear sesión del portal' });
  }
});

// Webhook handler - receives events from Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = constructWebhookEvent(req.body, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      console.log(`Checkout completed for user ${userId}`);

      // Get subscription details to find the plan
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0].price.id;
      const planName = getPlanFromPriceId(priceId);

      // Update user with subscription info
      await User.findByIdAndUpdate(userId, {
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        current_plan: planName,
        is_trial_active: false,
        plan_start_date: new Date(),
        plan_expiration_date: new Date(subscription.current_period_end * 1000),
      });

      console.log(`User ${userId} upgraded to ${planName} plan`);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const userId = subscription.metadata.userId;

      if (!userId) {
        console.log('No userId in subscription metadata');
        break;
      }

      const priceId = subscription.items.data[0].price.id;
      const planName = getPlanFromPriceId(priceId);

      // Check if subscription is active
      const isActive = ['active', 'trialing'].includes(subscription.status);

      await User.findByIdAndUpdate(userId, {
        current_plan: isActive ? planName : 'none',
        plan_expiration_date: new Date(subscription.current_period_end * 1000),
      });

      console.log(`Subscription updated for user ${userId}: ${planName}, active: ${isActive}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const userId = subscription.metadata.userId;

      if (!userId) {
        // Try to find user by customer ID
        const user = await User.findOne({ stripe_customer_id: subscription.customer });
        if (user) {
          await User.findByIdAndUpdate(user._id, {
            current_plan: 'none',
            stripe_subscription_id: null,
            plan_expiration_date: null,
          });
          console.log(`Subscription canceled for user ${user._id}`);
        }
      } else {
        await User.findByIdAndUpdate(userId, {
          current_plan: 'none',
          stripe_subscription_id: null,
          plan_expiration_date: null,
        });
        console.log(`Subscription canceled for user ${userId}`);
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      if (subscriptionId) {
        const user = await User.findOne({ stripe_subscription_id: subscriptionId });
        if (user) {
          // Extend plan expiration
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await User.findByIdAndUpdate(user._id, {
            plan_expiration_date: new Date(subscription.current_period_end * 1000),
          });
          console.log(`Payment succeeded, extended plan for user ${user._id}`);
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      if (subscriptionId) {
        const user = await User.findOne({ stripe_subscription_id: subscriptionId });
        if (user) {
          console.log(`Payment failed for user ${user._id}`);
          // Could send email notification here
        }
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
