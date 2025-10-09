import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const changeLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['created', 'updated', 'deleted', 'note_added'],
    required: true
  },
  field: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  description: String
});

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  date: {
    type: Date,
    required: true
  },
  time: String,
  location: String,
  category: {
    type: String,
    enum: ['ceremony', 'reception', 'preparation', 'photography', 'other'],
    default: 'other'
  },
  notes: [noteSchema],
  changeLogs: [changeLogSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const timelineSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  weddingDate: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    default: ''
  },
  couple: {
    partner1: String,
    partner2: String
  },
  description: String,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['editor', 'viewer'],
      default: 'editor'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  events: [eventSchema],
  changeLogs: [changeLogSchema],
  isPublic: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
timelineSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Timeline = mongoose.model('Timeline', timelineSchema);

export default Timeline;
