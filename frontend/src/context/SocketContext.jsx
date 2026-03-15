import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuthStore()
  const { incrementUnread, addRatingPrompt, addNotification } = useNotificationStore()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setConnected(false)
      return
    }
    const token = localStorage.getItem('accessToken')
    if (!token) return

    const url    = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
    const socket = io(url, { auth: { token }, transports: ['websocket'], reconnectionAttempts: 5 })

    socket.on('connect',    () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    // Chat
    socket.on('chat:receive', () => incrementUnread())

    // Session — new booking request (teacher receives)
    socket.on('session:new_request', data => {
      addNotification({
        type:      'session_request',
        title:     '📅 New session request',
        body:      `${data.learnerName} wants to learn ${data.skillName}`,
        sessionId: data.sessionId,
      })
      toast.success(`📅 ${data.learnerName} wants to learn ${data.skillName}`, { duration: 5000 })
    })

    // Session accepted (learner receives)
    socket.on('session:accepted', data => {
      addNotification({
        type:      'session_accepted',
        title:     '✅ Session accepted!',
        body:      `Your session has been accepted. Set a meeting link before it starts.`,
        sessionId: data.sessionId,
      })
      toast.success('✅ Your session was accepted!', { duration: 5000 })
    })

    // Session cancelled
    socket.on('session:cancelled', data => {
      addNotification({
        type:      'session_cancelled',
        title:     '❌ Session cancelled',
        body:      data.reason ? `Reason: ${data.reason}` : 'A session was cancelled.',
        sessionId: data.sessionId,
      })
      if (data.refunded) {
        toast.error(`Session cancelled — credit refunded`, { duration: 5000 })
      } else {
        toast.error(`Session cancelled`, { duration: 5000 })
      }
    })

    // Meeting link set/updated
    socket.on('session:meeting_updated', data => {
      addNotification({
        type:      'meeting_link',
        title:     '🔗 Meeting link updated',
        body:      `${data.updatedBy} set the meeting link for your session.`,
        sessionId: data.sessionId,
      })
      toast(`🔗 Meeting link was updated`, { duration: 4000 })
    })

    // Session reminder
    socket.on('session:reminder', data => {
      addNotification({
        type:      'reminder',
        title:     '⏰ Session starting soon',
        body:      data.message,
        sessionId: data.sessionId,
      })
      toast(`⏰ ${data.message}`, { icon: '📅', duration: 8000 })
    })

    // Rate prompt
    socket.on('session:rate_prompt', data => {
      addRatingPrompt(data.sessionId)
      addNotification({
        type:      'rate_prompt',
        title:     '⭐ Rate your session',
        body:      'Your session is complete. Leave a rating for your partner.',
        sessionId: data.sessionId,
      })
      toast.success('Session complete! Please rate your partner.', { duration: 6000 })
    })

    socketRef.current = socket
    return () => { socket.disconnect(); socketRef.current = null }
  }, [isAuthenticated])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)