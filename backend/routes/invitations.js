import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Timeline from '../models/Timeline.js';
import { authenticate, requirePhotographer, requireTimelineOwner } from '../middleware/auth.js';
import { sendPushNotification } from '../services/notifications.js';
import { sendProjectInvitationEmail } from '../services/email.js';
import { io } from '../server.js';
import { logActivity } from '../services/activityLogger.js';

const router = express.Router();

// Base URL for building invite links inside emails (frontend origin)
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://lenzu.app';

// Build a targeted, single-use-ish JWT invite token bound to the invited email
const buildInviteUrl = (timelineId, invitedBy, email) => {
  const token = jwt.sign(
    { timelineId, invitedBy, email: email.toLowerCase() },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  return `${FRONTEND_URL}/invite/${token}`;
};

// Create invite link (JWT token) for a timeline
router.post('/create-link/:timelineId',
  authenticate,
  requirePhotographer,
  requireTimelineOwner,
  async (req, res) => {
    try {
      const { timelineId } = req.params;

      // Basic existence check
      const timeline = await Timeline.findById(timelineId);
      if (!timeline) {
        return res.status(404).json({ message: 'Timeline not found' });
      }

      const token = jwt.sign(
        { timelineId, invitedBy: req.userId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Let frontend build the URL with its current origin
      res.json({ token });
    } catch (error) {
      console.error('Create invite link error:', error);
      res.status(500).json({ message: 'Failed to create invite link' });
    }
  }
);

// Accept invitation via token (after user is authenticated)
router.post('/accept-invite-token',
  authenticate,
  [ body('token').notEmpty().withMessage('Token is required') ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { token } = req.body;
      console.log('Accepting invite token for user:', req.user?.email);
      
      let payload;
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified, timelineId:', payload.timelineId);
      } catch (err) {
        console.error('Token verification failed:', err.message);
        return res.status(400).json({ message: 'Invalid or expired invite token' });
      }

      const { timelineId, invitedBy } = payload;

      const timeline = await Timeline.findById(timelineId);
      if (!timeline) {
        console.error('Timeline not found:', timelineId);
        return res.status(404).json({ message: 'Timeline not found' });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        console.error('User not found:', req.user._id);
        return res.status(404).json({ message: 'User not found' });
      }

      // Targeted email invites are bound to a specific address; open "copy link"
      // tokens carry no email and skip this check.
      if (payload.email && payload.email.toLowerCase() !== user.email.toLowerCase()) {
        console.warn('Invite token email mismatch:', payload.email, 'vs', user.email);
        return res.status(403).json({ message: 'This invitation was sent to a different email address.' });
      }

      console.log('User found:', user.email);

      // Ensure invitedTimelines entry exists and set accepted
      const existing = user.invitedTimelines.find(
        (inv) => inv.timelineId.toString() === timelineId.toString()
      );

      if (existing) {
        existing.status = 'accepted';
      } else {
        user.invitedTimelines.push({
          timelineId,
          invitedBy: invitedBy || timeline.owner,
          status: 'accepted'
        });
      }
      await user.save();

      // Add user to timeline's collaborators if not already added
      const alreadyCollaborator = timeline.collaborators.some(
        collab => collab.user.toString() === req.user._id.toString()
      );

      if (!alreadyCollaborator) {
        timeline.collaborators.push({
          user: req.user._id,
          role: 'editor', // Invited users can edit everything
          addedAt: new Date()
        });
        await timeline.save();
        console.log('Added user to timeline collaborators as editor');
      } else {
        console.log('User already a collaborator');
      }

      console.log('Invitation accepted successfully for timeline:', timelineId);

      // Push real-time update so the user's dashboard shows the timeline immediately
      io.to(`user-${req.user._id}`).emit('timeline:invited', {
        timelineId: timelineId.toString(),
        title: timeline.title
      });

      logActivity(req.user._id, req.user.name, 'collaborator.accept', { timelineId, timelineTitle: timeline.title, via: 'token' }, req);

      return res.json({ message: 'Invitation accepted', timelineId });
    } catch (error) {
      console.error('Accept invite token error:', error);
      res.status(500).json({ message: 'Failed to accept invitation' });
    }
  }
);

// Send invitation to user (photographer or guest)
router.post('/invite/:timelineId',
  authenticate,
  requirePhotographer,
  requireTimelineOwner,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('message').optional().isLength({ max: 500 }).withMessage('Message too long')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { timelineId } = req.params;
      const { email, message } = req.body;

      // Find the user — may or may not be registered yet
      const invitedUser = await User.findOne({ email: email.toLowerCase() });

      // Not registered → send an email invitation with a token that auto-joins
      // them to the project once they register (no manual link-sharing needed).
      if (!invitedUser) {
        const timeline = await Timeline.findById(timelineId);
        if (!timeline) {
          return res.status(404).json({ message: 'Timeline not found' });
        }

        const inviteUrl = buildInviteUrl(timelineId, req.userId, email);
        sendProjectInvitationEmail(email.toLowerCase(), req.user, timeline, inviteUrl)
          .catch(err => console.error('Error sending project invitation email:', err));

        logActivity(req.userId, req.user.name, 'collaborator.invite', {
          timelineId, invitedEmail: email.toLowerCase(), timelineTitle: timeline.title, via: 'email-unregistered'
        }, req);

        return res.json({
          message: 'Invitation email sent',
          invitation: { email: email.toLowerCase(), timelineId, status: 'email_sent', registered: false }
        });
      }

      // Check if user is trying to invite themselves
      if (invitedUser._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: 'You cannot invite yourself to a timeline.' });
      }

      // Load the timeline to check collaborator status
      const timeline = await Timeline.findById(timelineId);
      if (!timeline) {
        return res.status(404).json({ message: 'Timeline not found' });
      }

      // Check if user is already an active collaborator on the timeline
      const alreadyCollaborator = timeline.collaborators.some(
        c => c.user.toString() === invitedUser._id.toString()
      );
      if (alreadyCollaborator) {
        return res.status(400).json({ message: 'User is already a collaborator on this timeline.' });
      }

      // Handle any existing invitation entry
      const existingInvitation = invitedUser.invitedTimelines.find(
        invite => invite.timelineId.toString() === timelineId.toString()
      );

      if (existingInvitation) {
        if (existingInvitation.status === 'pending') {
          // Already waiting — don't duplicate
          return res.status(400).json({ message: 'User is already invited to this timeline.' });
        }

        if (existingInvitation.status === 'accepted') {
          // Invitation was accepted but user is not in collaborators — fix the inconsistency
          timeline.collaborators.push({ user: invitedUser._id, role: 'editor', addedAt: new Date() });
          await timeline.save();
          return res.json({
            message: 'User added to timeline as collaborator.',
            invitation: { email: invitedUser.email, timelineId, status: 'accepted' }
          });
        }

        if (existingInvitation.status === 'declined') {
          // Allow re-inviting — reset to pending
          existingInvitation.status = 'pending';
          existingInvitation.invitedBy = req.user._id;
          existingInvitation.invitedAt = new Date();
          await invitedUser.save();

          sendPushNotification(
            [invitedUser._id],
            {
              title: 'New Timeline Invitation',
              body: `${req.user.name} has invited you to collaborate on ${timeline.title}`
            },
            { type: 'invitation', timelineId: timelineId.toString() }
          ).catch(err => console.error('Error sending invitation notification:', err));

          // Notify the invited user's dashboard in real time
          io.to(`user-${invitedUser._id}`).emit('invitation:received', {
            timelineId: timelineId.toString(),
            title: timeline.title
          });

          // Email with a deep link straight to the project
          sendProjectInvitationEmail(
            invitedUser.email, req.user, timeline,
            buildInviteUrl(timelineId, req.userId, invitedUser.email)
          ).catch(err => console.error('Error sending project invitation email:', err));

          return res.json({
            message: 'Invitation sent successfully',
            invitation: { email: invitedUser.email, timelineId, status: 'pending' }
          });
        }
      }

      // No prior invitation — create one
      invitedUser.invitedTimelines.push({
        timelineId,
        invitedBy: req.user._id,
        status: 'pending'
      });

      await invitedUser.save();

      sendPushNotification(
        [invitedUser._id],
        {
          title: 'New Timeline Invitation',
          body: `${req.user.name} has invited you to collaborate on ${timeline.title}`
        },
        { type: 'invitation', timelineId: timelineId.toString() }
      ).catch(err => console.error('Error sending invitation notification:', err));

      // Notify the invited user's dashboard in real time
      io.to(`user-${invitedUser._id}`).emit('invitation:received', {
        timelineId: timelineId.toString(),
        title: timeline.title
      });

      // Email with a deep link straight to the project
      sendProjectInvitationEmail(
        invitedUser.email, req.user, timeline,
        buildInviteUrl(timelineId, req.userId, invitedUser.email)
      ).catch(err => console.error('Error sending project invitation email:', err));

      logActivity(req.userId, req.user.name, 'collaborator.invite', { timelineId, invitedEmail: invitedUser.email, timelineTitle: timeline.title }, req);

      res.json({
        message: 'Invitation sent successfully',
        invitation: {
          email: invitedUser.email,
          timelineId,
          status: 'pending'
        }
      });

    } catch (error) {
      console.error('Invitation error:', error);
      res.status(500).json({ message: 'Failed to send invitation' });
    }
  }
);

