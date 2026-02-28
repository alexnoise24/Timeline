import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Timeline from '../models/Timeline.js';
import { authenticate, requirePhotographer, requireTimelineAccess, requireTimelineOwner } from '../middleware/auth.js';
import { io } from '../server.js';
import upload from '../middleware/upload.js';
import { uploadInspiration, processInspirationImage } from '../middleware/uploadInspiration.js';
import { getTimelineLimit, isMaster } from '../config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    let timeline = await Timeline.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar')
      .populate('events.createdBy', 'name email avatar')
      .populate('events.notes.author', 'name email avatar')
      .populate('changeLogs.user', 'name email avatar')
      .populate('events.changeLogs.user', 'name email avatar')
      .populate('shotList.createdBy', 'name email avatar')
      .populate('shotList.completedBy', 'name email avatar')
      .populate('days.events.createdBy', 'name email avatar')
      .populate('days.events.notes.author', 'name email avatar')
      .populate('days.events.changeLogs.user', 'name email avatar')
      .populate('days.events.completedBy', 'name email avatar');

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline no encontrado' });
    }

    // Auto-migrate: If timeline has events but no days, migrate them
    if (timeline.events && timeline.events.length > 0 && (!timeline.days || timeline.days.length === 0)) {
      console.log(`Migrating timeline ${timeline._id} to multi-day format...`);
      
      const defaultDay = {
        date: timeline.weddingDate,
        label: 'Wedding Day',
        events: timeline.events,
        order: 0
      };
      
      timeline.days = [defaultDay];
      timeline.events = [];  // Clear old events array
      
      await timeline.save();
      
      // Re-fetch with populates
      timeline = await Timeline.findById(req.params.id)
        .populate('owner', 'name email avatar')
        .populate('collaborators.user', 'name email avatar')
        .populate('changeLogs.user', 'name email avatar')
        .populate('shotList.createdBy', 'name email avatar')
        .populate('shotList.completedBy', 'name email avatar')
        .populate('days.events.createdBy', 'name email avatar')
        .populate('days.events.notes.author', 'name email avatar')
        .populate('days.events.changeLogs.user', 'name email avatar')
        .populate('days.events.completedBy', 'name email avatar');
      
      console.log(`Migration complete for timeline ${timeline._id}`);
    }

    res.json({ timeline });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ message: 'Error al obtener timeline' });
  }
});

// Create timeline (only photographers)
router.post('/', authenticate, requirePhotographer, async (req, res) => {
  try {
    // Check timeline limit for user's plan
    if (!isMaster(req.user)) {
      const currentTimelines = await Timeline.countDocuments({ owner: req.userId });
      const limit = getTimelineLimit(req.user);
      
      if (currentTimelines >= limit) {
        return res.status(403).json({ 
          message: `Has alcanzado el límite de ${limit} proyectos para tu plan. Actualiza tu plan para crear más proyectos.`,
          code: 'TIMELINE_LIMIT_REACHED',
          limit,
          current: currentTimelines
        });
      }
    }

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

// Remove collaborator (only owner)
router.delete('/:id/collaborators/:userId', authenticate, requireTimelineOwner, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline || !timeline.owner.equals(req.userId)) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const { userId } = req.params;

    // Filter out the collaborator
    const initialLength = timeline.collaborators.length;
    timeline.collaborators = timeline.collaborators.filter(
      c => c.user.toString() !== userId
    );

    if (timeline.collaborators.length === initialLength) {
      return res.status(404).json({ message: 'Collaborator not found' });
    }

    await timeline.save();
    await timeline.populate('collaborators.user', 'name email avatar');

    res.json({ message: 'Collaborator removed successfully', timeline });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    res.status(500).json({ message: 'Error al eliminar colaborador' });
  }
});

// =====================
// DAY MANAGEMENT ROUTES
// =====================

