import mongoose from 'mongoose';

const communityMessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['feedback', 'bug', 'feature', 'general'],
    default: 'general'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
communityMessageSchema.index({ createdAt: -1 });

export default mongoose.model('CommunityMessage', communityMessageSchema);
