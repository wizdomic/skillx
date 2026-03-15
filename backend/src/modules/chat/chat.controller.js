// src/modules/chat/chat.controller.js
const chatService  = require('./chat.service')
const { success }  = require('../../utils/apiResponse')
const asyncHandler = require('../../utils/asyncHandler')

const sendMessage = asyncHandler(async (req, res) => {
  const data = await chatService.sendMessage(req.user._id, req.body)
  success(res, { statusCode: 201, message: 'Message sent.', data })
})

const deleteMessage = asyncHandler(async (req, res) => {
  const result = await chatService.deleteMessage(req.user._id, req.params.messageId)
  success(res, { message: 'Message deleted.', data: result })
})

const deleteConversation = asyncHandler(async (req, res) => {
  await chatService.deleteConversation(req.user._id, req.params.userId)
  success(res, { message: 'Conversation deleted.' })
})

const getConversation = asyncHandler(async (req, res) => {
  const { messages, meta } = await chatService.getConversation(
    req.user._id, req.params.userId, req.query
  )
  success(res, { data: { messages }, meta })
})

const getConversationList = asyncHandler(async (req, res) => {
  const data = await chatService.getConversationList(req.user._id)
  success(res, { data: { conversations: data } })
})

const getUnreadCount = asyncHandler(async (req, res) => {
  const data = await chatService.getUnreadCount(req.user._id)
  success(res, { data })
})

module.exports = {
  sendMessage, deleteMessage, deleteConversation,
  getConversation, getConversationList, getUnreadCount,
}

// ── Routes ────────────────────────────────────────────────────────────────────
const express  = require('express')
const router   = express.Router()
const authenticate = require('../../middleware/authenticate')
const { body } = require('express-validator')

const validate = (req, res, next) => {
  const { validationResult } = require('express-validator')
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() })
  next()
}

router.get('/conversations',           authenticate, module.exports.getConversationList)
router.get('/unread',                  authenticate, module.exports.getUnreadCount)
router.get('/:userId',                 authenticate, module.exports.getConversation)
router.post('/', authenticate, [
  body('receiverId').notEmpty(),
  body('content').notEmpty().isLength({ max: 2000 }),
  validate,
], module.exports.sendMessage)
router.delete('/message/:messageId',   authenticate, module.exports.deleteMessage)
router.delete('/conversation/:userId', authenticate, module.exports.deleteConversation)

module.exports.router = router