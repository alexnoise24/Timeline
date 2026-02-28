import express from 'express';
import User from '../models/User.js';
import Timeline from '../models/Timeline.js';
import CommunityMessage from '../models/CommunityMessage.js';
import { authenticate } from '../middleware/auth.js';
import { isMaster } from '../config/constants.js';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const router = express.Router();

// Search users by email or name
router.get('/search', authenticate, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ users: [] });
    }

    const users = await User.find({
      $or: [
        { email: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.userId } // Exclude current user
    })
    .select('name email avatar')
    .limit(10);

    res.json({ users });
  } catch (error) {
    console.error('Error buscando usuarios:', error);
    res.status(500).json({ message: 'Error al buscar usuarios' });
  }
});

// Get user usage stats - MUST be before /:userId route
router.get('/usage', authenticate, async (req, res) => {
  try {
    // Count timelines owned by user
    const timelinesCount = await Timeline.countDocuments({ createdBy: req.userId });
    
    // Count unique collaborators across all user's timelines
    const timelines = await Timeline.find({ createdBy: req.userId }).select('collaborators');
    const uniqueCollaborators = new Set();
    timelines.forEach(timeline => {
      if (timeline.collaborators && timeline.collaborators.length > 0) {
        timeline.collaborators.forEach(collab => {
          if (collab.user) {
            uniqueCollaborators.add(collab.user.toString());
          }
        });
      }
    });

    res.json({
      timelines: timelinesCount,
      collaborators: uniqueCollaborators.size
    });
  } catch (error) {
    console.error('Error getting usage:', error);
    res.status(500).json({ message: 'Error al obtener uso' });
  }
});

// Get user by ID
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('name email avatar');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
});

// Save/Update FCM token for push notifications
router.post('/fcm-token', authenticate, async (req, res) => {
  try {
    const { fcmToken, device = 'web' } = req.body;
    
    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if token already exists
    const existingTokenIndex = user.fcmTokens.findIndex(t => t.token === fcmToken);
    
    if (existingTokenIndex >= 0) {
      // Update existing token's lastUsed timestamp
      user.fcmTokens[existingTokenIndex].lastUsed = new Date();
    } else {
      // Add new token
      user.fcmTokens.push({
        token: fcmToken,
        device,
        createdAt: new Date(),
        lastUsed: new Date()
      });

      // Limit to 5 tokens per user (remove oldest if exceeds)
      if (user.fcmTokens.length > 5) {
        user.fcmTokens.sort((a, b) => b.lastUsed - a.lastUsed);
        user.fcmTokens = user.fcmTokens.slice(0, 5);
      }
    }

    await user.save();
    
    res.json({ 
      message: 'FCM token saved successfully',
      tokenCount: user.fcmTokens.length
    });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({ message: 'Failed to save FCM token' });
  }
});

// Remove FCM token (when user logs out or denies notifications)
router.delete('/fcm-token', authenticate, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    
    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.fcmTokens = user.fcmTokens.filter(t => t.token !== fcmToken);
    await user.save();
    
    res.json({ message: 'FCM token removed successfully' });
  } catch (error) {
    console.error('Error removing FCM token:', error);
    res.status(500).json({ message: 'Failed to remove FCM token' });
  }
});

// Delete user account (required for App Store)
router.delete('/account', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent Master user from being deleted
    if (isMaster(user)) {
      return res.status(403).json({ message: 'Master account cannot be deleted' });
    }

    const { password } = req.body;

    // Verify password before deletion
    if (!password) {
      return res.status(400).json({ message: 'Password is required to delete account' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // 1. Cancel Stripe subscription if exists
    if (stripe && user.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(user.stripe_subscription_id);
      } catch (stripeError) {
        console.error('Error canceling Stripe subscription:', stripeError);
        // Continue with deletion even if Stripe fails
      }
    }

    // 2. Delete all timelines owned by user
    const userTimelines = await Timeline.find({ createdBy: req.userId });
    for (const timeline of userTimelines) {
      // Remove this timeline from all invited users
      await User.updateMany(
        { 'invitedTimelines.timelineId': timeline._id },
        { $pull: { invitedTimelines: { timelineId: timeline._id } } }
      );
    }
    await Timeline.deleteMany({ createdBy: req.userId });

    // 3. Remove user from collaborators in other timelines
    await Timeline.updateMany(
      { 'collaborators.user': req.userId },
      { $pull: { collaborators: { user: req.userId } } }
    );

    // 4. Remove user's invited timelines references
    await User.updateMany(
      { 'invitedTimelines.invitedBy': req.userId },
      { $pull: { invitedTimelines: { invitedBy: req.userId } } }
    );

    // 5. Delete user's community messages
    await CommunityMessage.deleteMany({ user: req.userId });

    // 6. Delete the user
    await User.findByIdAndDelete(req.userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

export default router;
