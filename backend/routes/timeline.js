import express from 'express';
import Timeline from '../models/Timeline.js';
import { authenticate, requirePhotographer, requireTimelineAccess, requireTimelineOwner } from '../middleware/auth.js';
import { io } from '../server.js';

const router = express.Router();

// Get all timelines for user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get timelines where user is owner or collaborator
    const ownedTimelines = await Timeline.find({ owner: userId })
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar')
      .sort({ updatedAt: -1 });

    // Get timelines where user is invited (accepted invitations)
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId).populate({
      path: 'invitedTimelines.timelineId',
      populate: [
        { path: 'owner', select: 'name email avatar' },
        { path: 'collaborators.user', select: 'name email avatar' }
      ]
    });

    // Filter for accepted invitations and ensure timeline exists
    const invitedTimelines = user.invitedTimelines
      .filter(invite => invite.status === 'accepted' && invite.timelineId)
      .map(invite => invite.timelineId)
      .filter(timeline => timeline !== null); // Remove any null timelines

    // Combine and deduplicate timelines (in case user owns a timeline they're also invited to)
    const timelineIds = new Set([
      ...ownedTimelines.map(t => t._id.toString()),
      ...invitedTimelines.map(t => t._id.toString())
    ]);
    
    const allTimelines = [
      ...ownedTimelines,
      ...invitedTimelines.filter(t => !ownedTimelines.some(owned => owned._id.toString() === t._id.toString()))
    ];

    res.json({ timelines: allTimelines });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener timelines' });
  }
});

// Get single timeline
router.get('/:id', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar')
      .populate('events.createdBy', 'name email avatar')
      .populate('events.notes.author', 'name email avatar')
      .populate('changeLogs.user', 'name email avatar')
      .populate('events.changeLogs.user', 'name email avatar')
      .populate('shotList.createdBy', 'name email avatar')
      .populate('shotList.completedBy', 'name email avatar');

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline no encontrado' });
    }

    res.json({ timeline });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener timeline' });
  }
});

// Create timeline (only photographers)
router.post('/', authenticate, requirePhotographer, async (req, res) => {
  try {
    const timeline = new Timeline({
      ...req.body,
      owner: req.userId,
      changeLogs: [{
        action: 'created',
        user: req.userId,
        description: 'Timeline created'
      }]
    });

    await timeline.save();
    await timeline.populate('owner', 'name email avatar');

    res.status(201).json({ timeline });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create timeline' });
  }
});

// Update timeline
router.put('/:id', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline no encontrado' });
    }

    // Check if user has edit permissions
    const canEdit = timeline.owner.equals(req.userId) ||
      timeline.collaborators.some(c => c.user.equals(req.userId) && c.role === 'editor') ||
      req.userTimelineRole === 'invited';

    if (!canEdit) {
      return res.status(403).json({ message: 'No tienes permisos para editar' });
    }

    Object.assign(timeline, req.body);
    timeline.changeLogs.push({
      action: 'updated',
      user: req.userId,
      description: 'Timeline actualizado'
    });

    await timeline.save();
    await timeline.populate('owner', 'name email avatar');

    res.json({ timeline });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar timeline' });
  }
});

// Add collaborator (only owner)
router.post('/:id/collaborators', authenticate, requireTimelineOwner, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline || !timeline.owner.equals(req.userId)) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const { userId, role } = req.body;

    if (timeline.collaborators.some(c => c.user.equals(userId))) {
      return res.status(400).json({ message: 'Usuario ya es colaborador' });
    }

    timeline.collaborators.push({ user: userId, role });
    await timeline.save();
    await timeline.populate('collaborators.user', 'name email avatar');

    res.status(201).json({ timeline });
  } catch (error) {
    res.status(500).json({ message: 'Error al agregar colaborador' });
  }
});

// Add event to timeline
router.post('/:id/events', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    // Check if user has edit permissions
    const canEdit = timeline.owner.equals(req.userId) ||
      timeline.collaborators.some(c => c.user.equals(req.userId) && c.role === 'editor') ||
      req.userTimelineRole === 'invited';

    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to edit' });
    }

    const { title, description, time, location, category } = req.body;
    const event = {
      title,
      description,
      date: timeline.weddingDate,
      time,
      location,
      category,
      createdBy: req.userId,
      changeLogs: [{
        action: 'created',
        user: req.userId,
        description: 'Event created'
      }]
    };

    timeline.events.push(event);
    await timeline.save();

    const newEvent = timeline.events[timeline.events.length - 1];
    await timeline.populate('events.createdBy', 'name email avatar');

    res.status(201).json({ event: newEvent });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add event' });
  }
});

