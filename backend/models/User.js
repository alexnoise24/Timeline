import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['master', 'creator', 'photographer', 'guest'],
    default: 'guest',
    required: true
  },
  // Trial and Plan fields
  trial_start_date: {
    type: Date,
    default: null
  },
  trial_end_date: {
    type: Date,
    default: null
  },
  is_trial_active: {
    type: Boolean,
    default: false
  },
  current_plan: {
    type: String,
    enum: ['none', 'trial', 'free', 'starter', 'pro', 'studio', 'master'],
    default: 'none'
  },
  is_payment_required: {
    type: Boolean,
    default: false
  },
  plan_start_date: {
    type: Date,
    default: null
  },
  plan_expiration_date: {
    type: Date,
    default: null
  },
  invitedTimelines: [{
    timelineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Timeline'
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    }
  }],
  avatar: {
    type: String,
    default: null
  },
  fcmTokens: [{
    token: {
      type: String,
      required: true
    },
    device: {
      type: String,
      default: 'web'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastUsed: {
      type: Date,
      default: Date.now
    }
  }],
  pushSubscriptions: [{
    endpoint: String,
    expirationTime: Date,
    keys: {
      p256dh: String,
      auth: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Don't return password in JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
