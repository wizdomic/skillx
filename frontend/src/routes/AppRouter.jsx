import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { SocketProvider } from '../context/SocketContext'

import LandingPage           from '../pages/LandingPage'
import LoginPage             from '../pages/LoginPage'
import OAuthCallbackPage     from '../pages/OAuthCallbackPage'
import OnboardingPage        from '../pages/OnboardingPage'
import DashboardPage         from '../pages/DashboardPage'
import ProfilePage           from '../pages/ProfilePage'
import EditProfilePage       from '../pages/EditProfilePage'
import SkillsPage            from '../pages/SkillsPage'
import SkillRequestBoardPage from '../pages/SkillRequestBoardPage'
import ChatPage              from '../pages/ChatPage'
import SessionsPage          from '../pages/SessionsPage'
import WalletPage            from '../pages/WalletPage'
import RatingsPage           from '../pages/RatingsPage'
import NotFoundPage          from '../pages/NotFoundPage'
import AppLayout             from '../components/common/AppLayout'
import Loader                from '../components/common/Loader'

function Protected({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  if (isLoading) return <Loader fullscreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function Public({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  if (isLoading) return <Loader fullscreen />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

export default function AppRouter() {
  return (
    <SocketProvider>
      <Routes>
        <Route path="/"                    element={<LandingPage />} />
        <Route path="/login"               element={<Public><LoginPage /></Public>} />
        <Route path="/signup"              element={<Navigate to="/login" replace />} />
        <Route path="/forgot-password"     element={<Navigate to="/login" replace />} />
        <Route path="/auth/oauth-callback" element={<OAuthCallbackPage />} />

        <Route element={<Protected><AppLayout /></Protected>}>
          <Route path="/onboarding"       element={<OnboardingPage />} />
          <Route path="/dashboard"        element={<DashboardPage />} />
          <Route path="/profile/edit"     element={<EditProfilePage />} />
          <Route path="/profile/:userId"  element={<ProfilePage />} />
          <Route path="/skills"           element={<SkillsPage />} />
          <Route path="/requests"         element={<SkillRequestBoardPage />} />
          <Route path="/chat"             element={<ChatPage />} />
          <Route path="/chat/:userId"     element={<ChatPage />} />
          <Route path="/sessions"         element={<SessionsPage />} />
          <Route path="/wallet"           element={<WalletPage />} />
          <Route path="/ratings/:userId"  element={<RatingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </SocketProvider>
  )
}