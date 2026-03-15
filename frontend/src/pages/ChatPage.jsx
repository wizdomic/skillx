import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { chatApi } from '../api/index'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { useSocket } from '../context/SocketContext'
import { Avatar } from '../components/common/index'
import { IconSend, IconSearch } from '../components/common/AppLayout'
import Loader from '../components/common/Loader'
import toast from 'react-hot-toast'
import { format, isToday, isYesterday } from 'date-fns'

export default function ChatPage() {
  const { userId: activeId } = useParams()
  const nav = useNavigate()
  const { user } = useAuthStore()
  const { socket } = useSocket()
  const { setUnreadMessages } = useNotificationStore()

  const [convs, setConvs]               = useState([])
  const [messages, setMessages]         = useState([])
  const [input, setInput]               = useState('')
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs]   = useState(false)
  const [typing, setTyping]             = useState(false)
  const [partner, setPartner]           = useState(null)
  const [sending, setSending]           = useState(false)
  const [search, setSearch]             = useState('')

  const endRef      = useRef(null)
  const typingTimer = useRef(null)
  const activeIdRef = useRef(activeId)

  useEffect(() => { activeIdRef.current = activeId }, [activeId])

  const refreshConvs = useCallback(() =>
    chatApi.getConversationList()
      .then(({ data }) => setConvs(data.data.conversations || []))
      .catch(() => {}), [])

  useEffect(() => { refreshConvs().finally(() => setLoadingConvs(false)) }, [])

  useEffect(() => {
    if (!activeId) { setMessages([]); setPartner(null); return }
    setLoadingMsgs(true)
    chatApi.getConversation(activeId)
      .then(({ data }) => {
        setMessages(data.data.messages || [])
        const c = convs.find(c => c.partner?._id === activeId)
        if (c?.partner) setPartner(c.partner)
        chatApi.getUnreadCount()
          .then(({ data: d }) => setUnreadMessages(d.data.unreadCount || 0))
          .catch(() => {})
      })
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoadingMsgs(false))
  }, [activeId])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (!socket) return
    const onMsg = msg => {
      if (msg.senderId === activeIdRef.current) {
        setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [
          ...prev,
          { _id: msg._id || `s_${Date.now()}`, senderId: msg.senderId, content: msg.content, createdAt: msg.createdAt || new Date().toISOString(), isRead: true }
        ])
      }
      refreshConvs()
      chatApi.getUnreadCount().then(({ data }) => setUnreadMessages(data.data.unreadCount || 0)).catch(() => {})
    }
    const onTyping = ({ senderId }) => {
      if (senderId === activeIdRef.current) {
        setTyping(true)
        clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => setTyping(false), 2500)
      }
    }
    socket.on('chat:receive', onMsg)
    socket.on('chat:typing', onTyping)
    return () => { socket.off('chat:receive', onMsg); socket.off('chat:typing', onTyping) }
  }, [socket, refreshConvs])

  const send = async () => {
    if (!input.trim() || !activeId || sending) return
    const content = input.trim()
    setInput('')
    setSending(true)
    const tempId = `tmp_${Date.now()}`
    setMessages(prev => [...prev, { _id: tempId, senderId: user._id, content, createdAt: new Date().toISOString(), isTemp: true }])
    try {
      const { data } = await chatApi.send({ receiverId: activeId, content })
      const real = data.data?.message
      setMessages(prev => prev.map(m => m._id === tempId ? { ...(real || m), _id: real?._id || tempId, isTemp: false } : m))
      if (socket) socket.emit('chat:send', { receiverId: activeId, content, tempId })
      refreshConvs()
    } catch {
      setMessages(prev => prev.filter(m => m._id !== tempId))
      toast.error('Failed to send')
    } finally { setSending(false) }
  }

  const emitTyping = () => { if (socket && activeId) socket.emit('chat:typing', { receiverId: activeId }) }

  const filtered = convs.filter(c => c.partner?.name?.toLowerCase().includes(search.toLowerCase()))

  const fmtTime = d => {
    if (!d) return ''
    const dt = new Date(d)
    if (isToday(dt)) return format(dt, 'h:mm a')
    if (isYesterday(dt)) return 'Yesterday'
    return format(dt, 'MMM d')
  }

  const fmtDate = d => {
    if (!d) return ''
    const dt = new Date(d)
    if (isToday(dt)) return 'Today'
    if (isYesterday(dt)) return 'Yesterday'
    return format(dt, 'MMMM d, yyyy')
  }

  return (
    <div className="flex" style={{ height: 'calc(100vh - 56px)', background: 'var(--bg)' }}>

      {/* ── Conversation list ─────────────────────────────────────── */}
      <div className={`w-72 flex-shrink-0 flex flex-col
        ${activeId ? 'hidden md:flex' : 'flex w-full md:w-72'}`}
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>

        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-bold mb-3" style={{ color: 'var(--text)' }}>Messages</h2>
          <div className="relative">
            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-faint)' }} />
            <input className="input pl-8 py-2" placeholder="Search…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? <Loader /> : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm" style={{ color: 'var(--text-faint)' }}>
              {search ? 'No results' : 'No conversations yet.\nBook a session to start chatting!'}
            </div>
          ) : filtered.map(c => {
            const isActive = activeId === c.partner?._id
            return (
              <button key={c.partner?._id} onClick={() => nav(`/chat/${c.partner?._id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                style={{
                  background: isActive ? 'var(--accent-bg)' : 'transparent',
                  borderRight: isActive ? '2px solid #f97316' : '2px solid transparent',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-2)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                <div className="relative flex-shrink-0">
                  <Avatar src={c.partner?.avatarUrl} name={c.partner?.name} size={38} />
                  {c.unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                      {c.unreadCount > 9 ? '9+' : c.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm truncate font-medium"
                      style={{ color: 'var(--text)', fontWeight: c.unreadCount > 0 ? 600 : 500 }}>
                      {c.partner?.name}
                    </p>
                    <span className="text-[11px] ml-2 flex-shrink-0" style={{ color: 'var(--text-faint)' }}>
                      {fmtTime(c.lastMessage?.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs truncate mt-0.5"
                    style={{ color: c.unreadCount > 0 ? 'var(--text-2)' : 'var(--text-faint)' }}>
                    {c.lastMessage?.senderId === user._id || c.lastMessage?.senderId?._id === user._id ? 'You: ' : ''}
                    {c.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Chat area ─────────────────────────────────────────────── */}
      {activeId ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
            style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            <button onClick={() => nav('/chat')} className="md:hidden hover:opacity-70 transition-opacity mr-1"
              style={{ color: 'var(--text-muted)' }}>←</button>
            <Avatar src={partner?.avatarUrl} name={partner?.name} size={34} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
                {partner?.name || '…'}
              </p>
              {typing
                ? <p className="text-xs text-orange-500 animate-pulse">typing…</p>
                : <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Online</p>
              }
            </div>
            {partner && (
              <button onClick={() => nav(`/profile/${partner._id}`)}
                className="btn btn-white btn-sm text-xs flex-shrink-0">
                Profile
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4" style={{ background: 'var(--bg)' }}>
            {loadingMsgs ? <Loader /> : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-4xl mb-2">👋</div>
                  <p className="font-semibold" style={{ color: 'var(--text)' }}>Start the conversation</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-faint)' }}>
                    Say hi to {partner?.name || 'them'}!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {messages.map((msg, i) => {
                  const isMe = msg.senderId === user._id || msg.senderId?._id === user._id
                  const prev = messages[i - 1]
                  const showDate = i === 0 || fmtDate(prev?.createdAt) !== fmtDate(msg.createdAt)
                  const grouped = !showDate && prev &&
                    (prev.senderId === msg.senderId || prev.senderId?._id === (msg.senderId?._id || msg.senderId))

                  return (
                    <div key={msg._id}>
                      {showDate && (
                        <div className="text-center my-4">
                          <span className="text-xs px-3 py-1 rounded-full"
                            style={{ background: 'var(--surface-2)', color: 'var(--text-faint)' }}>
                            {fmtDate(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${grouped ? 'mt-0.5' : 'mt-3'}`}>
                        <div
                          className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm ${msg.isTemp ? 'opacity-60' : ''}`}
                          style={isMe ? {
                            background: '#f97316',
                            color: '#fff',
                            borderBottomRightRadius: '4px',
                          } : {
                            background: 'var(--surface)',
                            color: 'var(--text)',
                            border: '1px solid var(--border)',
                            borderBottomLeftRadius: '4px',
                          }}>
                          <p className="leading-relaxed">{msg.content}</p>
                          <p className="text-[11px] mt-1"
                            style={{ color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--text-faint)' }}>
                            {format(new Date(msg.createdAt), 'h:mm a')}
                            {msg.isTemp && ' · sending'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={endRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-4 py-3 flex-shrink-0"
            style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
            <div className="flex gap-2 items-end">
              <textarea
                className="input resize-none flex-1 py-2.5 text-sm"
                rows={1} placeholder="Type a message…"
                value={input}
                onChange={e => { setInput(e.target.value); emitTyping() }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                style={{ maxHeight: 96, overflowY: 'auto' }}
              />
              <button onClick={send} disabled={!input.trim() || sending}
                className="btn btn-primary w-10 h-10 p-0 rounded-xl flex-shrink-0">
                <IconSend size={15} />
              </button>
            </div>
            <p className="text-[11px] mt-1 ml-1" style={{ color: 'var(--text-faint)' }}>
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center"
          style={{ background: 'var(--bg)' }}>
          <div className="text-center">
            <div className="text-5xl mb-3">💬</div>
            <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Your messages</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Select a conversation to start chatting
            </p>
          </div>
        </div>
      )}
    </div>
  )
}