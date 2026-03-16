// src/modules/users/user.service.js
const User              = require('../../models/User')
const UserSkill         = require('../../models/UserSkill')
const Skill             = require('../../models/Skill')
const Session           = require('../../models/Session')
const Message           = require('../../models/Message')
const Rating            = require('../../models/Rating')
const CreditTransaction = require('../../models/CreditTransaction')
const SkillRequest      = require('../../models/SkillRequest')
const { AppError }      = require('../../middleware/errorHandler')
const { parsePagination, buildMeta } = require('../../utils/paginate')

const buildSkillEntry = (us, skillMap) => {
  const skillData = skillMap[us.skillId.toString()] || null
  return { _id: us._id.toString(), type: us.type, level: us.level || null, description: us.description || '', skillId: skillData }
}

const getUserById = async (userId) => {
  const user = await User.findById(userId)
  if (!user || !user.isActive) throw new AppError('User not found.', 404)

  const userSkills = await UserSkill.find({ userId }).lean()
  if (!userSkills.length) return { ...user.toSafeObject(), teachSkills: [], learnSkills: [] }

  const skillIds  = [...new Set(userSkills.map(us => us.skillId.toString()))]
  const skillDocs = await Skill.find({ _id: { $in: skillIds } }).select('name slug category iconUrl').lean()

  const skillMap = {}
  for (const s of skillDocs) skillMap[s._id.toString()] = { _id: s._id.toString(), name: s.name, slug: s.slug || '', category: s.category || '', iconUrl: s.iconUrl || '' }

  const teach = userSkills.filter(us => us.type === 'teach').map(us => buildSkillEntry(us, skillMap)).filter(e => e.skillId?.name)
  const learn = userSkills.filter(us => us.type === 'learn').map(us => buildSkillEntry(us, skillMap)).filter(e => e.skillId?.name)

  return { ...user.toSafeObject(), teachSkills: teach, learnSkills: learn }
}

const updateProfile = async (userId, updates) => {
  const allowed  = ['name', 'bio', 'location', 'timezone', 'avatarUrl', 'username']
  const filtered = {}
  for (const key of allowed) {
    if (updates[key] !== undefined) filtered[key] = updates[key]
  }

  if (filtered.username) {
    filtered.username = filtered.username.toLowerCase().trim()
    if (!/^[a-z0-9_]{3,30}$/.test(filtered.username))
      throw new AppError('Username can only contain letters, numbers and underscores (3–30 chars).', 400)
    const existing = await User.findOne({ username: filtered.username, _id: { $ne: userId } }).lean()
    if (existing) throw new AppError('Username is already taken.', 409)
  }

  const user = await User.findByIdAndUpdate(userId, filtered, { new: true, runValidators: true })
  if (!user) throw new AppError('User not found.', 404)
  return user.toSafeObject()
}

const completeOnboarding = async (userId, { teachSkills = [], learnSkills = [] }) => {
  if (!teachSkills.length && !learnSkills.length)
    throw new AppError('Please add at least one skill to teach or learn.', 400)

  for (const { skillId, level, description } of teachSkills)
    await UserSkill.findOneAndUpdate({ userId, skillId, type: 'teach' }, { level: level || 'intermediate', description: description || '' }, { upsert: true, new: true })

  for (const { skillId, description } of learnSkills)
    await UserSkill.findOneAndUpdate({ userId, skillId, type: 'learn' }, { description: description || '' }, { upsert: true, new: true })

  await User.findByIdAndUpdate(userId, { onboardingCompleted: true })
  return { message: 'Onboarding complete!' }
}

const addUserSkill = async (userId, { skillId, type, level, description }) => {
  const skill = await Skill.findById(skillId).lean()
  if (!skill) throw new AppError('Skill not found.', 404)
  const entry = await UserSkill.findOneAndUpdate({ userId, skillId, type }, { level: level || null, description: description || '' }, { upsert: true, new: true }).lean()
  return { _id: entry._id.toString(), type: entry.type, level: entry.level || null, description: entry.description || '', skillId: { _id: skill._id.toString(), name: skill.name, slug: skill.slug || '', category: skill.category || '' } }
}

const removeUserSkill = async (userId, userSkillId) => {
  const entry = await UserSkill.findOne({ _id: userSkillId, userId })
  if (!entry) throw new AppError('Skill entry not found.', 404)
  await entry.deleteOne()
  return { message: 'Skill removed.' }
}

// ── Search users by @username or name ─────────────────────────────────────────
const searchUsers = async (query, currentUserId) => {
  const q = (query.q || '').trim()
  if (!q || q.length < 2) return { users: [] }

  const cleanQ = q.startsWith('@') ? q.slice(1) : q

  const users = await User.find({
    isActive: true,
    _id: { $ne: currentUserId },
    $or: [
      { username: { $regex: `^${cleanQ}`, $options: 'i' } },
      { name:     { $regex: cleanQ,       $options: 'i' } },
    ],
  })
    .select('name username avatarUrl averageRating ratingCount totalSessions')
    .limit(10)
    .lean()

  return { users }
}

const deleteAccount = async (userId) => {
  const user = await User.findById(userId)
  if (!user) throw new AppError('User not found.', 404)

  await Promise.all([
    UserSkill.deleteMany({ userId }),
    Message.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] }),
    Rating.deleteMany({ $or: [{ raterId: userId }, { ratedId: userId }] }),
    CreditTransaction.deleteMany({ userId }),
    SkillRequest.deleteMany({ userId }),
    Session.deleteMany({ $or: [{ teacherId: userId }, { learnerId: userId }] }),
  ])

  await User.findByIdAndDelete(userId)
  return { message: 'Account deleted.' }
}

const listUsers = async (query) => {
  const { page, limit, skip } = parsePagination(query)
  const filter = { isActive: true }
  if (query.search) {
    filter.$or = [
      { name:     { $regex: query.search, $options: 'i' } },
      { username: { $regex: query.search, $options: 'i' } },
      { email:    { $regex: query.search, $options: 'i' } },
    ]
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ])
  return { users: users.map(u => u.toSafeObject()), meta: buildMeta({ page, limit, total }) }
}

module.exports = { getUserById, updateProfile, completeOnboarding, addUserSkill, removeUserSkill, searchUsers, deleteAccount, listUsers }