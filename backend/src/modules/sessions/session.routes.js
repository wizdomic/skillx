// src/modules/sessions/session.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('./session.controller');
const authenticate = require('../../middleware/authenticate');
const { body } = require('express-validator');

const validate = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }
  next();
};

/**
 * @route  POST /api/sessions
 * @desc   Learner creates a session request
 * @body   { teacherId, skillId, scheduledAt, durationMins?, notes? }
 */
router.post(
  '/',
  authenticate,
  [
    body('teacherId').notEmpty().withMessage('teacherId is required'),
    body('skillId').notEmpty().withMessage('skillId is required'),
    body('scheduledAt').isISO8601().withMessage('scheduledAt must be a valid ISO date'),
    body('durationMins').optional().isInt({ min: 15, max: 240 }),
    validate,
  ],
  ctrl.createSession
);

/**
 * @route  GET /api/sessions
 * @desc   Get all sessions for current user
 * @query  status?, role? ('teacher'|'learner'), page?, limit?
 */
router.get('/', authenticate, ctrl.getSessions);

/**
 * @route  GET /api/sessions/:sessionId
 * @desc   Get a specific session (must be a participant)
 */
router.get('/:sessionId', authenticate, ctrl.getSession);

/**
 * @route  PUT /api/sessions/:sessionId/accept
 * @desc   Teacher accepts a pending session
 */
router.put('/:sessionId/accept', authenticate, ctrl.acceptSession);

/**
 * @route  PUT /api/sessions/:sessionId/cancel
 * @desc   Either participant cancels (with optional reason)
 * @body   { reason? }
 */
router.put('/:sessionId/cancel', authenticate, ctrl.cancelSession);

/**
 * @route  PUT /api/sessions/:sessionId/confirm
 * @desc   Participant confirms session happened; credits transfer when both confirm
 */
router.put('/:sessionId/confirm', authenticate, ctrl.confirmSession);

module.exports = router;
