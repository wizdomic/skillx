// src/modules/skills/skill.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('./skill.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

/** GET /api/skills?search=&category=&page=&limit= */
router.get('/', authenticate, ctrl.listSkills);

/** GET /api/skills/categories */
router.get('/categories', authenticate, ctrl.getCategories);

/** GET /api/skills/:skillId */
router.get('/:skillId', authenticate, ctrl.getSkill);

/** POST /api/skills  — admin creates; users suggest (isApproved=false) */
router.post('/', authenticate, ctrl.createSkill);

/** PATCH /api/skills/:skillId  — admin only */
router.patch('/:skillId', authenticate, authorize('admin'), ctrl.updateSkill);

/** DELETE /api/skills/:skillId  — admin only */
router.delete('/:skillId', authenticate, authorize('admin'), ctrl.deleteSkill);

module.exports = router;