// Add a new day to timeline
router.post('/:id/days', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    const canEdit = timeline.owner.equals(req.userId) ||
      timeline.collaborators.some(c => c.user.equals(req.userId) && c.role === 'editor') ||
      req.userTimelineRole === 'invited';

    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to edit' });
    }

    const { date, label } = req.body;
    
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    // Parse date as local date (avoid timezone shift)
    const [year, month, day] = date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day, 12, 0, 0); // noon to avoid DST issues
    
    const newDay = {
      date: localDate,
      label: label || '',
      events: [],
      order: timeline.days.length
    };

    timeline.days.push(newDay);
    
    // Sort days by date
    timeline.days.sort((a, b) => new Date(a.date) - new Date(b.date));
    // Update order after sorting
    timeline.days.forEach((day, index) => {
      day.order = index;
    });
    
    await timeline.save();

    const addedDay = timeline.days[timeline.days.length - 1] || timeline.days.find(d => 
      d.label === (label || '') && new Date(d.date).getDate() === day
    );

    res.status(201).json({ day: addedDay, days: timeline.days });
  } catch (error) {
    console.error('Error adding day:', error);
    res.status(500).json({ message: 'Failed to add day' });
  }
});

// Update a day (date or label)
router.put('/:id/days/:dayId', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    const canEdit = timeline.owner.equals(req.userId) ||
      timeline.collaborators.some(c => c.user.equals(req.userId) && c.role === 'editor') ||
      req.userTimelineRole === 'invited';

    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to edit' });
    }

    const day = timeline.days.id(req.params.dayId);
    if (!day) {
      return res.status(404).json({ message: 'Day not found' });
    }

    const { date, label } = req.body;
    if (date) {
      // Parse date as local date (avoid timezone shift)
      const [year, month, dayNum] = date.split('-').map(Number);
      day.date = new Date(year, month - 1, dayNum, 12, 0, 0); // noon to avoid DST issues
    }
    if (label !== undefined) day.label = label;

    // Re-sort days by date if date changed
    if (date) {
      timeline.days.sort((a, b) => new Date(a.date) - new Date(b.date));
      timeline.days.forEach((d, index) => {
        d.order = index;
      });
    }

    await timeline.save();

    res.json({ day, days: timeline.days });
  } catch (error) {
    console.error('Error updating day:', error);
    res.status(500).json({ message: 'Failed to update day' });
  }
});

// Delete a day (and all its events)
router.delete('/:id/days/:dayId', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    const canEdit = timeline.owner.equals(req.userId) ||
      timeline.collaborators.some(c => c.user.equals(req.userId) && c.role === 'editor') ||
      req.userTimelineRole === 'invited';

    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to edit' });
    }

    const day = timeline.days.id(req.params.dayId);
    if (!day) {
      return res.status(404).json({ message: 'Day not found' });
    }

    timeline.days.pull(req.params.dayId);
    
    // Update order after deletion
    timeline.days.forEach((d, index) => {
      d.order = index;
    });

    await timeline.save();

    res.json({ message: 'Day deleted successfully', days: timeline.days });
  } catch (error) {
    console.error('Error deleting day:', error);
    res.status(500).json({ message: 'Failed to delete day' });
  }
});

// =====================
// DAY EVENT ROUTES
// =====================

// Add event to a specific day
router.post('/:id/days/:dayId/events', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    const canEdit = timeline.owner.equals(req.userId) ||
      timeline.collaborators.some(c => c.user.equals(req.userId) && c.role === 'editor') ||
      req.userTimelineRole === 'invited';

    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to edit' });
    }

    const day = timeline.days.id(req.params.dayId);
    if (!day) {
      return res.status(404).json({ message: 'Day not found' });
    }

    const { title, description, time, location, category } = req.body;
    const event = {
      title,
      description,
      date: day.date,  // Use day's date
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

    day.events.push(event);
    await timeline.save();

    const newEvent = day.events[day.events.length - 1];
    
    await timeline.populate('days.events.createdBy', 'name email avatar');

    res.status(201).json({ event: newEvent, day });
  } catch (error) {
    console.error('Error adding event to day:', error);
    res.status(500).json({ message: 'Failed to add event' });
  }
});

