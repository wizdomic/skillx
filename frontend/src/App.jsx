import { useEffect } from 'react'
import AppRouter from './routes/AppRouter'
import { useAuthStore } from './store/authStore'

export default function App() {
  const { initAuth } = useAuthStore()
  useEffect(() => { initAuth() }, [])
  return <AppRouter />
}