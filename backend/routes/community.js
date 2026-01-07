import express from 'express';
import CommunityMessage from '../models/CommunityMessage.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { isMaster } from '../config/constants.js';

const router = express.Router();

// Check if user can access community (Starter+ plan or Master, not guest)
const canAccessCommunity = (user) => {
  if (!user) return false;
  if (user.role === 'guest') return false;
  if (isMaster(user)) return true;
  
  const allowedPlans = ['starter', 'pro', 'studio', 'trial'];
  return allowedPlans.includes(user.current_plan);
};

// Get community messages
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!canAccessCommunity(user)) {
      return res.status(403).json({ 
        message: 'Community access requires Starter plan or higher',
        requires_plan: 'starter'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await CommunityMessage.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email role current_plan')
      .lean();

    const total = await CommunityMessage.countDocuments();

    res.json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting community messages:', error);
    res.status(500).json({ message: 'Error al obtener mensajes' });
  }
});

// Post a community message
router.post('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!canAccessCommunity(user)) {
      return res.status(403).json({ 
        message: 'Community access requires Starter plan or higher',
        requires_plan: 'starter'
      });
    }

    const { content, type } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'El mensaje no puede estar vacío' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ message: 'El mensaje es demasiado largo (máx. 1000 caracteres)' });
    }

    const message = new CommunityMessage({
      user: req.userId,
      content: content.trim(),
      type: type || 'general'
    });

    await message.save();

    // Populate user info before returning
    await message.populate('user', 'name email role current_plan');

    res.status(201).json({ message });
  } catch (error) {
    console.error('Error posting community message:', error);
    res.status(500).json({ message: 'Error al enviar mensaje' });
  }
});

// Delete a message (only master or message owner)
router.delete('/:messageId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const message = await CommunityMessage.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Mensaje no encontrado' });
    }

    // Only master or message owner can delete
    if (!isMaster(user) && message.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este mensaje' });
    }

    await CommunityMessage.findByIdAndDelete(req.params.messageId);
    res.json({ message: 'Mensaje eliminado' });
  } catch (error) {
    console.error('Error deleting community message:', error);
    res.status(500).json({ message: 'Error al eliminar mensaje' });
  }
});

export default router;
