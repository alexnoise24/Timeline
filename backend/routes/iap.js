import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { logActivity } from '../services/activityLogger.js';

const router = express.Router();

// RevenueCat entitlement configured in the RevenueCat dashboard
const ENTITLEMENT_ID = 'pro';

// Plans that must never be touched by IAP events
const PROTECTED_PLANS = ['master', 'lifetime'];

async function grantPro(user, expirationMs, source = 'apple') {
  user.current_plan = 'pro';
  user.plan_source = source;
  user.plan_start_date = user.plan_start_date || new Date();
  user.plan_expiration_date = expirationMs ? new Date(expirationMs) : null;
  user.is_payment_required = false;
  await user.save();
}

async function revokePro(user) {
  // Only downgrade plans that Apple granted — never manual/Stripe/master/lifetime
  if (user.plan_source !== 'apple') return false;
  if (PROTECTED_PLANS.includes(user.current_plan)) return false;
  user.current_plan = 'free';
  user.plan_source = null;
  user.plan_expiration_date = null;
  await user.save();
  return true;
}

// ---------------------------------------------------------------------------
// POST /api/iap/webhook — RevenueCat server notifications
// Auth: static Authorization header configured in the RevenueCat dashboard,
// compared against REVENUECAT_WEBHOOK_SECRET.
// ---------------------------------------------------------------------------
router.post('/webhook', async (req, res) => {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!secret || req.headers.authorization !== secret) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const event = req.body?.event;
    if (!event) return res.status(400).json({ message: 'Missing event' });

    // app_user_id is the Mongo user _id (set by the app at login).
    // RevenueCat anonymous ids ($RCAnonymousID:...) can't be mapped — ack and skip.
    const appUserId = event.app_user_id;
    if (!appUserId || appUserId.startsWith('$RCAnonymousID')) {
      return res.json({ received: true, skipped: 'anonymous user' });
    }

    const user = await User.findById(appUserId).catch(() => null);
    if (!user) {
      console.warn(`[iap] webhook for unknown user ${appUserId} (${event.type})`);
      return res.json({ received: true, skipped: 'user not found' });
    }

    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
      case 'PRODUCT_CHANGE':
      case 'NON_RENEWING_PURCHASE':
        await grantPro(user, event.expiration_at_ms);
        logActivity(user._id, user.name, 'iap.purchase', { type: event.type, product: event.product_id }, req);
        break;

      case 'EXPIRATION': {
        const revoked = await revokePro(user);
        logActivity(user._id, user.name, 'iap.expiration', { revoked }, req);
        break;
      }

      case 'BILLING_ISSUE':
        // Grace period is handled by Apple/RevenueCat; access is removed by the
        // EXPIRATION event when it actually lapses. Log only.
        logActivity(user._id, user.name, 'iap.billing_issue', {}, req);
        break;

      case 'CANCELLATION':
        // Auto-renew turned off — access continues until EXPIRATION. Log only.
        logActivity(user._id, user.name, 'iap.cancellation', {}, req);
        break;

      default:
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[iap] webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/iap/verify — called by the app right after a purchase/restore so
// the plan updates immediately without waiting for the webhook. Verifies the
// subscriber server-side against the RevenueCat REST API.
// ---------------------------------------------------------------------------
router.post('/verify', authenticate, async (req, res) => {
  const apiKey = process.env.REVENUECAT_SECRET_KEY;
  if (!apiKey) {
    return res.status(503).json({ message: 'IAP verification not configured' });
  }

  try {
    const response = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(req.userId)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!response.ok) {
      return res.status(502).json({ message: 'Could not verify subscription' });
    }

    const data = await response.json();
    const entitlement = data?.subscriber?.entitlements?.[ENTITLEMENT_ID];
    const isActive = entitlement && new Date(entitlement.expires_date) > new Date();

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (isActive) {
      await grantPro(user, new Date(entitlement.expires_date).getTime());
      logActivity(user._id, user.name, 'iap.verify', { result: 'active' }, req);
    }

    res.json({
      active: !!isActive,
      current_plan: user.current_plan,
      plan_expiration_date: user.plan_expiration_date,
    });
  } catch (error) {
    console.error('[iap] verify error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
});

export default router;