// Update event in a day
router.put('/:id/days/:dayId/events/:eventId', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    const canEdit = timeline.owner.equals(req.userId) ||
      timeline.collaborators.some(c => c.user.equals(req.userId) && c.role === 'editor') ||
      req.userTimelineRole === 'invited';

    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to edit' });
    }

    const day = timeline.days.id(req.params.dayId);
    if (!day) {
      return res.status(404).json({ message: 'Day not found' });
    }

    const event = day.events.id(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { title, description, time, location, category } = req.body;
    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (time !== undefined) event.time = time;
    if (location !== undefined) event.location = location;
    if (category !== undefined) event.category = category;
    event.updatedAt = new Date();

    event.changeLogs.push({
      action: 'updated',
      user: req.userId,
      description: 'Event updated'
    });

    await timeline.save();
    await timeline.populate('days.events.createdBy days.events.changeLogs.user', 'name email avatar');

    res.json({ event, day });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Failed to update event' });
  }
});

// Delete event from a day
router.delete('/:id/days/:dayId/events/:eventId', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    const canEdit = timeline.owner.equals(req.userId) ||
      timeline.collaborators.some(c => c.user.equals(req.userId) && c.role === 'editor') ||
      req.userTimelineRole === 'invited';

    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to edit' });
    }

    const day = timeline.days.id(req.params.dayId);
    if (!day) {
      return res.status(404).json({ message: 'Day not found' });
    }

    const event = day.events.id(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    day.events.pull(req.params.eventId);
    await timeline.save();

    res.json({ message: 'Event deleted successfully', day });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

// Toggle event completion in a day
router.patch('/:id/days/:dayId/events/:eventId/complete', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    const canEdit = timeline.owner.equals(req.userId) ||
      timeline.collaborators.some(c => c.user.equals(req.userId) && c.role === 'editor') ||
      req.userTimelineRole === 'invited';

    if (!canEdit) {
      return res.status(403).json({ message: 'No permission to mark event as complete' });
    }

    const day = timeline.days.id(req.params.dayId);
    if (!day) {
      return res.status(404).json({ message: 'Day not found' });
    }

    const event = day.events.id(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Toggle completion status
    event.isCompleted = !event.isCompleted;
    
    if (event.isCompleted) {
      event.completedBy = req.userId;
      event.completedAt = new Date();
      event.changeLogs.push({
        action: 'updated',
        user: req.userId,
        description: 'Event marked as complete'
      });
    } else {
      event.completedBy = undefined;
      event.completedAt = undefined;
      event.changeLogs.push({
        action: 'updated',
        user: req.userId,
        description: 'Event marked as incomplete'
      });
    }

    await timeline.save();
    await timeline.populate('days.events.createdBy days.events.completedBy days.events.changeLogs.user', 'name email avatar');

    res.json({ event, day });
  } catch (error) {
    console.error('Error toggling event completion:', error);
    res.status(500).json({ message: 'Error updating event completion status' });
  }
});

// Add note to event in a day
router.post('/:id/days/:dayId/events/:eventId/notes', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    const canEdit = timeline.owner.equals(req.userId) ||
      timeline.collaborators.some(c => c.user.equals(req.userId) && c.role === 'editor') ||
      req.userTimelineRole === 'invited';

    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to add notes' });
    }

    const day = timeline.days.id(req.params.dayId);
    if (!day) {
      return res.status(404).json({ message: 'Day not found' });
    }

    const event = day.events.id(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const note = {
      content: req.body.content,
      author: req.userId
    };

    event.notes.push(note);
    event.changeLogs.push({
      action: 'note_added',
      user: req.userId,
      description: 'Note added'
    });

    await timeline.save();

    const newNote = event.notes[event.notes.length - 1];
    await timeline.populate('days.events.notes.author', 'name email avatar');

    res.status(201).json({ note: newNote, event });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ message: 'Failed to add note' });
  }
});

// =====================
// LEGACY EVENT ROUTES (for backward compatibility)
// =====================

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

