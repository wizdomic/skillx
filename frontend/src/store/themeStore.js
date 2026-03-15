import { create } from 'zustand'

const applyTheme = (dark) => {
  if (dark) document.documentElement.classList.add('dark')
  else      document.documentElement.classList.remove('dark')
  localStorage.setItem('theme', dark ? 'dark' : 'light')
}

const getInitial = () => {
  const saved = localStorage.getItem('theme')
  if (saved) return saved === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

const initialDark = getInitial()
applyTheme(initialDark)

export const useThemeStore = create((set) => ({
  dark: initialDark,
  toggle: () => set((state) => {
    const next = !state.dark
    applyTheme(next)
    return { dark: next }
  }),
}))