import api from '../utils/axiosInstance'

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  login: (data) => api.post('/auth/login', data),
  sendPhoneOTP: (phone) => api.post('/auth/phone/send-otp', { phone }),
  verifyPhoneOTP: (data) => api.post('/auth/phone/verify-otp', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
}
