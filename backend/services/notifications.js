import admin, { getFirebaseApp } from './firebase.js';
import User from '../models/User.js';

/**
 * Send push notification to specific users
 * @param {Array<string>} userIds - Array of user IDs to send notification to
 * @param {Object} notification - Notification payload
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {Object} data - Additional data to send with notification
 */
export const sendPushNotification = async (userIds, notification, data = {}) => {
  try {
    if (!userIds || userIds.length === 0) {
      console.log('⚠️ No user IDs provided for notification');
      return;
    }

    // Get all FCM tokens for the specified users
    const users = await User.find({ _id: { $in: userIds } });
    const allTokens = [];

    users.forEach(user => {
      if (user.fcmTokens && user.fcmTokens.length > 0) {
        user.fcmTokens.forEach(tokenObj => {
          allTokens.push(tokenObj.token);
        });
      }
    });

    if (allTokens.length === 0) {
      console.log('⚠️ No FCM tokens found for users:', userIds);
      return;
    }

    console.log(`📤 Sending notification to ${allTokens.length} devices`);

    // Get Firebase app instance
    const firebaseApp = getFirebaseApp();

    // Prepare the message
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...data,
        clickAction: data.url || '/dashboard',
      },
      tokens: allTokens,
    };

    // Send to all tokens
    const response = await admin.messaging(firebaseApp).sendEachForMulticast(message);

    console.log(`✅ Notification sent successfully: ${response.successCount} succeeded, ${response.failureCount} failed`);

    // Remove invalid tokens — solo errores que indican token muerto.
    // Errores de configuración (p.ej. credenciales APNs) NO deben borrar tokens.
    const DEAD_TOKEN_ERRORS = [
      'messaging/registration-token-not-registered',
      'messaging/invalid-registration-token',
      'messaging/invalid-argument',
    ];
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const code = resp.error?.code || 'unknown';
          console.error(`❌ FCM send failed [${code}]: ${resp.error?.message || ''} (token ${allTokens[idx].slice(0, 12)}...)`);
          if (DEAD_TOKEN_ERRORS.includes(code)) {
            invalidTokens.push(allTokens[idx]);
          }
        }
      });

      // Remove invalid tokens from database
      if (invalidTokens.length > 0) {
        await User.updateMany(
          { _id: { $in: userIds } },
          { $pull: { fcmTokens: { token: { $in: invalidTokens } } } }
        );
        console.log(`🗑️ Removed ${invalidTokens.length} invalid tokens`);
      }
    }

    return response;
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    throw error;
  }
};

/**
 * Broadcast a Community Chat notification to every user except the sender.
 * Used when the master posts in Community — regular users' messages already
 * reach the team via Telegram, so only master posts trigger this.
 * @param {string} senderId - User ID of the sender (to exclude)
 * @param {Object} notification - Notification payload (title, body)
 * @param {Object} data - Additional data (e.g. { url: '/community' })
 */
export const notifyCommunityBroadcast = async (senderId, notification, data = {}) => {
  try {
    // Everyone except the sender and invited guests (guests don't see Community)
    const recipients = await User.find({
      _id: { $ne: senderId },
      role: { $ne: 'guest' },
    }).select('_id');

    const recipientIds = recipients.map(u => u._id.toString());

    if (recipientIds.length === 0) {
      console.log('⚠️ No community recipients to notify');
      return;
    }

    return await sendPushNotification(recipientIds, notification, data);
  } catch (error) {
    console.error('❌ Error broadcasting community notification:', error);
    throw error;
  }
};

/**
 * Send notification to all timeline members except the sender
 * @param {string} timelineId - Timeline ID
 * @param {string} senderId - User ID of the sender (to exclude)
 * @param {Object} notification - Notification payload
 * @param {Object} data - Additional data
 */
export const notifyTimelineMembers = async (timelineId, senderId, notification, data = {}) => {
  try {
    // Get timeline to find all members
    const Timeline = (await import('../models/Timeline.js')).default;
    const timeline = await Timeline.findById(timelineId);

    if (!timeline) {
      console.log('⚠️ Timeline not found:', timelineId);
      return;
    }

    // Get all member IDs except the sender
    // Extract user IDs from collaborators array
    const collaboratorIds = (timeline.collaborators || []).map(c => c.user);
    const memberIds = [timeline.owner, ...collaboratorIds]
      .filter(id => id && id.toString() !== senderId.toString())
      .map(id => id.toString());

    if (memberIds.length === 0) {
      console.log('⚠️ No members to notify');
      return;
    }

    // Send notification
    return await sendPushNotification(memberIds, notification, {
      ...data,
      timelineId: timelineId.toString(),
    });
  } catch (error) {
    console.error('❌ Error notifying timeline members:', error);
    throw error;
  }
};
