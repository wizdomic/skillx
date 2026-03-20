import api from '../utils/axiosInstance'

export const userApi = {
  getMe:              ()         => api.get('/users/me'),
  getUser:            (userId)   => api.get(`/users/${userId}`),
  updateProfile:      (data)     => api.patch('/users/me', data),
  completeOnboarding: (data)     => api.post('/users/me/onboarding', data),
  addSkill:           (data)     => api.post('/users/me/skills', data),
  removeSkill:        (id)       => api.delete(`/users/me/skills/${id}`),
  deleteAccount:      ()         => api.delete('/users/me'),
  searchUsers:        (q)        => api.get('/users/search', { params: { q } }),
  uploadAvatar:       (formData) => api.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

export const skillApi = {
  list:          (params) => api.get('/skills', { params }),
  getById:       (id)     => api.get(`/skills/${id}`),
  getCategories: ()       => api.get('/skills/categories'),
  create:        (data)   => api.post('/skills', data),
}

export const sessionApi = {
  create:         (data)       => api.post('/sessions', data),
  list:           (params)     => api.get('/sessions', { params }),
  getById:        (id)         => api.get(`/sessions/${id}`),
  accept:         (id)         => api.put(`/sessions/${id}/accept`),
  setMeetingLink: (id, body)   => api.patch(`/sessions/${id}/meeting-link`, body),
  cancel:         (id, reason) => api.put(`/sessions/${id}/cancel`, { reason }),
  confirm:        (id)         => api.put(`/sessions/${id}/confirm`),
  delete:         (id)         => api.delete(`/sessions/${id}`),
}

export const creditApi = {
  getWallet: (params) => api.get('/credits/wallet', { params }),
}

export const ratingApi = {
  submit:         (data)           => api.post('/ratings', data),
  getUserRatings: (userId, params) => api.get(`/ratings/${userId}`, { params }),
}

export const requestApi = {
  list:   (params)     => api.get('/requests', { params }),
  create: (data)       => api.post('/requests', data),
  update: (id, data)   => api.patch(`/requests/${id}`, data),
  delete: (id)         => api.delete(`/requests/${id}`),
}

export const recommendationApi = {
  get: (params) => api.get('/recommendations', { params }),
}

export const chatApi = {
  send:                (data)           => api.post('/chat', data),
  deleteMessage:       (messageId)      => api.delete(`/chat/message/${messageId}`),
  deleteConversation:  (userId)         => api.delete(`/chat/conversation/${userId}`),
  getConversation:     (userId, params) => api.get(`/chat/${userId}`, { params }),
  getConversationList: ()               => api.get('/chat/conversations'),
  getUnreadCount:      ()               => api.get('/chat/unread'),
}