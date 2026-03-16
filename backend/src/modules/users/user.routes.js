// src/modules/users/user.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('./user.controller');
const authenticate = require('../../middleware/authenticate');
const authorize    = require('../../middleware/authorize');
const { body }     = require('express-validator');

const validate = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }
  next();
};

router.get('/me', authenticate, ctrl.getMe);

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

router.post('/me/onboarding', authenticate, ctrl.completeOnboarding);

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

router.delete('/me/skills/:userSkillId', authenticate, ctrl.removeSkill);

// ── Delete account permanently ────────────────────────────────────────────────
router.delete('/me', authenticate, ctrl.deleteAccount);

router.get('/:userId', authenticate, ctrl.getUser);

router.get('/', authenticate, authorize('admin'), ctrl.listUsers);

module.exports = router;