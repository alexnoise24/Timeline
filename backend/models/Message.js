import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  timelineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timeline',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
});

// Index for efficient queries
messageSchema.index({ timelineId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
