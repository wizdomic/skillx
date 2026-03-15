import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuthStore()
  const { incrementUnread, addRatingPrompt } = useNotificationStore()
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

    const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
    const socket = io(url, { auth: { token }, transports: ['websocket'], reconnectionAttempts: 5 })

    socket.on('connect',    () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('chat:receive', () => incrementUnread())
    socket.on('session:new_request', d => toast.success(`📅 New session from ${d.learnerName} for ${d.skillName}`))
    socket.on('session:accepted',    () => toast.success('✅ Session accepted!'))
    socket.on('session:cancelled',   d => toast.error(`Session cancelled${d.reason ? `: ${d.reason}` : ''}`))
    socket.on('session:reminder',    d => toast(`⏰ ${d.message}`, { icon: '📅', duration: 8000 }))
    socket.on('session:rate_prompt', d => {
      addRatingPrompt(d.sessionId)
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