// src/modules/requests/request.service.js
const SkillRequest = require('../../models/SkillRequest');
const { AppError } = require('../../middleware/errorHandler');
const { parsePagination, buildMeta } = require('../../utils/paginate');

const listRequests = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = { status: 'open' };

  if (query.type) filter.type = query.type;
  if (query.skillId) filter.skillId = query.skillId;
  if (query.userId) filter.userId = query.userId;

  const [requests, total] = await Promise.all([
    SkillRequest.find(filter)
      .populate('userId', 'name avatarUrl averageRating')
      .populate('skillId', 'name slug category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SkillRequest.countDocuments(filter),
  ]);

  return { requests, meta: buildMeta({ page, limit, total }) };
};

const createRequest = async (userId, data) => {
  const request = await SkillRequest.create({ userId, ...data });
  return request.populate(['userId', 'skillId']);
};

const updateRequest = async (userId, requestId, data) => {
  const request = await SkillRequest.findOne({ _id: requestId, userId });
  if (!request) throw new AppError('Request not found or not yours.', 404);

  Object.assign(request, data);
  await request.save();
  return request;
};

const deleteRequest = async (userId, requestId) => {
  const request = await SkillRequest.findOneAndDelete({ _id: requestId, userId });
  if (!request) throw new AppError('Request not found or not yours.', 404);
  return { message: 'Request removed.' };
};

module.exports = { listRequests, createRequest, updateRequest, deleteRequest };
