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

const isRealId = (id) => /^[a-f\d]{24}$/i.test(String(id || ''))

function MsgMenu({ x, y, canDelete, onCopy, onDelete, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('touchstart', close) }
  }, [onClose])
  const w = 164, h = canDelete ? 90 : 46
  const left = Math.min(x, window.innerWidth  - w - 8)
  const top  = Math.min(y, window.innerHeight - h - 8)
  return (
    <div ref={ref} className="fixed z-[100] rounded-xl overflow-hidden"
      style={{ left, top, minWidth: w, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 8px 30px rgba(0,0,0,0.18)' }}>
      <button onClick={onCopy}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors"
        style={{ color: 'var(--text)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
        onMouseLeave={e => e.currentTarget.style.background = ''}>
        <span>📋</span> Copy text
      </button>
      {canDelete && (
        <>
          <div style={{ height: 1, background: 'var(--border)' }} />
          <button onClick={onDelete}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors"
            style={{ color: '#ef4444' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}>
            <span>🗑️</span> Delete
          </button>
        </>
      )}
    </div>
  )
}

export default function ChatPage() {
  const { userId: activeId } = useParams()
  const nav                  = useNavigate()
  const { user }             = useAuthStore()
  const { socket }           = useSocket()
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
  const [menu, setMenu]                 = useState(null)
  const [hoveredConv, setHoveredConv]   = useState(null)

  const endRef         = useRef(null)
  const typingTimer    = useRef(null)
  const longPressTimer = useRef(null)
  const activeIdRef    = useRef(activeId)
  const textareaRef    = useRef(null)

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
        chatApi.getUnreadCount().then(({ data: d }) => setUnreadMessages(d.data.unreadCount || 0)).catch(() => {})
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
          { _id: msg._id || `s_${Date.now()}`, senderId: msg.senderId, content: msg.content, createdAt: msg.createdAt || new Date().toISOString(), isRead: true, deletedBySender: false }
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
    const onDeleted = ({ messageId }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, deletedBySender: true, content: '' } : m))
      refreshConvs()
    }
    socket.on('chat:receive', onMsg)
    socket.on('chat:typing', onTyping)
    socket.on('chat:message_deleted', onDeleted)
    return () => {
      socket.off('chat:receive', onMsg)
      socket.off('chat:typing', onTyping)
      socket.off('chat:message_deleted', onDeleted)
    }
  }, [socket, refreshConvs])

  const deleteConv = async (e, pid, pname) => {
    e.stopPropagation()
    if (!window.confirm(`Delete conversation with ${pname}? This only affects your view.`)) return
    try {
      await chatApi.deleteConversation(pid)
      setConvs(prev => prev.filter(c => c.partner?._id !== pid))
      if (activeId === pid) nav('/chat')
      chatApi.getUnreadCount().then(({ data }) => setUnreadMessages(data.data.unreadCount || 0)).catch(() => {})
      toast.success('Conversation deleted.')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const openMenu = (e, msg) => {
    e.preventDefault(); e.stopPropagation()
    setMenu({ x: e.clientX ?? e.touches?.[0]?.clientX ?? 0, y: e.clientY ?? e.touches?.[0]?.clientY ?? 0, msg })
  }
  const startLP = (e, msg) => { longPressTimer.current = setTimeout(() => openMenu(e, msg), 480) }
  const stopLP  = () => clearTimeout(longPressTimer.current)

  const doDeleteMsg = async () => {
    if (!menu) return
    const { msg } = menu
    setMenu(null)
    if (!isRealId(msg._id)) { toast.error('Message is still sending, please wait.'); return }
    try {
      await chatApi.deleteMessage(msg._id)
      setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, deletedBySender: true, content: '' } : m))
      if (socket && activeId) socket.emit('chat:delete_message', { receiverId: activeId, messageId: msg._id })
      refreshConvs()
    } catch (err) { toast.error(err.response?.data?.message || 'Could not delete') }
  }

  const doCopy = () => {
    if (!menu) return
    navigator.clipboard.writeText(menu.msg.content || '').then(() => toast.success('Copied!'))
    setMenu(null)
  }

  const send = async () => {
    if (!input.trim() || !activeId || sending) return
    const content = input.trim()
    setInput('')
    if (textareaRef.current) { textareaRef.current.style.height = 'auto' }
    setSending(true)
    const tempId = `tmp_${Date.now()}`
    setMessages(prev => [...prev, { _id: tempId, senderId: user._id, content, createdAt: new Date().toISOString(), isTemp: true, deletedBySender: false }])
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

  const autoResize = (e) => {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

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
    // flex-1 fills the flex-column <main> reliably on all browsers
    <div className="flex overflow-hidden" style={{ background: 'var(--bg)', height: 'calc(100dvh - 56px - 64px)' }}>

      {menu && (
        <MsgMenu
          x={menu.x} y={menu.y}
          canDelete={
            isRealId(menu.msg._id) &&
            !menu.msg.deletedBySender &&
            !menu.msg.isTemp &&
            (menu.msg.senderId === user._id || menu.msg.senderId?._id === user._id)
          }
          onCopy={doCopy} onDelete={doDeleteMsg} onClose={() => setMenu(null)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <div className={`flex-shrink-0 flex flex-col transition-all
        ${activeId ? 'hidden md:flex md:w-72' : 'flex w-full md:w-72'}`}
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>

        <div className="p-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-bold text-base mb-3" style={{ color: 'var(--text)' }}>Messages</h2>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-faint)' }}>
              <IconSearch size={13} />
            </span>
            <input className="input pl-8 py-2 text-sm" placeholder="Search conversations…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? <Loader /> : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 px-6 text-center gap-2">
              <span className="text-3xl">💬</span>
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                {search ? 'No results found' : 'No conversations yet'}
              </p>
            </div>
          ) : filtered.map(c => {
            const isActive  = activeId === c.partner?._id
            const isHov     = hoveredConv === c.partner?._id
            const isDeleted = c.lastMessage?.deletedBySender
            const lastText  = isDeleted ? 'Message was deleted' : (c.lastMessage?.content || 'Say hello!')
            const isFromMe  = !isDeleted && (
              c.lastMessage?.senderId === user._id ||
              c.lastMessage?.senderId?._id === user._id
            )
            return (
              <div key={c.partner?._id} className="relative"
                onMouseEnter={() => setHoveredConv(c.partner?._id)}
                onMouseLeave={() => setHoveredConv(null)}>
                <button
                  onClick={() => nav(`/chat/${c.partner?._id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                  style={{
                    background:  isActive ? 'var(--brand-bg)' : isHov ? 'var(--surface-2)' : 'transparent',
                    borderRight: isActive ? '2px solid var(--brand)' : '2px solid transparent',
                    paddingRight: isHov ? '2.75rem' : undefined,
                  }}>
                  <div className="relative flex-shrink-0">
                    <Avatar src={c.partner?.avatarUrl} name={c.partner?.name} size={40} />
                    {c.unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-white text-[9px] rounded-full flex items-center justify-center font-bold"
                        style={{ background: 'var(--brand)' }}>
                        {c.unreadCount > 9 ? '9+' : c.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-sm truncate font-semibold" style={{ color: 'var(--text)' }}>
                        {c.partner?.name}
                      </p>
                      <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-faint)' }}>
                        {fmtTime(c.lastMessage?.createdAt)}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${isDeleted ? 'italic' : ''}`}
                      style={{ color: c.unreadCount > 0 ? 'var(--text-2)' : 'var(--text-faint)', fontWeight: c.unreadCount > 0 ? 600 : 400 }}>
                      {isFromMe && !isDeleted && <span style={{ color: 'var(--brand)' }}>You: </span>}
                      {lastText}
                    </p>
                  </div>
                </button>

                {isHov && (
                  <button
                    onClick={e => deleteConv(e, c.partner?._id, c.partner?.name)}
                    title="Delete conversation"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-faint)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = '#ef4444' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-faint)' }}>
                    🗑️
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Chat pane ────────────────────────────────────────────────── */}
      {activeId ? (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Header — FIX 2: reserve fixed height so typing indicator never shifts layout */}
          <div className="flex items-center gap-3 px-4 flex-shrink-0"
            style={{ height: 56, background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            <button onClick={() => nav('/chat')} className="md:hidden p-1.5 rounded-lg mr-1 transition-all"
              style={{ color: 'var(--text-muted)', background: 'var(--surface-2)' }}>←</button>
            <div className="relative flex-shrink-0">
              <Avatar src={partner?.avatarUrl} name={partner?.name} size={36} />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400"
                style={{ border: '2px solid var(--surface)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate leading-tight" style={{ color: 'var(--text)' }}>
                {partner?.name || '…'}
              </p>
              {/* FIX 2 cont: fixed line-height container — text swaps but height stays constant */}
              <p className="text-xs leading-tight h-4 overflow-hidden transition-colors"
                style={{ color: typing ? 'var(--brand)' : 'var(--text-faint)' }}>
                {typing ? 'typing…' : 'Online'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {partner && (
                <button onClick={() => nav(`/profile/${partner._id}`)} className="btn btn-white btn-sm text-xs">
                  Profile
                </button>
              )}
              {partner && (
                <button onClick={e => deleteConv(e, partner._id, partner.name)}
                  title="Delete conversation" className="btn btn-danger btn-sm text-xs">
                  🗑️
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-4 px-3 sm:px-5" style={{ background: 'var(--bg)' }}>
            {loadingMsgs ? <Loader /> : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: 'var(--surface-2)' }}>👋</div>
                <div className="text-center">
                  <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Start a conversation</p>
                  <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
                    Say something nice to {partner?.name || 'them'}!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-0.5">
                {messages.map((msg, i) => {
                  const isMe      = msg.senderId === user._id || msg.senderId?._id === user._id
                  const prev      = messages[i - 1]
                  const next      = messages[i + 1]
                  const prevSame  = prev && (prev.senderId === msg.senderId || prev.senderId?._id === (msg.senderId?._id || msg.senderId))
                  const nextSame  = next && (next.senderId === msg.senderId || next.senderId?._id === (msg.senderId?._id || msg.senderId))
                  const showDate  = i === 0 || fmtDate(prev?.createdAt) !== fmtDate(msg.createdAt)
                  const isFirst   = !prevSame || showDate
                  const isLast    = !nextSame
                  const isDeleted = msg.deletedBySender

                  const radius = 18, small = 4
                  const borderRadius = isMe
                    ? `${radius}px ${isFirst ? radius : small}px ${isLast ? small : radius}px ${radius}px`
                    : `${isFirst ? radius : small}px ${radius}px ${radius}px ${isLast ? small : radius}px`

                  return (
                    <div key={msg._id}>
                      {showDate && (
                        <div className="flex items-center justify-center my-5">
                          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                          <span className="mx-3 text-[11px] font-medium px-2" style={{ color: 'var(--text-faint)' }}>
                            {fmtDate(msg.createdAt)}
                          </span>
                          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                        </div>
                      )}

                      <div className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${isFirst ? 'mt-3' : 'mt-0.5'}`}>
                        {!isMe && (
                          <div className="w-7 flex-shrink-0 self-end mb-1">
                            {isLast ? <Avatar src={partner?.avatarUrl} name={partner?.name} size={26} /> : null}
                          </div>
                        )}

                        {isDeleted ? (
                          <div className="px-3.5 py-2 text-xs italic"
                            style={{ background: 'var(--surface-2)', color: 'var(--text-faint)', border: '1px solid var(--border)', borderRadius }}>
                            🚫 Message deleted
                          </div>
                        ) : (
                          <div
                            className={`relative group max-w-[72%] sm:max-w-[60%] px-3.5 py-2.5 text-sm break-words select-text cursor-default ${msg.isTemp ? 'opacity-70' : ''}`}
                            style={{
                              borderRadius,
                              ...(isMe
                                ? { background: 'var(--brand)', color: '#fff' }
                                : { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }
                              )
                            }}
                            onContextMenu={e => { if (!msg.isTemp) openMenu(e, msg) }}
                            onTouchStart={e => { if (!msg.isTemp) startLP(e, msg) }}
                            onTouchEnd={stopLP} onTouchMove={stopLP}>
                            <p className="leading-relaxed">{msg.content}</p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-[10px]"
                                style={{ color: isMe ? 'rgba(255,255,255,0.5)' : 'var(--text-faint)' }}>
                                {format(new Date(msg.createdAt), 'h:mm a')}
                              </span>
                              {isMe && (
                                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                  {msg.isTemp ? '⏳' : msg.isRead ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {!isMe && !isLast && <div className="w-7 flex-shrink-0" />}
                      </div>
                    </div>
                  )
                })}
                <div ref={endRef} />
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="flex-shrink-0 px-4 py-3"
            style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
            <div className="flex items-end gap-2">
              <div className="flex-1 rounded-2xl overflow-hidden transition-all"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--brand)'}
                onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <textarea
                  ref={textareaRef}
                  className="w-full bg-transparent px-4 py-2.5 text-sm outline-none resize-none leading-relaxed"
                  style={{ color: 'var(--text)', minHeight: 42, maxHeight: 120 }}
                  placeholder="Type a message…" rows={1}
                  value={input}
                  onChange={e => { setInput(e.target.value); emitTyping(); autoResize(e) }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                />
              </div>
              <button onClick={send} disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 disabled:opacity-40"
                style={{ background: input.trim() ? 'var(--brand)' : 'var(--surface-2)' }}>
                <IconSend size={16} style={{ color: input.trim() ? '#fff' : 'var(--text-faint)' }} />
              </button>
            </div>
            <p className="text-[10px] mt-1.5 pl-1 hidden sm:block" style={{ color: 'var(--text-faint)' }}>
              Enter to send · Shift+Enter for new line · Right-click message to delete
            </p>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-4" style={{ background: 'var(--bg)' }}>
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
            style={{ background: 'var(--surface-2)' }}>💬</div>
          <div className="text-center">
            <p className="font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>Your messages</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Select a conversation from the list</p>
          </div>
        </div>
      )}
    </div>
  )
}