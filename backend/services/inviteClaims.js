import Timeline from '../models/Timeline.js';
import { io } from '../server.js';
import { logActivity } from './activityLogger.js';

// Claims every pendingEmailInvite that matches the user's email: adds the user
// as editor collaborator, marks the invitation accepted on the user doc and
// removes the pending entry. Covers invitees who register (or log in) directly
// on lenzu.app without ever clicking the tokenized link from the email.
// Mirrors exactly what POST /invitations/accept-invite-token does.
export const claimPendingEmailInvites = async (user, req = null) => {
  const email = user.email.toLowerCase();
  const timelines = await Timeline.find({ 'pendingEmailInvites.email': email });
  if (!timelines.length) return [];

  const claimed = [];

  for (const timeline of timelines) {
    const entry = timeline.pendingEmailInvites.find(p => p.email === email);
    const invitedBy = entry?.invitedBy || timeline.owner;

    const alreadyCollaborator = timeline.collaborators.some(
      collab => collab.user.toString() === user._id.toString()
    );
    if (!alreadyCollaborator) {
      timeline.collaborators.push({
        user: user._id,
        role: 'editor',
        addedAt: new Date()
      });
    }

    timeline.pendingEmailInvites = timeline.pendingEmailInvites.filter(
      p => p.email !== email
    );
    await timeline.save();

    const existing = user.invitedTimelines.find(
      inv => inv.timelineId.toString() === timeline._id.toString()
    );
    if (existing) {
      existing.status = 'accepted';
    } else {
      user.invitedTimelines.push({
        timelineId: timeline._id,
        invitedBy,
        status: 'accepted'
      });
    }

    io.to(`user-${user._id}`).emit('timeline:invited', {
      timelineId: timeline._id.toString(),
      title: timeline.title
    });

    logActivity(user._id, user.name, 'collaborator.accept', {
      timelineId: timeline._id,
      timelineTitle: timeline.title,
      via: 'email-claim'
    }, req);

    claimed.push({ timelineId: timeline._id.toString(), title: timeline.title });
    console.log(`Email invite auto-claimed: ${email} -> "${timeline.title}"`);
  }

  await user.save();
  return claimed;
};
