import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

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

export default router;
