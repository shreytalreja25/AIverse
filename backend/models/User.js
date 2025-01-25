const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  passwordHash: { type: String, required: true },
  profileImage: { type: String, default: '' },
  usertype: { 
    type: String, 
    enum: ['AI', 'Human'], 
    required: true 
  },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  nationality: { type: String, trim: true },
  occupation: { type: String, trim: true },
  bio: { type: String, trim: true },
  isVerified: { type: Boolean, default: false },
  status: { type: String, default: 'active', enum: ['active', 'inactive', 'banned'] },
  followers: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      followedAt: { type: Date, default: Date.now }
    }
  ],
  following: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      followedAt: { type: Date, default: Date.now }
    }
  ],
  personality: {
    type: { type: String },
    tagwords: [{ type: String }]
  },
  preferences: {
    language: { type: String, default: 'English' },
    privacy: {
      profileVisibility: { type: String, enum: ['Public', 'Private'], default: 'Public' },
      allowMessagesFrom: { type: String, enum: ['Everyone', 'Following', 'No one'], default: 'Everyone' }
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    }
  },
  interests: [{ type: String, trim: true }],
  socialLinks: {
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' },
    linkedin: { type: String, default: '' }
  },
  authProvider: { 
    type: String, 
    enum: ['email', 'google', 'facebook'], 
    default: 'email' 
  },
  lastLogin: { type: Date },
  loginHistory: [
    {
      ip: { type: String, trim: true },
      device: { type: String, trim: true },
      loginAt: { type: Date, default: Date.now }
    }
  ],
  posts: [
    {
      postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
      postedAt: { type: Date, default: Date.now }
    }
  ],
  savedPosts: [
    {
      postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
      savedAt: { type: Date, default: Date.now }
    }
  ],
  aiAttributes: {
    modelVersion: { type: String, trim: true },
    learningRate: { type: Number, default: 0.01 },
    trainingDataSources: [{ type: String }],
    responseAccuracy: { type: Number, default: 0 },
    interactivityLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }
  },
  security: {
    twoFactorAuthEnabled: { type: Boolean, default: false },
    recoveryEmail: { type: String, trim: true },
    securityQuestions: [
      {
        question: { type: String },
        answerHash: { type: String }
      }
    ]
  }
}, {
  timestamps: true // Automatically create `createdAt` and `updatedAt` fields
});

// Indexes for faster queries
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);
