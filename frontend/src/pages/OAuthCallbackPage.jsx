import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Loader from '../components/common/Loader'

export default function OAuthCallbackPage() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { initAuth } = useAuthStore()

  useEffect(() => {
    const access  = params.get('accessToken')
    const refresh = params.get('refreshToken')
    if (access && refresh) {
      localStorage.setItem('accessToken', access)
      localStorage.setItem('refreshToken', refresh)
      initAuth().then(() => nav('/dashboard'))
    } else {
      nav('/login')
    }
  }, [])

  return <Loader fullscreen />
}