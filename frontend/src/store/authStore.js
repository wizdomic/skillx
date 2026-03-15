import { create } from 'zustand'
import { authApi } from '../api/authApi'
import { userApi } from '../api/index'

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initAuth: async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      set({ isLoading: false })
      return
    }
    try {
      const { data } = await userApi.getMe()
      set({ user: data.data, isAuthenticated: true, isLoading: false })
    } catch {
      localStorage.clear()
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  login: async (credentials) => {
    const { data } = await authApi.login(credentials)
    const { user, accessToken, refreshToken } = data.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    set({ user, isAuthenticated: true })
    return user
  },

  register: async (credentials) => {
    const { data } = await authApi.register(credentials)
    return data
  },

  verifyEmail: async (payload) => {
    const { data } = await authApi.verifyEmail(payload)
    const { user, accessToken, refreshToken } = data.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    set({ user, isAuthenticated: true })
    return user
  },

  loginWithPhone: async (payload) => {
    const { data } = await authApi.verifyPhoneOTP(payload)
    const { user, accessToken, refreshToken } = data.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    set({ user, isAuthenticated: true })
    return user
  },

  logout: async () => {
    try { await authApi.logout() } catch (_) {}
    localStorage.clear()
    set({ user: null, isAuthenticated: false })
  },

  updateUser: (updates) => {
    set((state) => ({ user: { ...state.user, ...updates } }))
  },

  setUser: (user) => set({ user }),
}))