// Update event
router.put('/:id/events/:eventId', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    // Check if user has edit permissions
    const canEdit = timeline.owner.equals(req.userId) ||
      timeline.collaborators.some(c => c.user.equals(req.userId) && c.role === 'editor') ||
      req.userTimelineRole === 'invited';

    if (!canEdit) {
      return res.status(403).json({ message: 'No tienes permisos para editar' });
    }

    const event = timeline.events.id(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    Object.assign(event, req.body);
    event.changeLogs.push({
      action: 'updated',
      user: req.userId,
      description: 'Evento actualizado'
    });

    await timeline.save();
    await timeline.populate('events.createdBy events.changeLogs.user', 'name email avatar');

    res.json({ event });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar evento' });
  }
});

// Add note to event
router.post('/:id/events/:eventId/notes', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline no encontrado' });
    }

    // Check if user has edit permissions
    const canEdit = timeline.owner.equals(req.userId) ||
      timeline.collaborators.some(c => c.user.equals(req.userId) && c.role === 'editor') ||
      req.userTimelineRole === 'invited';

    if (!canEdit) {
      return res.status(403).json({ message: 'No tienes permisos para agregar notas' });
    }

    const event = timeline.events.id(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    const note = {
      content: req.body.content,
      author: req.userId
    };

    event.notes.push(note);
    event.changeLogs.push({
      action: 'note_added',
      user: req.userId,
      description: 'Nota agregada'
    });

    await timeline.save();

    const newNote = event.notes[event.notes.length - 1];
    await timeline.populate('events.notes.author', 'name email avatar');

    res.status(201).json({ note: newNote });
  } catch (error) {
    res.status(500).json({ message: 'Error al agregar nota' });
  }
});

// Add shot to timeline
router.post('/:id/shots', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    // Check if user has edit permissions
    const canEdit = timeline.owner.equals(req.userId) ||
      timeline.collaborators.some(c => c.user.equals(req.userId) && c.role === 'editor') ||
      req.userTimelineRole === 'invited';

    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to edit' });
    }

    const { title, category, description } = req.body;
    const shot = {
      title,
      category,
      description,
      isCompleted: false,
      createdBy: req.userId
    };

    timeline.shotList.push(shot);
    await timeline.save();

    const newShot = timeline.shotList[timeline.shotList.length - 1];
    await timeline.populate('shotList.createdBy', 'name email avatar');

    res.status(201).json({ shot: newShot });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add shot' });
  }
});

// Update shot
router.put('/:id/shots/:shotId', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    // Check if user has edit permissions
    const canEdit = timeline.owner.equals(req.userId) ||
      timeline.collaborators.some(c => c.user.equals(req.userId) && c.role === 'editor') ||
      req.userTimelineRole === 'invited';

    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to edit' });
    }

    const shot = timeline.shotList.id(req.params.shotId);
    if (!shot) {
      return res.status(404).json({ message: 'Shot not found' });
    }

    // If marking as completed, set completion info
    if (req.body.isCompleted && !shot.isCompleted) {
      shot.completedBy = req.userId;
      shot.completedAt = new Date();
    } else if (req.body.isCompleted === false && shot.isCompleted) {
      shot.completedBy = undefined;
      shot.completedAt = undefined;
    }

    Object.assign(shot, req.body);
    shot.updatedAt = new Date();

    await timeline.save();
    await timeline.populate('shotList.createdBy shotList.completedBy', 'name email avatar');

    res.json({ shot });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update shot' });
  }
});

// Delete shot
router.delete('/:id/shots/:shotId', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    // Check if user has edit permissions
    const canEdit = timeline.owner.equals(req.userId) ||
      timeline.collaborators.some(c => c.user.equals(req.userId) && c.role === 'editor') ||
      req.userTimelineRole === 'invited';

    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to edit' });
    }

    timeline.shotList.pull(req.params.shotId);
    await timeline.save();

    res.json({ message: 'Shot deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete shot' });
  }
});

// Delete timeline (only owner can delete)
router.delete('/:id', authenticate, requireTimelineOwner, async (req, res) => {
  try {
    const { id } = req.params;

    const timeline = await Timeline.findById(id);
    
    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    // Delete the timeline
    await Timeline.findByIdAndDelete(id);

    // TODO: Also remove this timeline from all users' invitedTimelines
    const User = (await import('../models/User.js')).default;
    await User.updateMany(
      { 'invitedTimelines.timelineId': id },
      { $pull: { invitedTimelines: { timelineId: id } } }
    );

    res.json({ message: 'Timeline deleted successfully' });
  } catch (error) {
    console.error('Delete timeline error:', error);
    res.status(500).json({ message: 'Failed to delete timeline' });
  }
});

export default router;
