import mongoose from 'mongoose';

// Registro de correos transaccionales enviados (invitaciones a proyecto).
// status: 'sent' = aceptado por el servidor SMTP; 'failed' = error al enviar.
// La apertura se registra vía pixel de tracking (GET /api/email-track/:trackingId).
const emailLogSchema = new mongoose.Schema({
  trackingId:    { type: String, unique: true, index: true },
  to:            { type: String, index: true },
  emailType:     { type: String, default: 'invitation' },
  lang:          { type: String },
  timelineId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Timeline' },
  timelineTitle: { type: String },
  sentBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sentByName:    { type: String },
  status:        { type: String, enum: ['sent', 'failed'], default: 'sent' },
  error:         { type: String },
  openedAt:      { type: Date },
  openCount:     { type: Number, default: 0 },
  lastOpenedAt:  { type: Date },
  sentAt:        { type: Date, default: Date.now, index: true }
});

// Auto-borrado tras 180 días (mismo criterio que ActivityLog)
emailLogSchema.index({ sentAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

export default mongoose.model('EmailLog', emailLogSchema);
