// src/modules/recommendations/recommendation.service.js
const UserSkill = require('../../models/UserSkill')
const User      = require('../../models/User')
const Skill     = require('../../models/Skill')
const { parsePagination, buildMeta } = require('../../utils/paginate')

const scoreCandidate = (user, sharedSkillCount) => {
  let score = 0
  score += sharedSkillCount * 30
  score += (user.averageRating || 0) * 10
  score += Math.min(user.totalSessions || 0, 20)
  return score
}

const getRecommendations = async (currentUserId, query) => {
  const { page, limit, skip } = parsePagination(query)

  // 1. My skills
  const mySkills        = await UserSkill.find({ userId: currentUserId }).lean()
  const myLearnSkillIds = mySkills.filter(s => s.type === 'learn').map(s => s.skillId)
  const myTeachSkillIds = mySkills.filter(s => s.type === 'teach').map(s => s.skillId)

  if (!myLearnSkillIds.length && !myTeachSkillIds.length) {
    return { matches: [], meta: buildMeta({ page, limit, total: 0 }) }
  }

  // 2. Find matching users
  const [teacherMatches, learnerMatches] = await Promise.all([
    UserSkill.find({ skillId: { $in: myLearnSkillIds }, type: 'teach', userId: { $ne: currentUserId } })
      .select('userId skillId').lean(),
    UserSkill.find({ skillId: { $in: myTeachSkillIds }, type: 'learn', userId: { $ne: currentUserId } })
      .select('userId skillId').lean(),
  ])

  // 3. Build candidate map
  const candidateMap = new Map()
  for (const m of [...teacherMatches, ...learnerMatches]) {
    const id = m.userId.toString()
    if (!candidateMap.has(id)) candidateMap.set(id, { sharedSkillCount: 0 })
    candidateMap.get(id).sharedSkillCount += 1
  }

  if (!candidateMap.size) return { matches: [], meta: buildMeta({ page, limit, total: 0 }) }

  // 4. Fetch candidate user docs
  const candidateIds = [...candidateMap.keys()]
  const users = await User.find({ _id: { $in: candidateIds }, isActive: true })
    .select('name avatarUrl bio location averageRating ratingCount totalSessions onboardingCompleted')
    .lean()

  // 5. Score + sort
  const scored = users
    .filter(u => u.onboardingCompleted)
    .map(u => ({
      user:             u,
      sharedSkillCount: candidateMap.get(u._id.toString()).sharedSkillCount,
      score:            scoreCandidate(u, candidateMap.get(u._id.toString()).sharedSkillCount),
    }))
    .sort((a, b) => b.score - a.score)

  const total     = scored.length
  const paginated = scored.slice(skip, skip + limit)

  if (!paginated.length) return { matches: [], meta: buildMeta({ page, limit, total }) }

  // 6. Fetch ALL UserSkill docs for paginated candidates in ONE query (no loop populate)
  const paginatedIds = paginated.map(m => m.user._id)

  const allUserSkills = await UserSkill.find({ userId: { $in: paginatedIds } })
    .select('userId skillId type level description')
    .lean()

  // 7. Collect ALL unique skillIds and fetch their details in ONE query
  const allSkillIds = [...new Set(allUserSkills.map(us => us.skillId.toString()))]
  const skillDocs   = await Skill.find({ _id: { $in: allSkillIds } })
    .select('name slug category')
    .lean()

  // Build a plain lookup map: skillId string → { _id, name, slug, category }
  const skillMap = {}
  for (const s of skillDocs) {
    skillMap[s._id.toString()] = {
      _id:      s._id.toString(),
      name:     s.name,
      slug:     s.slug || '',
      category: s.category || '',
    }
  }

  // 8. Group UserSkills by userId
  const skillsByUser = {}
  for (const us of allUserSkills) {
    const uid = us.userId.toString()
    if (!skillsByUser[uid]) skillsByUser[uid] = []
    skillsByUser[uid].push({
      _id:         us._id.toString(),
      type:        us.type,
      level:       us.level || null,
      description: us.description || '',
      skillId:     skillMap[us.skillId.toString()] || null,
    })
  }

  // 9. Build final clean matches
  const enriched = paginated.map(match => {
    const uid    = match.user._id.toString()
    const skills = (skillsByUser[uid] || []).filter(s => s.skillId && s.skillId.name)

    return {
      user: {
        _id:           uid,
        name:          match.user.name || '',
        avatarUrl:     match.user.avatarUrl || '',
        bio:           match.user.bio || '',
        location:      match.user.location || '',
        averageRating: match.user.averageRating || 0,
        ratingCount:   match.user.ratingCount || 0,
        totalSessions: match.user.totalSessions || 0,
      },
      sharedSkillCount: match.sharedSkillCount,
      teachSkills:      skills.filter(s => s.type === 'teach'),
      learnSkills:      skills.filter(s => s.type === 'learn'),
    }
  })

  return { matches: enriched, meta: buildMeta({ page, limit, total }) }
}

module.exports = { getRecommendations }