// Accept invitation
router.post('/accept-invitation/:timelineId',
  authenticate,
  async (req, res) => {
    try {
      const { timelineId } = req.params;
      const userId = req.user._id;

      // Find user and update invitation status
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const invitation = user.invitedTimelines.find(
        invite => invite.timelineId.toString() === timelineId.toString()
      );

      if (!invitation) {
        return res.status(404).json({ message: 'Invitation not found' });
      }

      invitation.status = 'accepted';
      await user.save();

      // Add user to timeline's collaborators if not already added
      const timeline = await Timeline.findById(timelineId);
      if (!timeline) {
        return res.status(404).json({ message: 'Timeline not found' });
      }

      const alreadyCollaborator = timeline.collaborators.some(
        collab => collab.user.toString() === userId.toString()
      );

      if (!alreadyCollaborator) {
        timeline.collaborators.push({
          user: userId,
          role: 'editor', // Invited users can edit everything
          addedAt: new Date()
        });
        await timeline.save();
      }

      // Push real-time update so the user's dashboard shows the timeline immediately
      io.to(`user-${userId}`).emit('timeline:invited', {
        timelineId: timelineId.toString(),
        title: timeline.title
      });

      logActivity(userId, user.name, 'collaborator.accept', { timelineId, timelineTitle: timeline.title }, req);

      res.json({
        message: 'Invitation accepted successfully',
        timelineId,
        status: 'accepted'
      });

    } catch (error) {
      console.error('Accept invitation error:', error);
      res.status(500).json({ message: 'Failed to accept invitation' });
    }
  }
);

