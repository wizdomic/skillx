// src/models/UserSkill.js
// Links users to skills they teach or want to learn.

const mongoose = require('mongoose');

const userSkillSchema = new mongoose.Schema(
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
    // 'teach' = this user can teach this skill
    // 'learn' = this user wants to learn this skill
    type: {
      type: String,
      enum: ['teach', 'learn'],
      required: true,
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: null,
    },
    // Short description, e.g. "I've used Python for 5 years in data science"
    description: {
      type: String,
      maxlength: [300, 'Description cannot exceed 300 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

// A user can only have one teach or one learn entry per skill
userSkillSchema.index({ userId: 1, skillId: 1, type: 1 }, { unique: true });
userSkillSchema.index({ skillId: 1, type: 1 });
userSkillSchema.index({ userId: 1 });

module.exports = mongoose.model('UserSkill', userSkillSchema);
