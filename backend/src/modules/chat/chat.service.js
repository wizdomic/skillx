// src/modules/chat/chat.service.js
const Message = require('../../models/Message');
const User = require('../../models/User');
const { AppError } = require('../../middleware/errorHandler');
const { parsePagination, buildMeta } = require('../../utils/paginate');

/**
 * Persist a message to the database.
 * The real-time delivery is handled by Socket.IO separately.
 */
const sendMessage = async (senderId, { receiverId, content }) => {
  const receiver = await User.findById(receiverId);
  if (!receiver || !receiver.isActive) throw new AppError('Recipient not found.', 404);
  if (senderId.toString() === receiverId.toString()) {
    throw new AppError('You cannot message yourself.', 400);
  }

  const message = await Message.create({ senderId, receiverId, content });
  return message;
};

/**
 * Get full conversation between two users (paginated).
 */
const getConversation = async (userId, otherId, query) => {
  const { page, limit, skip } = parsePagination(query);

  const filter = {
    $or: [
      { senderId: userId, receiverId: otherId },
      { senderId: otherId, receiverId: userId },
    ],
  };

  const [messages, total] = await Promise.all([
    Message.find(filter)
      .sort({ createdAt: -1 }) // Most recent first; frontend reverses for display
      .skip(skip)
      .limit(limit),
    Message.countDocuments(filter),
  ]);

  // Mark received messages as read
  await Message.updateMany({ senderId: otherId, receiverId: userId, isRead: false }, { isRead: true });

  return { messages: messages.reverse(), meta: buildMeta({ page, limit, total }) };
};

/**
 * Get list of unique conversation partners with latest message.
 */
const getConversationList = async (userId) => {
  const messages = await Message.aggregate([
    {
      $match: {
        $or: [
          { senderId: new (require('mongoose').Types.ObjectId)(userId) },
          { receiverId: new (require('mongoose').Types.ObjectId)(userId) },
        ],
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$senderId', new (require('mongoose').Types.ObjectId)(userId)] },
            '$receiverId',
            '$senderId',
          ],
        },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$receiverId', new (require('mongoose').Types.ObjectId)(userId)] }, { $eq: ['$isRead', false] }] },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { 'lastMessage.createdAt': -1 } },
  ]);

  // Populate partner info
  const populated = await Promise.all(
    messages.map(async (m) => {
      const partner = await User.findById(m._id).select('name avatarUrl');
      return { partner, lastMessage: m.lastMessage, unreadCount: m.unreadCount };
    })
  );

  return populated.filter((m) => m.partner); // Filter deleted users
};

/**
 * Count total unread messages for a user.
 */
const getUnreadCount = async (userId) => {
  const count = await Message.countDocuments({ receiverId: userId, isRead: false });
  return { unreadCount: count };
};

module.exports = { sendMessage, getConversation, getConversationList, getUnreadCount };
