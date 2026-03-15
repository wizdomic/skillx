// src/modules/users/user.service.js
const User      = require('../../models/User')
const UserSkill = require('../../models/UserSkill')
const Skill     = require('../../models/Skill')
const { AppError } = require('../../middleware/errorHandler')
const { parsePagination, buildMeta } = require('../../utils/paginate')

// ── Build a safe skill entry from a UserSkill lean doc + skill lookup map ──────
const buildSkillEntry = (us, skillMap) => {
  const skillData = skillMap[us.skillId.toString()] || null
  return {
    _id:         us._id.toString(),
    type:        us.type,
    level:       us.level || null,
    description: us.description || '',
    skillId:     skillData,
  }
}

// ── Get user profile by ID ────────────────────────────────────────────────────
const getUserById = async (userId) => {
  const user = await User.findById(userId)
  if (!user || !user.isActive) throw new AppError('User not found.', 404)

  // Get UserSkill docs (no populate — plain IDs only)
  const userSkills = await UserSkill.find({ userId }).lean()

  if (!userSkills.length) {
    return { ...user.toSafeObject(), teachSkills: [], learnSkills: [] }
  }

  // Fetch all referenced skills in one query
  const skillIds  = [...new Set(userSkills.map(us => us.skillId.toString()))]
  const skillDocs = await Skill.find({ _id: { $in: skillIds } }).select('name slug category iconUrl').lean()

  const skillMap = {}
  for (const s of skillDocs) {
    skillMap[s._id.toString()] = {
      _id:      s._id.toString(),
      name:     s.name,
      slug:     s.slug || '',
      category: s.category || '',
      iconUrl:  s.iconUrl || '',
    }
  }

  const teach = userSkills
    .filter(us => us.type === 'teach')
    .map(us => buildSkillEntry(us, skillMap))
    .filter(e => e.skillId?.name)

  const learn = userSkills
    .filter(us => us.type === 'learn')
    .map(us => buildSkillEntry(us, skillMap))
    .filter(e => e.skillId?.name)

  return { ...user.toSafeObject(), teachSkills: teach, learnSkills: learn }
}

// ── Update profile ────────────────────────────────────────────────────────────
const updateProfile = async (userId, updates) => {
  const allowed  = ['name', 'bio', 'location', 'timezone', 'avatarUrl']
  const filtered = {}
  for (const key of allowed) {
    if (updates[key] !== undefined) filtered[key] = updates[key]
  }
  const user = await User.findByIdAndUpdate(userId, filtered, { new: true, runValidators: true })
  if (!user) throw new AppError('User not found.', 404)
  return user.toSafeObject()
}

// ── Complete onboarding ───────────────────────────────────────────────────────
const completeOnboarding = async (userId, { teachSkills = [], learnSkills = [] }) => {
  if (!teachSkills.length && !learnSkills.length)
    throw new AppError('Please add at least one skill to teach or learn.', 400)

  for (const { skillId, level, description } of teachSkills) {
    await UserSkill.findOneAndUpdate(
      { userId, skillId, type: 'teach' },
      { level: level || 'intermediate', description: description || '' },
      { upsert: true, new: true }
    )
  }

  for (const { skillId, description } of learnSkills) {
    await UserSkill.findOneAndUpdate(
      { userId, skillId, type: 'learn' },
      { description: description || '' },
      { upsert: true, new: true }
    )
  }

  await User.findByIdAndUpdate(userId, { onboardingCompleted: true })
  return { message: 'Onboarding complete!' }
}

// ── Add a skill ───────────────────────────────────────────────────────────────
const addUserSkill = async (userId, { skillId, type, level, description }) => {
  const skill = await Skill.findById(skillId).lean()
  if (!skill) throw new AppError('Skill not found.', 404)

  const entry = await UserSkill.findOneAndUpdate(
    { userId, skillId, type },
    { level: level || null, description: description || '' },
    { upsert: true, new: true }
  ).lean()

  return {
    _id:         entry._id.toString(),
    type:        entry.type,
    level:       entry.level || null,
    description: entry.description || '',
    skillId: {
      _id:      skill._id.toString(),
      name:     skill.name,
      slug:     skill.slug || '',
      category: skill.category || '',
    },
  }
}

// ── Remove a skill ────────────────────────────────────────────────────────────
const removeUserSkill = async (userId, userSkillId) => {
  const entry = await UserSkill.findOne({ _id: userSkillId, userId })
  if (!entry) throw new AppError('Skill entry not found.', 404)
  await entry.deleteOne()
  return { message: 'Skill removed.' }
}

// ── List users ────────────────────────────────────────────────────────────────
const listUsers = async (query) => {
  const { page, limit, skip } = parsePagination(query)
  const filter = { isActive: true }

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ]
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ])

  return {
    users: users.map(u => u.toSafeObject()),
    meta:  buildMeta({ page, limit, total }),
  }
}

module.exports = {
  getUserById, updateProfile, completeOnboarding,
  addUserSkill, removeUserSkill, listUsers,
}