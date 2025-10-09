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

export default router;
