// src/models/SkillRequest.js
// Public bulletin board where users post what they offer or want.

const mongoose = require('mongoose');

const skillRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    // 'offer' = I can teach this | 'wanted' = I want to learn this
    type: {
      type: String,
      enum: ['offer', 'wanted'],
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['open', 'fulfilled', 'closed'],
      default: 'open',
    },
    // How many times the post was responded to
    responseCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

skillRequestSchema.index({ skillId: 1, type: 1, status: 1 });
skillRequestSchema.index({ userId: 1 });
skillRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SkillRequest', skillRequestSchema);
