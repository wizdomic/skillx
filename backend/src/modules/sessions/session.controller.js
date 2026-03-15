// src/modules/sessions/session.controller.js
const sessionService = require('./session.service')
const { success }    = require('../../utils/apiResponse')
const asyncHandler   = require('../../utils/asyncHandler')

const createSession = asyncHandler(async (req, res) => {
  const data = await sessionService.createSession(req.user._id, req.body)
  success(res, { statusCode: 201, message: 'Session request sent.', data })
})

const getSessions = asyncHandler(async (req, res) => {
  const { sessions, meta } = await sessionService.getUserSessions(req.user._id, req.query)
  success(res, { data: { sessions }, meta })
})

const getSession = asyncHandler(async (req, res) => {
  const data = await sessionService.getSession(req.user._id, req.params.sessionId)
  success(res, { data })
})

const acceptSession = asyncHandler(async (req, res) => {
  const data = await sessionService.acceptSession(req.user._id, req.params.sessionId)
  success(res, { message: 'Session accepted.', data })
})

const setMeetingLink = asyncHandler(async (req, res) => {
  const { platform, customLink } = req.body
  const data = await sessionService.setMeetingLink(
    req.user._id, req.params.sessionId, { platform, customLink }
  )
  success(res, { message: 'Meeting link updated.', data })
})

const cancelSession = asyncHandler(async (req, res) => {
  const data = await sessionService.cancelSession(
    req.user._id, req.params.sessionId, req.body.reason
  )
  success(res, { message: 'Session cancelled.', data })
})

const confirmSession = asyncHandler(async (req, res) => {
  const { session, creditsTransferred, message } = await sessionService.confirmSession(
    req.user._id, req.params.sessionId
  )
  success(res, { message, data: session })
})

const deleteSession = asyncHandler(async (req, res) => {
  await sessionService.deleteSession(req.user._id, req.params.sessionId)
  success(res, { message: 'Session removed from your history.' })
})

module.exports = {
  createSession, getSessions, getSession,
  acceptSession, setMeetingLink,
  cancelSession, confirmSession, deleteSession,
}