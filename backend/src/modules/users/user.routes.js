// src/modules/users/user.routes.js
const express      = require('express')
const router       = express.Router()
const ctrl         = require('./user.controller')
const authenticate = require('../../middleware/authenticate')
const authorize    = require('../../middleware/authorize')
const { body }     = require('express-validator')

const validate = (req, res, next) => {
  const { validationResult } = require('express-validator')
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(422).json({ success: false, message: 'Validation failed', errors: errors.array() })
  next()
}

// Search users by name or @username — must come before /:userId
router.get('/search', authenticate, ctrl.searchUsers)

router.get('/me',    authenticate, ctrl.getMe)
router.patch('/me',  authenticate, [
  body('name').optional().trim().isLength({ max: 100 }),
  body('bio').optional().isLength({ max: 500 }),
  body('location').optional().isString(),
  body('username').optional().trim().isLength({ min: 3, max: 30 })
    .matches(/^[a-z0-9_]+$/i).withMessage('Username can only contain letters, numbers and underscores'),
  validate,
], ctrl.updateProfile)

router.post('/me/onboarding', authenticate, ctrl.completeOnboarding)

router.post('/me/skills', authenticate, [
  body('skillId').notEmpty(),
  body('type').isIn(['teach', 'learn']),
  body('level').optional().isIn(['beginner', 'intermediate', 'advanced']),
  validate,
], ctrl.addSkill)

router.delete('/me/skills/:userSkillId', authenticate, ctrl.removeSkill)
router.delete('/me',                     authenticate, ctrl.deleteAccount)

router.get('/:userId', authenticate, ctrl.getUser)
router.get('/',        authenticate, authorize('admin'), ctrl.listUsers)

module.exports = router