// Delete event
router.delete('/:id/events/:eventId', authenticate, requireTimelineAccess, async (req, res) => {
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
      return res.status(403).json({ message: 'No tienes permisos para eliminar' });
    }

    const eventExists = timeline.events.id(req.params.eventId);
    if (!eventExists) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    timeline.events.pull(req.params.eventId);
    await timeline.save();

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Error al eliminar evento' });
  }
});

// Toggle event completion status
router.patch('/:id/events/:eventId/complete', authenticate, requireTimelineAccess, async (req, res) => {
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
      return res.status(403).json({ message: 'No permission to mark event as complete' });
    }

    const event = timeline.events.id(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Toggle completion status
    event.isCompleted = !event.isCompleted;
    
    if (event.isCompleted) {
      event.completedBy = req.userId;
      event.completedAt = new Date();
      event.changeLogs.push({
        action: 'updated',
        user: req.userId,
        description: 'Event marked as complete'
      });
    } else {
      event.completedBy = undefined;
      event.completedAt = undefined;
      event.changeLogs.push({
        action: 'updated',
        user: req.userId,
        description: 'Event marked as incomplete'
      });
    }

    await timeline.save();
    await timeline.populate('events.createdBy events.completedBy events.changeLogs.user', 'name email avatar');

    res.json({ event });
  } catch (error) {
    console.error('Error toggling event completion:', error);
    res.status(500).json({ message: 'Error updating event completion status' });
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

// Upload photographer image
router.post('/:id/photographers/upload', authenticate, requireTimelineAccess, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Return the file URL
    const imageUrl = `/uploads/photographers/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading photographer image:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
});

// Add photographer to team
router.post('/:id/photographers', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    // Check if user has edit permissions
    const canEdit = timeline.owner.equals(req.userId) ||
      timeline.collaborators.some(c => c.user.equals(req.userId) && c.role === 'editor');

    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to edit' });
    }

    const { name, role, imageUrl } = req.body;
    
    if (!name || !role || !imageUrl) {
      return res.status(400).json({ message: 'Name, role, and image are required' });
    }

    const photographer = {
      name,
      role,
      imageUrl,
      order: timeline.photographersTeam.length
    };

    timeline.photographersTeam.push(photographer);
    await timeline.save();

    const newPhotographer = timeline.photographersTeam[timeline.photographersTeam.length - 1];
    res.status(201).json({ photographer: newPhotographer });
  } catch (error) {
    console.error('Error adding photographer:', error);
    res.status(500).json({ message: 'Failed to add photographer' });
  }
});

// Update photographer
router.put('/:id/photographers/:photographerId', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    // Check if user has edit permissions
    const canEdit = timeline.owner.equals(req.userId) ||
      timeline.collaborators.some(c => c.user.equals(req.userId) && c.role === 'editor');

    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to edit' });
    }

    const photographer = timeline.photographersTeam.id(req.params.photographerId);
    if (!photographer) {
      return res.status(404).json({ message: 'Photographer not found' });
    }

    const { name, role, imageUrl } = req.body;
    if (name) photographer.name = name;
    if (role) photographer.role = role;
    if (imageUrl) photographer.imageUrl = imageUrl;

    await timeline.save();
    res.json({ photographer });
  } catch (error) {
    console.error('Error updating photographer:', error);
    res.status(500).json({ message: 'Failed to update photographer' });
  }
});

// Delete photographer
router.delete('/:id/photographers/:photographerId', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    // Check if user has edit permissions
    const canEdit = timeline.owner.equals(req.userId) ||
      timeline.collaborators.some(c => c.user.equals(req.userId) && c.role === 'editor');

    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to edit' });
    }

    timeline.photographersTeam.pull(req.params.photographerId);
    await timeline.save();

    res.json({ message: 'Photographer deleted successfully' });
  } catch (error) {
    console.error('Error deleting photographer:', error);
    res.status(500).json({ message: 'Failed to delete photographer' });
  }
});

// Reorder photographers
router.put('/:id/photographers/reorder', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    // Check if user has edit permissions
    const canEdit = timeline.owner.equals(req.userId) ||
      timeline.collaborators.some(c => c.user.equals(req.userId) && c.role === 'editor');

    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to edit' });
    }

    const { photographerIds } = req.body;
    
    if (!Array.isArray(photographerIds)) {
      return res.status(400).json({ message: 'photographerIds must be an array' });
    }

    // Update order based on array position
    photographerIds.forEach((id, index) => {
      const photographer = timeline.photographersTeam.id(id);
      if (photographer) {
        photographer.order = index;
      }
    });

    await timeline.save();
    res.json({ photographersTeam: timeline.photographersTeam });
  } catch (error) {
    console.error('Error reordering photographers:', error);
    res.status(500).json({ message: 'Failed to reorder photographers' });
  }
});

// =====================
// INSPIRATION ROUTES
// =====================

// Upload inspiration image
router.post('/:id/inspiration/upload', 
  authenticate, 
  requireTimelineAccess, 
  uploadInspiration.single('image'), 
  processInspirationImage,
  async (req, res) => {
    try {
      const timeline = await Timeline.findById(req.params.id);
      if (!timeline) {
        return res.status(404).json({ message: 'Timeline not found' });
      }

      const canEdit = timeline.owner.equals(req.userId) ||
        timeline.collaborators.some(c => c.user.equals(req.userId) && c.role === 'editor') ||
        req.userTimelineRole === 'invited';

      if (!canEdit) {
        return res.status(403).json({ message: 'No permission to upload' });
      }

      const newImage = {
        imageUrl: req.processedImage.imageUrl,
        thumbnailUrl: req.processedImage.thumbnailUrl,
        originalName: req.processedImage.originalName,
        uploadedBy: req.userId
      };

      timeline.inspiration.push(newImage);
      await timeline.save();

      const addedImage = timeline.inspiration[timeline.inspiration.length - 1];
      await timeline.populate('inspiration.uploadedBy', 'name email avatar');

      const populatedImage = timeline.inspiration.id(addedImage._id);
      res.status(201).json({ image: populatedImage });
    } catch (error) {
      console.error('Error uploading inspiration:', error);
      res.status(500).json({ message: 'Failed to upload image' });
    }
  }
);

// Update inspiration image notes
router.put('/:id/inspiration/:imageId', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);
    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    const canEdit = timeline.owner.equals(req.userId) ||
      timeline.collaborators.some(c => c.user.equals(req.userId) && c.role === 'editor') ||
      req.userTimelineRole === 'invited';

    if (!canEdit) {
      return res.status(403).json({ message: 'No permission to edit' });
    }

    const image = timeline.inspiration.id(req.params.imageId);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const { notes } = req.body;
    if (notes !== undefined) {
      image.notes = notes;
    }

    await timeline.save();
    await timeline.populate('inspiration.uploadedBy', 'name email avatar');

    const updatedImage = timeline.inspiration.id(req.params.imageId);
    res.json({ image: updatedImage });
  } catch (error) {
    console.error('Error updating inspiration:', error);
    res.status(500).json({ message: 'Failed to update image' });
  }
});

// Delete inspiration image
router.delete('/:id/inspiration/:imageId', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);
    if (!timeline) {
      return res.status(404).json({ message: 'Timeline not found' });
    }

    const canEdit = timeline.owner.equals(req.userId) ||
      timeline.collaborators.some(c => c.user.equals(req.userId) && c.role === 'editor') ||
      req.userTimelineRole === 'invited';

    if (!canEdit) {
      return res.status(403).json({ message: 'No permission to delete' });
    }

    const image = timeline.inspiration.id(req.params.imageId);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete files from disk
    const basePath = path.join(__dirname, '..');
    const imagePath = path.join(basePath, image.imageUrl);
    const thumbPath = path.join(basePath, image.thumbnailUrl);
    
    try {
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    } catch (fileError) {
      console.error('Error deleting files:', fileError);
    }

    timeline.inspiration.pull(req.params.imageId);
    await timeline.save();

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting inspiration:', error);
    res.status(500).json({ message: 'Failed to delete image' });
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