// Decline invitation
router.post('/decline-invitation/:timelineId',
  authenticate,
  async (req, res) => {
    try {
      const { timelineId } = req.params;
      const userId = req.user._id;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const invitation = user.invitedTimelines.find(
        invite => invite.timelineId.toString() === timelineId.toString()
      );

      if (!invitation) {
        return res.status(404).json({ message: 'Invitation not found' });
      }

      invitation.status = 'declined';
      await user.save();

      res.json({
        message: 'Invitation declined',
        timelineId,
        status: 'declined'
      });

    } catch (error) {
      console.error('Decline invitation error:', error);
      res.status(500).json({ message: 'Failed to decline invitation' });
    }
  }
);

// Get pending invitations for a timeline (owner only)
router.get('/timeline/:timelineId/pending',
  authenticate,
  requirePhotographer,
  requireTimelineOwner,
  async (req, res) => {
    try {
      const { timelineId } = req.params;

      // Find all users with pending invitations to this timeline
      const usersWithInvitations = await User.find({
        'invitedTimelines.timelineId': timelineId,
        'invitedTimelines.status': 'pending'
      }).select('name email invitedTimelines');

      const pendingInvitations = usersWithInvitations.map(user => {
        const invitation = user.invitedTimelines.find(
          inv => inv.timelineId.toString() === timelineId && inv.status === 'pending'
        );
        return {
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          invitedAt: invitation.invitedAt,
          status: invitation.status
        };
      });

      res.json({ invitations: pendingInvitations });
    } catch (error) {
      console.error('Get timeline invitations error:', error);
      res.status(500).json({ message: 'Failed to get invitations' });
    }
  }
);

// Revoke invitation (owner only)
router.delete('/timeline/:timelineId/revoke/:userId',
  authenticate,
  requirePhotographer,
  requireTimelineOwner,
  async (req, res) => {
    try {
      const { timelineId, userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Remove the invitation from the user's invitedTimelines
      user.invitedTimelines = user.invitedTimelines.filter(
        inv => inv.timelineId.toString() !== timelineId.toString()
      );

      await user.save();

      res.json({ message: 'Invitation revoked successfully' });
    } catch (error) {
      console.error('Revoke invitation error:', error);
      res.status(500).json({ message: 'Failed to revoke invitation' });
    }
  }
);

// Get user's invitations
router.get('/my-invitations',
  authenticate,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id)
        .populate({
          path: 'invitedTimelines.timelineId',
          select: 'title weddingDate location owner',
          populate: {
            path: 'owner',
            select: 'name email'
          }
        })
        .populate('invitedTimelines.invitedBy', 'name email');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const invitations = user.invitedTimelines.map(invite => ({
        timelineId: invite.timelineId._id,
        timelineTitle: invite.timelineId.title,
        weddingDate: invite.timelineId.weddingDate,
        location: invite.timelineId.location,
        owner: invite.timelineId.owner,
        invitedBy: invite.invitedBy,
        status: invite.status,
        invitedAt: invite.invitedAt
      }));

      res.json({ invitations });

    } catch (error) {
      console.error('Get invitations error:', error);
      res.status(500).json({ message: 'Failed to get invitations' });
    }
  }
);

export default router;
