// src/models/Skill.js
const mongoose = require('mongoose')

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
      maxlength: [100, 'Skill name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Programming', 'Design', 'Language', 'Music',
        'Business', 'Science', 'Arts & Crafts', 'Sports & Fitness',
        'Cooking', 'Finance', 'Marketing', 'Other',
      ],
    },
    iconUrl:     { type: String, default: '' },
    isApproved:  { type: Boolean, default: true },
    suggestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

skillSchema.pre('validate', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\+/g, '-plus')   // C++ → c-plus-plus
      .replace(/#/g, '-sharp')   // C# → c-sharp
      .replace(/\./g, '-')       // Node.js → node-js
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }
  next()
})

skillSchema.index({ name: 1 }, { unique: true })
skillSchema.index({ slug: 1 }, { unique: true })
skillSchema.index({ name: 'text' })
skillSchema.index({ category: 1 })

module.exports = mongoose.model('Skill', skillSchema)