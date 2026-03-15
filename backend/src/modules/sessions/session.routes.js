// src/modules/sessions/session.routes.js
const express = require('express')
const router  = express.Router()
const ctrl    = require('./session.controller')
const authenticate = require('../../middleware/authenticate')
const { body } = require('express-validator')

const validate = (req, res, next) => {
  const { validationResult } = require('express-validator')
  const errors = validationResult(req)
  if (!errors.isEmpty())
    return res.status(422).json({ success: false, message: 'Validation failed', errors: errors.array() })
  next()
}

// POST   /api/sessions
router.post('/', authenticate, [
  body('teacherId').notEmpty(),
  body('skillId').notEmpty(),
  body('scheduledAt').isISO8601(),
  body('durationMins').optional().isInt({ min: 15, max: 240 }),
  validate,
], ctrl.createSession)

// GET    /api/sessions
router.get('/', authenticate, ctrl.getSessions)

// GET    /api/sessions/:sessionId
router.get('/:sessionId', authenticate, ctrl.getSession)

// PUT    /api/sessions/:sessionId/accept
router.put('/:sessionId/accept', authenticate, ctrl.acceptSession)

// PATCH  /api/sessions/:sessionId/meeting-link
router.patch('/:sessionId/meeting-link', authenticate, [
  body('platform').isIn(['jitsi', 'zoom', 'gmeet', 'teams', 'custom'])
    .withMessage('platform must be: jitsi, zoom, gmeet, teams, or custom'),
  body('customLink').optional().isString(),
  validate,
], ctrl.setMeetingLink)

// PUT    /api/sessions/:sessionId/cancel
router.put('/:sessionId/cancel', authenticate, ctrl.cancelSession)

// PUT    /api/sessions/:sessionId/confirm
router.put('/:sessionId/confirm', authenticate, ctrl.confirmSession)

// DELETE /api/sessions/:sessionId
// Only cancelled or completed sessions can be deleted (removes from your history)
router.delete('/:sessionId', authenticate, ctrl.deleteSession)

module.exports = router