import { create } from 'zustand'

// ── Credit Store ──────────────────────────────────────────────────────────────
export const useCreditStore = create((set) => ({
  balance:          null,
  setBalance:       (balance) => set({ balance }),
  incrementBalance: (amount) => set(s => ({ balance: (s.balance || 0) + amount })),
  decrementBalance: (amount) => set(s => ({ balance: Math.max(0, (s.balance || 0) - amount) })),
}))

// ── Notification Store ────────────────────────────────────────────────────────
// notifications: [{ id, type, title, body, sessionId?, read, createdAt }]
export const useNotificationStore = create((set, get) => ({
  unreadMessages:  0,
  pendingSessions: 0,
  ratingPrompts:   [],
  notifications:   [],  // persistent in-app notifications

  setUnreadMessages:  (n) => set({ unreadMessages: n }),
  incrementUnread:    ()  => set(s => ({ unreadMessages: s.unreadMessages + 1 })),
  clearUnread:        ()  => set({ unreadMessages: 0 }),
  setPendingSessions: (n) => set({ pendingSessions: n }),

  // ── Rating prompts ─────────────────────────────────────────────────────────
  addRatingPrompt: (sessionId) =>
    set(s => ({
      ratingPrompts: s.ratingPrompts.find(r => r.sessionId === sessionId)
        ? s.ratingPrompts
        : [...s.ratingPrompts, { sessionId }],
    })),
  dismissRatingPrompt: (sessionId) =>
    set(s => ({ ratingPrompts: s.ratingPrompts.filter(r => r.sessionId !== sessionId) })),

  // ── Persistent notifications ───────────────────────────────────────────────
  addNotification: (notif) =>
    set(s => ({
      notifications: [
        { id: `n_${Date.now()}_${Math.random()}`, read: false, createdAt: new Date().toISOString(), ...notif },
        ...s.notifications,
      ].slice(0, 50), // keep max 50
    })),

  markAllRead: () =>
    set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) })),

  deleteNotification: (id) =>
    set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),

  clearAllNotifications: () => set({ notifications: [] }),

  get unreadNotifications() {
    return get().notifications.filter(n => !n.read).length
  },
}))