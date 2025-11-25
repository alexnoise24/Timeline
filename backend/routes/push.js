import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getVapidPublicKey, sendPushNotification } from '../services/webPush.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * GET /api/push/vapid-key
 * Get the public VAPID key for push subscription
 */
router.get('/vapid-key', (req, res) => {
  const publicKey = getVapidPublicKey();
  res.json({ publicKey });
});

/**
 * POST /api/push/subscribe
 * Save push subscription for the authenticated user
 */
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.user._id;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Invalid subscription object' });
    }

    // Find user and add/update subscription
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize pushSubscriptions array if it doesn't exist
    if (!user.pushSubscriptions) {
      user.pushSubscriptions = [];
    }

    // Check if subscription already exists
    const existingIndex = user.pushSubscriptions.findIndex(
      sub => sub.endpoint === subscription.endpoint
    );

    if (existingIndex >= 0) {
      // Update existing subscription
      user.pushSubscriptions[existingIndex] = subscription;
      console.log('📱 Updated push subscription for user:', user.name);
    } else {
      // Add new subscription
      user.pushSubscriptions.push(subscription);
      console.log('📱 Added new push subscription for user:', user.name);
    }

    await user.save();

    res.json({ 
      message: 'Subscription saved successfully',
      subscriptionCount: user.pushSubscriptions.length
    });

  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ message: 'Failed to save subscription' });
  }
});

/**
 * POST /api/push/unsubscribe
 * Remove push subscription for the authenticated user
 */
router.post('/unsubscribe', authMiddleware, async (req, res) => {
  try {
    const { endpoint } = req.body;
    const userId = req.user._id;

    if (!endpoint) {
      return res.status(400).json({ message: 'Endpoint is required' });
    }

    // Find user and remove subscription
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return res.status(404).json({ message: 'No subscriptions found' });
    }

    // Remove subscription with matching endpoint
    user.pushSubscriptions = user.pushSubscriptions.filter(
      sub => sub.endpoint !== endpoint
    );

    await user.save();

    console.log('🔕 Removed push subscription for user:', user.name);

    res.json({ 
      message: 'Subscription removed successfully',
      subscriptionCount: user.pushSubscriptions.length
    });

  } catch (error) {
    console.error('Error removing subscription:', error);
    res.status(500).json({ message: 'Failed to remove subscription' });
  }
});

/**
 * POST /api/push/test
 * Send a test notification to the authenticated user
 */
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return res.status(404).json({ message: 'No push subscriptions found' });
    }

    const notification = {
      title: '🎉 Notificación de prueba',
      body: 'Las notificaciones push están funcionando correctamente!',
      data: {
        url: '/dashboard',
        timestamp: new Date().toISOString()
      }
    };

    // Send to all user's subscriptions
    const results = [];
    for (const subscription of user.pushSubscriptions) {
      const success = await sendPushNotification(subscription, notification);
      results.push({ endpoint: subscription.endpoint, success });
    }

    res.json({ 
      message: 'Test notification sent',
      results 
    });

  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ message: 'Failed to send test notification' });
  }
});

export default router;
