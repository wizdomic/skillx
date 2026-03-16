import { create } from 'zustand'
import { authApi } from '../api/authApi'
import { userApi } from '../api/index'

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // ── Called on app startup and after OAuth callback ─────────────────────────
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

  // ── Login — fetch full profile after auth so skills are included ───────────
  login: async (credentials) => {
    const { data } = await authApi.login(credentials)
    const { accessToken, refreshToken } = data.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    // Fetch full profile (includes teachSkills / learnSkills)
    const me = await userApi.getMe()
    const user = me.data.data
    set({ user, isAuthenticated: true })
    return user
  },

  register: async (credentials) => {
    const { data } = await authApi.register(credentials)
    return data
  },

  // ── Email verify — fetch full profile after auth so skills are included ────
  verifyEmail: async (payload) => {
    const { data } = await authApi.verifyEmail(payload)
    const { accessToken, refreshToken } = data.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    // Fetch full profile (includes teachSkills / learnSkills)
    const me = await userApi.getMe()
    const user = me.data.data
    set({ user, isAuthenticated: true })
    return user
  },

  loginWithPhone: async (payload) => {
    const { data } = await authApi.verifyPhoneOTP(payload)
    const { accessToken, refreshToken } = data.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    const me = await userApi.getMe()
    const user = me.data.data
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