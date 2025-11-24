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

const shotSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['preparation', 'details', 'ceremony', 'first_look', 'family', 'couple', 'cocktail', 'reception', 'venue', 'other'],
    default: 'other'
  },
  description: String,
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: Date,
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
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: Date,
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
  // Overview/General Information fields
  startTime: String,
  endTime: String,
  contacts: {
    partner1Phone: String,
    partner2Phone: String,
    plannerContact: String
  },
  locations: {
    ceremony: String,
    reception: String
  },
  guestAttire: String,
  generalNotes: String,
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
  shotList: [shotSchema],
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
