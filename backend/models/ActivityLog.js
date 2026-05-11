import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  userName:  { type: String },
  eventType: { type: String, index: true },
  details:   { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now, index: true }
});

// Auto-delete logs older than 180 days
activityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

export default mongoose.model('ActivityLog', activityLogSchema);
