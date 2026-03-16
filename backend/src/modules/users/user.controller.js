// src/modules/users/user.controller.js
const userService = require('./user.service')
const { success } = require('../../utils/apiResponse')
const asyncHandler = require('../../utils/asyncHandler')

const getMe = asyncHandler(async (req, res) => {
  const data = await userService.getUserById(req.user._id)
  success(res, { data })
})

const getUser = asyncHandler(async (req, res) => {
  const data = await userService.getUserById(req.params.userId)
  success(res, { data })
})

const updateProfile = asyncHandler(async (req, res) => {
  const data = await userService.updateProfile(req.user._id, req.body)
  success(res, { message: 'Profile updated.', data })
})

const completeOnboarding = asyncHandler(async (req, res) => {
  const data = await userService.completeOnboarding(req.user._id, req.body)
  success(res, { message: data.message })
})

const addSkill = asyncHandler(async (req, res) => {
  const data = await userService.addUserSkill(req.user._id, req.body)
  success(res, { statusCode: 201, message: 'Skill added.', data })
})

const removeSkill = asyncHandler(async (req, res) => {
  const data = await userService.removeUserSkill(req.user._id, req.params.userSkillId)
  success(res, { message: data.message })
})

const searchUsers = asyncHandler(async (req, res) => {
  const data = await userService.searchUsers(req.query, req.user._id)
  success(res, { data })
})

const deleteAccount = asyncHandler(async (req, res) => {
  await userService.deleteAccount(req.user._id)
  success(res, { message: 'Your account has been permanently deleted.' })
})

const listUsers = asyncHandler(async (req, res) => {
  const { users, meta } = await userService.listUsers(req.query)
  success(res, { data: { users }, meta })
})

module.exports = { getMe, getUser, updateProfile, completeOnboarding, addSkill, removeSkill, searchUsers, deleteAccount, listUsers }