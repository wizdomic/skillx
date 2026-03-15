// src/modules/chat/chat.service.js
const Message  = require('../../models/Message')
const User     = require('../../models/User')
const { AppError }  = require('../../middleware/errorHandler')
const { parsePagination, buildMeta } = require('../../utils/paginate')
const mongoose = require('mongoose')

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id) && /^[a-f\d]{24}$/i.test(String(id))

// ── Send ──────────────────────────────────────────────────────────────────────
const sendMessage = async (senderId, { receiverId, content }) => {
  const receiver = await User.findById(receiverId)
  if (!receiver || !receiver.isActive) throw new AppError('Recipient not found.', 404)
  if (senderId.toString() === receiverId.toString())
    throw new AppError('You cannot message yourself.', 400)
  return Message.create({ senderId, receiverId, content })
}

// ── Delete single message ─────────────────────────────────────────────────────
const deleteMessage = async (userId, messageId) => {
  // Guard against temp IDs like "tmp_1234567"
  if (!isValidObjectId(messageId))
    throw new AppError('Invalid message ID.', 400)

  const message = await Message.findById(messageId)
  if (!message) throw new AppError('Message not found.', 404)

  const isSender   = message.senderId.toString() === userId.toString()
  const isReceiver = message.receiverId.toString() === userId.toString()
  if (!isSender && !isReceiver)
    throw new AppError('You cannot delete this message.', 403)

  const update = { $addToSet: { deletedFor: userId } }
  if (isSender) update.$set = { deletedBySender: true, content: '' }

  await Message.findByIdAndUpdate(messageId, update, { runValidators: false })

  // Hard delete if both sides deleted
  const updated = await Message.findById(messageId)
  if (!updated) return { deleted: true, hardDeleted: true }

  const bothDeleted =
    updated.deletedBySender &&
    updated.deletedFor.some(id => id.toString() === updated.receiverId.toString())

  if (bothDeleted) {
    await updated.deleteOne()
    return { deleted: true, hardDeleted: true }
  }

  return { deleted: true, hardDeleted: false }
}

// ── Delete entire conversation ────────────────────────────────────────────────
const deleteConversation = async (userId, otherId) => {
  const uid = new mongoose.Types.ObjectId(userId)
  await Message.updateMany(
    {
      $or: [
        { senderId: userId, receiverId: otherId },
        { senderId: otherId, receiverId: userId },
      ],
      deletedFor: { $ne: uid },
    },
    { $addToSet: { deletedFor: uid } },
    { runValidators: false }
  )
  return { deleted: true }
}

// ── Get conversation ──────────────────────────────────────────────────────────
const getConversation = async (userId, otherId, query) => {
  const { page, limit, skip } = parsePagination(query)
  const uid = new mongoose.Types.ObjectId(userId)
  const filter = {
    $or: [
      { senderId: userId, receiverId: otherId },
      { senderId: otherId, receiverId: userId },
    ],
    deletedFor: { $ne: uid },
  }
  const [messages, total] = await Promise.all([
    Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Message.countDocuments(filter),
  ])
  await Message.updateMany(
    { senderId: otherId, receiverId: userId, isRead: false },
    { isRead: true }
  )
  return { messages: messages.reverse(), meta: buildMeta({ page, limit, total }) }
}

// ── Conversation list ─────────────────────────────────────────────────────────
const getConversationList = async (userId) => {
  const uid = new mongoose.Types.ObjectId(userId)
  const messages = await Message.aggregate([
    {
      $match: {
        $or: [{ senderId: uid }, { receiverId: uid }],
        deletedFor: { $ne: uid },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { $cond: [{ $eq: ['$senderId', uid] }, '$receiverId', '$senderId'] },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$receiverId', uid] }, { $eq: ['$isRead', false] }] },
              1, 0,
            ],
          },
        },
      },
    },
    { $sort: { 'lastMessage.createdAt': -1 } },
  ])
  const populated = await Promise.all(
    messages.map(async m => {
      const partner = await User.findById(m._id).select('name avatarUrl')
      return { partner, lastMessage: m.lastMessage, unreadCount: m.unreadCount }
    })
  )
  return populated.filter(m => m.partner)
}

// ── Unread count ──────────────────────────────────────────────────────────────
const getUnreadCount = async (userId) => {
  const uid   = new mongoose.Types.ObjectId(userId)
  const count = await Message.countDocuments({
    receiverId: userId,
    isRead: false,
    deletedFor: { $ne: uid },
  })
  return { unreadCount: count }
}

module.exports = {
  sendMessage, deleteMessage, deleteConversation,
  getConversation, getConversationList, getUnreadCount,
}