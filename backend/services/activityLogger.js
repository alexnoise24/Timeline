import ActivityLog from '../models/ActivityLog.js';

/**
 * Fire-and-forget activity logger.
 * Never throws — a logging failure never blocks the user's response.
 *
 * @param {string|ObjectId} userId
 * @param {string}          userName
 * @param {string}          eventType  e.g. 'user.register', 'wedding.create'
 * @param {object}          details    arbitrary metadata object
 * @param {object|null}     req        Express request (for IP + UA), or null
 */
export function logActivity(userId, userName, eventType, details = {}, req = null) {
  const ip = req
    ? (req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null)
    : null;
  const ua = req ? (req.headers['user-agent'] || null) : null;

  const entry = new ActivityLog({ userId, userName, eventType, details, ipAddress: ip, userAgent: ua });
  entry.save().catch(err => console.error(`[activityLogger] failed to save ${eventType}:`, err.message));
}
