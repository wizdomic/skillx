// src/modules/requests/request.service.js
const SkillRequest = require('../../models/SkillRequest')
const UserSkill    = require('../../models/UserSkill')
const { AppError } = require('../../middleware/errorHandler')
const { parsePagination, buildMeta } = require('../../utils/paginate')

const listRequests = async (query, currentUserId) => {
  const { page, limit, skip } = parsePagination(query)

  // Get the current user's skill IDs split by type
  const mySkills = await UserSkill.find({ userId: currentUserId }).lean()
  const myLearnSkillIds = mySkills.filter(s => s.type === 'learn').map(s => s.skillId.toString())
  const myTeachSkillIds = mySkills.filter(s => s.type === 'teach').map(s => s.skillId.toString())

  // Visibility rules:
  //   offer   posts (I can teach X) → visible if X is in my learn skills
  //   wanted  posts (I want to learn X) → visible if X is in my teach skills
  //   always show my own posts regardless
  const visibilityFilter = {
    $or: [
      { userId: currentUserId },
      { type: 'offer',  skillId: { $in: myLearnSkillIds } },
      { type: 'wanted', skillId: { $in: myTeachSkillIds } },
    ],
  }

  const filter = { status: 'open', ...visibilityFilter }
  if (query.type)    filter.type    = query.type
  if (query.skillId) filter.skillId = query.skillId
  if (query.userId)  filter.userId  = query.userId

  const [requests, total] = await Promise.all([
    SkillRequest.find(filter)
      .populate('userId',  'name avatarUrl averageRating ratingCount')
      .populate('skillId', 'name slug category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SkillRequest.countDocuments(filter),
  ])

  return { requests, meta: buildMeta({ page, limit, total }) }
}

const createRequest = async (userId, data) => {
  const request = await SkillRequest.create({ userId, ...data })
  return request.populate(['userId', 'skillId'])
}

const updateRequest = async (userId, requestId, data) => {
  const request = await SkillRequest.findOne({ _id: requestId, userId })
  if (!request) throw new AppError('Request not found or not yours.', 404)
  Object.assign(request, data)
  await request.save()
  return request
}

const deleteRequest = async (userId, requestId) => {
  const request = await SkillRequest.findOneAndDelete({ _id: requestId, userId })
  if (!request) throw new AppError('Request not found or not yours.', 404)
  return { message: 'Request removed.' }
}

module.exports = { listRequests, createRequest, updateRequest, deleteRequest }