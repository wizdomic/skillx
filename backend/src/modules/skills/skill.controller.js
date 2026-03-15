// src/modules/skills/skill.controller.js
const skillService = require('./skill.service');
const { success } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const listSkills = asyncHandler(async (req, res) => {
  const { skills, meta } = await skillService.listSkills(req.query);
  success(res, { data: { skills }, meta });
});

const getSkill = asyncHandler(async (req, res) => {
  const data = await skillService.getSkillById(req.params.skillId);
  success(res, { data });
});

const createSkill = asyncHandler(async (req, res) => {
  const data = await skillService.createSkill(req.body, req.user._id);
  success(res, { statusCode: 201, message: 'Skill created.', data });
});

const updateSkill = asyncHandler(async (req, res) => {
  const data = await skillService.updateSkill(req.params.skillId, req.body);
  success(res, { message: 'Skill updated.', data });
});

const deleteSkill = asyncHandler(async (req, res) => {
  const data = await skillService.deleteSkill(req.params.skillId);
  success(res, { message: data.message });
});

const getCategories = asyncHandler(async (req, res) => {
  const data = skillService.getCategories();
  success(res, { data: { categories: data } });
});

module.exports = { listSkills, getSkill, createSkill, updateSkill, deleteSkill, getCategories };
