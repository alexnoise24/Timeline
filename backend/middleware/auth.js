import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Issue JWT tokens for authenticated users
export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication token was not provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requirePhotographer = (req, res, next) => {
  if (req.user.role !== 'photographer') {
    return res.status(403).json({ message: 'Access denied. Photographer role required.' });
  }
  next();
};

export const requireTimelineAccess = async (req, res, next) => {
  try {
    const timelineId = req.params.id || req.params.timelineId;
    const userId = req.user._id;

    // Find the timeline
    const Timeline = (await import('../models/Timeline.js')).default;
    const timeline = await Timeline.findById(timelineId);

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    // Check if user is the owner (photographer)
    if (timeline.owner.toString() === userId.toString()) {
      req.userTimelineRole = 'owner';
      return next();
    }

    // Check if user is a collaborator
    const collaborator = timeline.collaborators.find(
      collab => collab.user.toString() === userId.toString()
    );

    if (collaborator) {
      req.userTimelineRole = collaborator.role;
      return next();
    }

    // Check if user has a pending/accepted invitation
    const invitation = req.user.invitedTimelines.find(
      invite => invite.timelineId.toString() === timelineId.toString() &&
      (invite.status === 'accepted' || invite.status === 'pending')
    );

    if (invitation) {
      req.userTimelineRole = 'invited';
      return next();
    }

    return res.status(403).json({ message: 'Access denied. You do not have permission to access this timeline.' });
  } catch (error) {
    console.error('Timeline access check error:', error);
    res.status(500).json({ message: 'Error checking timeline access' });
  }
};

export const requireTimelineOwner = async (req, res, next) => {
  try {
    const timelineId = req.params.id || req.params.timelineId;
    const userId = req.user._id;

    const Timeline = (await import('../models/Timeline.js')).default;
    const timeline = await Timeline.findById(timelineId);

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    if (timeline.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied. Only the timeline owner can perform this action.' });
    }

    next();
  } catch (error) {
    console.error('Timeline owner check error:', error);
    res.status(500).json({ message: 'Error checking timeline ownership' });
  }
};
