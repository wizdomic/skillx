import { create } from 'zustand'

// ── Credit Store ──────────────────────────────────────────────────────────────
export const useCreditStore = create((set) => ({
  balance: null,
  setBalance: (balance) => set({ balance }),
  incrementBalance: (amount) => set((s) => ({ balance: (s.balance || 0) + amount })),
  decrementBalance: (amount) => set((s) => ({ balance: Math.max(0, (s.balance || 0) - amount) })),
}))

// ── Notification Store ────────────────────────────────────────────────────────
export const useNotificationStore = create((set) => ({
  unreadMessages: 0,
  pendingSessions: 0,
  ratingPrompts: [],  // [{ sessionId }]

  setUnreadMessages: (n) => set({ unreadMessages: n }),
  incrementUnread: () => set((s) => ({ unreadMessages: s.unreadMessages + 1 })),
  clearUnread: () => set({ unreadMessages: 0 }),

  setPendingSessions: (n) => set({ pendingSessions: n }),

  addRatingPrompt: (sessionId) =>
    set((s) => ({
      ratingPrompts: s.ratingPrompts.find((r) => r.sessionId === sessionId)
        ? s.ratingPrompts
        : [...s.ratingPrompts, { sessionId }],
    })),
  dismissRatingPrompt: (sessionId) =>
    set((s) => ({ ratingPrompts: s.ratingPrompts.filter((r) => r.sessionId !== sessionId) })),
}))
