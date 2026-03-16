import api from '../utils/axiosInstance'

export const authApi = {
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout:  ()             => api.post('/auth/logout'),
  getMe:   ()             => api.get('/auth/me'),
}