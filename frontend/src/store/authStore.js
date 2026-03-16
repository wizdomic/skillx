import { create } from 'zustand'
import { authApi } from '../api/authApi'
import { userApi } from '../api/index'

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Called on app startup and after OAuth callback
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