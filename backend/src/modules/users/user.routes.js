// src/modules/users/user.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('./user.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
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
 * @route  GET /api/users/me
 * @desc   Get current user's full profile (with skills)
 */
router.get('/me', authenticate, ctrl.getMe);

/**
 * @route  PATCH /api/users/me
 * @desc   Update current user's profile
 * @body   { name?, bio?, location?, timezone?, avatarUrl? }
 */
router.patch(
  '/me',
  authenticate,
  [
    body('name').optional().trim().isLength({ max: 100 }),
    body('bio').optional().isLength({ max: 500 }),
    body('location').optional().isString(),
    validate,
  ],
  ctrl.updateProfile
);

/**
 * @route  POST /api/users/me/onboarding
 * @desc   Complete onboarding — set initial teach & learn skills
 * @body   { teachSkills: [{ skillId, level?, description? }], learnSkills: [{ skillId }] }
 */
router.post('/me/onboarding', authenticate, ctrl.completeOnboarding);

/**
 * @route  POST /api/users/me/skills
 * @desc   Add a skill to current user's profile
 * @body   { skillId, type: 'teach'|'learn', level?, description? }
 */
router.post(
  '/me/skills',
  authenticate,
  [
    body('skillId').notEmpty(),
    body('type').isIn(['teach', 'learn']),
    body('level').optional().isIn(['beginner', 'intermediate', 'advanced']),
    validate,
  ],
  ctrl.addSkill
);

/**
 * @route  DELETE /api/users/me/skills/:userSkillId
 * @desc   Remove a skill from current user's profile
 */
router.delete('/me/skills/:userSkillId', authenticate, ctrl.removeSkill);

/**
 * @route  GET /api/users/:userId
 * @desc   Get any user's public profile
 */
router.get('/:userId', authenticate, ctrl.getUser);

/**
 * @route  GET /api/users
 * @desc   List all users (admin only)
 * @query  page, limit, search
 */
router.get('/', authenticate, authorize('admin'), ctrl.listUsers);

module.exports = router;
