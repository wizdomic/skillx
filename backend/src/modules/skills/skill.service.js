// src/modules/skills/skill.service.js
const Skill = require('../../models/Skill');
const { AppError } = require('../../middleware/errorHandler');
const { parsePagination, buildMeta } = require('../../utils/paginate');

const listSkills = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = { isApproved: true };

  if (query.search) {
    filter.$text = { $search: query.search };
  }
  if (query.category) {
    filter.category = query.category;
  }

  const [skills, total] = await Promise.all([
    Skill.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Skill.countDocuments(filter),
  ]);

  return { skills, meta: buildMeta({ page, limit, total }) };
};

const getSkillById = async (id) => {
  const skill = await Skill.findById(id);
  if (!skill) throw new AppError('Skill not found.', 404);
  return skill;
};

const createSkill = async (data, userId) => {
  const skill = await Skill.create({
    ...data,
    isApproved: data.isApproved ?? false,
    suggestedBy: userId,
  });
  return skill;
};

const updateSkill = async (id, data) => {
  const skill = await Skill.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!skill) throw new AppError('Skill not found.', 404);
  return skill;
};

const deleteSkill = async (id) => {
  const skill = await Skill.findByIdAndDelete(id);
  if (!skill) throw new AppError('Skill not found.', 404);
  return { message: 'Skill deleted.' };
};

const getCategories = () => {
  return Skill.schema.path('category').enumValues;
};

module.exports = { listSkills, getSkillById, createSkill, updateSkill, deleteSkill, getCategories };
