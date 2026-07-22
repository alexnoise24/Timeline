import express from 'express';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import EmailLog from '../models/EmailLog.js';
import { authenticate } from '../middleware/auth.js';
import { isMaster } from '../config/constants.js';

const router = express.Router();

// Middleware — solo master puede acceder al panel admin
const requireMaster = (req, res, next) => {
  if (!isMaster(req.user)) {
    return res.status(403).json({ message: 'Access denied.' });
  }
  next();
};

// GET /api/admin/users — lista de usuarios (sin datos sensibles)
router.get('/users', authenticate, requireMaster, async (req, res) => {
  try {
    const users = await User.find({})
      .select('name email current_plan createdAt plan_start_date plan_expiration_date is_trial_active trial_end_date role')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ users });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

// POST /api/admin/users/:id/upgrade-pro — dar Studio 30 días
router.post('/users/:id/upgrade-pro', authenticate, requireMaster, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name email current_plan');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const now = new Date();
    const expiration = new Date(now);
    expiration.setDate(expiration.getDate() + 30);

    await User.findByIdAndUpdate(req.params.id, {
      current_plan: 'studio',
      plan_start_date: now,
      plan_expiration_date: expiration,
      is_trial_active: false
    });

    res.json({
      message: `Plan Studio activado para ${user.name} hasta ${expiration.toLocaleDateString('es-MX')}`,
      expiration
    });
  } catch (error) {
    console.error('Admin upgrade pro error:', error);
    res.status(500).json({ message: 'Error al actualizar plan' });
  }
});

// GET /api/admin/activity — últimos 100 eventos, filtrable
router.get('/activity', authenticate, requireMaster, async (req, res) => {
  try {
    const { eventType, userId, from, to } = req.query;

    const filter = {};
    if (eventType) filter.eventType = eventType;
    if (userId) filter.userId = userId;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to)   filter.timestamp.$lte = new Date(to + 'T23:59:59.999Z');
    }

    const logs = await ActivityLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    res.json({ logs });
  } catch (error) {
    console.error('Admin get activity error:', error);
    res.status(500).json({ message: 'Error al obtener actividad' });
  }
});

// GET /api/admin/emails — últimos 200 correos enviados (invitaciones), filtrable
router.get('/emails', authenticate, requireMaster, async (req, res) => {
  try {
    const { email, from, to } = req.query;

    const filter = {};
    if (email) filter.to = { $regex: email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    if (from || to) {
      filter.sentAt = {};
      if (from) filter.sentAt.$gte = new Date(from);
      if (to)   filter.sentAt.$lte = new Date(to + 'T23:59:59.999Z');
    }

    const emails = await EmailLog.find(filter)
      .sort({ sentAt: -1 })
      .limit(200)
      .lean();

    res.json({ emails });
  } catch (error) {
    console.error('Admin get emails error:', error);
    res.status(500).json({ message: 'Error al obtener correos' });
  }
});

export default router;
