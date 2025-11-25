import User from '../models/User.js';
import { isMaster, canCreateTimelines, hasValidAccess, ROLES } from '../config/constants.js';

/**
 * Middleware to check if user has premium features access
 * Masters always bypass this check
 */
export const requirePremiumAccess = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Master user always has access
    if (isMaster(user)) {
      req.user = user;
      req.isMaster = true;
      return next();
    }

    // Check if user has valid access (trial or plan)
    if (!hasValidAccess(user)) {
      return res.status(403).json({ 
        error: 'premium_required',
        message: 'Tu prueba ha expirado. Por favor, elige un plan para continuar.',
        trial_expired: true,
        current_plan: user.current_plan
      });
    }

    req.user = user;
    req.isMaster = false;
    next();
  } catch (error) {
    console.error('Error in requirePremiumAccess:', error);
    res.status(500).json({ message: 'Error al verificar acceso' });
  }
};

/**
 * Middleware to check if user can create timelines
 * Masters and users with active trial/plan can create
 */
export const requireCanCreateTimelines = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Master user always has access
    if (isMaster(user)) {
      req.user = user;
      req.isMaster = true;
      return next();
    }

    // Check if user can create timelines
    if (!canCreateTimelines(user)) {
      return res.status(403).json({ 
        error: 'create_timeline_restricted',
        message: 'No tienes acceso para crear timelines. Por favor, elige un plan.',
        trial_expired: user.trial_end_date && new Date() > new Date(user.trial_end_date),
        current_plan: user.current_plan
      });
    }

    req.user = user;
    req.isMaster = false;
    next();
  } catch (error) {
    console.error('Error in requireCanCreateTimelines:', error);
    res.status(500).json({ message: 'Error al verificar permisos' });
  }
};

/**
 * Middleware to require specific role(s)
 * Masters always bypass role checks
 */
export const requireRole = (allowedRoles) => {
  // Ensure allowedRoles is an array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      // Master user always has access
      if (isMaster(user)) {
        req.user = user;
        req.isMaster = true;
        return next();
      }

      // Check if user has one of the allowed roles
      if (!roles.includes(user.role)) {
        return res.status(403).json({ 
          error: 'role_required',
          message: 'No tienes los permisos necesarios para esta acción.',
          required_roles: roles,
          current_role: user.role
        });
      }

      req.user = user;
      req.isMaster = false;
      next();
    } catch (error) {
      console.error('Error in requireRole:', error);
      res.status(500).json({ message: 'Error al verificar rol' });
    }
  };
};

/**
 * Middleware to attach user info to request
 * Does not block, just adds user data
 */
export const attachUserInfo = async (req, res, next) => {
  try {
    if (req.userId) {
      const user = await User.findById(req.userId);
      if (user) {
        req.user = user;
        req.isMaster = isMaster(user);
      }
    }
    next();
  } catch (error) {
    console.error('Error in attachUserInfo:', error);
    next(); // Continue even if there's an error
  }
};
