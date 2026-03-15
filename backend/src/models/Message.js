// src/models/Message.js
const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: {
      type: String,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
      trim: true,
      required: function () { return !this.deletedBySender },
    },
    isRead:          { type: Boolean, default: false },
    deletedBySender: { type: Boolean, default: false },
    deletedFor:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
)

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 })
messageSchema.index({ receiverId: 1, isRead: 1 })

module.exports = mongoose.model('Message', messageSchema)