import api from '../utils/axiosInstance'

// ── Users ─────────────────────────────────────────────────────────────────────
export const userApi = {
  getMe: () => api.get('/users/me'),
  getUser: (userId) => api.get(`/users/${userId}`),
  updateProfile: (data) => api.patch('/users/me', data),
  completeOnboarding: (data) => api.post('/users/me/onboarding', data),
  addSkill: (data) => api.post('/users/me/skills', data),
  removeSkill: (userSkillId) => api.delete(`/users/me/skills/${userSkillId}`),
}

// ── Skills ────────────────────────────────────────────────────────────────────
export const skillApi = {
  list: (params) => api.get('/skills', { params }),
  getById: (skillId) => api.get(`/skills/${skillId}`),
  getCategories: () => api.get('/skills/categories'),
  create: (data) => api.post('/skills', data),
}

// ── Sessions ──────────────────────────────────────────────────────────────────
export const sessionApi = {
  create: (data) => api.post('/sessions', data),
  list: (params) => api.get('/sessions', { params }),
  getById: (sessionId) => api.get(`/sessions/${sessionId}`),
  accept: (sessionId) => api.put(`/sessions/${sessionId}/accept`),
  cancel: (sessionId, reason) => api.put(`/sessions/${sessionId}/cancel`, { reason }),
  confirm: (sessionId) => api.put(`/sessions/${sessionId}/confirm`),
}

// ── Credits ───────────────────────────────────────────────────────────────────
export const creditApi = {
  getWallet: (params) => api.get('/credits/wallet', { params }),
}

// ── Ratings ───────────────────────────────────────────────────────────────────
export const ratingApi = {
  submit: (data) => api.post('/ratings', data),
  getUserRatings: (userId, params) => api.get(`/ratings/${userId}`, { params }),
}

// ── Skill Requests ────────────────────────────────────────────────────────────
export const requestApi = {
  list: (params) => api.get('/requests', { params }),
  create: (data) => api.post('/requests', data),
  update: (requestId, data) => api.patch(`/requests/${requestId}`, data),
  delete: (requestId) => api.delete(`/requests/${requestId}`),
}

// ── Recommendations ───────────────────────────────────────────────────────────
export const recommendationApi = {
  get: (params) => api.get('/recommendations', { params }),
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatApi = {
  send: (data) => api.post('/chat', data),
  getConversation: (userId, params) => api.get(`/chat/${userId}`, { params }),
  getConversationList: () => api.get('/chat/conversations'),
  getUnreadCount: () => api.get('/chat/unread'),
}
