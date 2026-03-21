import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'
import { useThemeStore } from '../../store/themeStore'
import { sessionApi, chatApi, userApi } from '../../api/index'
import { Avatar } from './index'
import toast from 'react-hot-toast'

function IC({ d, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

export function IconGrid(p)     { return <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> }
export function IconCalendar(p) { return <IC size={p.size} d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" /> }
export function IconChat(p)     { return <IC size={p.size} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /> }
export function IconBoard(p)    { return <IC size={p.size} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> }
export function IconWallet(p)   { return <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="16" cy="12" r="1" fill="currentColor" stroke="none"/></svg> }
export function IconStar(p)     { return <IC size={p.size} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /> }
export function IconSearch(p)   { return <IC size={p.size} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /> }
export function IconSend(p)     { return <IC size={p.size} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /> }
export function IconVideo(p)    { return <IC size={p.size} d="M15 10l4.55-2.28A1 1 0 0121 8.72v6.56a1 1 0 01-1.45.9L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /> }
export function IconCheck(p)    { return <IC size={p.size} d="M20 6L9 17l-5-5" /> }
export function IconX(p)        { return <IC size={p.size} d="M18 6L6 18M6 6l12 12" /> }
export function IconPlus(p)     { return <IC size={p.size} d="M12 5v14M5 12h14" /> }
export function IconEdit(p)     { return <IC size={p.size} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /> }
export function IconCoin(p)     { return <IC size={p.size} d="M12 2a10 10 0 100 20A10 10 0 0012 2z" /> }
export function IconMenu(p)     { return <IC size={p.size} d="M3 12h18M3 6h18M3 18h18" /> }
export function IconLogout(p)   { return <IC size={p.size} d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /> }
export function IconFilter(p)   { return <IC size={p.size} d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /> }
export function IconExternalLink(p) { return <IC size={p.size} d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /> }
export function IconPeople(p)   { return <IC size={p.size} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /> }
export function IconBell(p)     { return <IC size={p.size} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /> }

function IconSun({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
}
function IconMoon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
}

// Bottom nav — 5 most important items for mobile
const BOTTOM_NAV = [
  { to: '/dashboard', label: 'Home',     Icon: IconGrid },
  { to: '/sessions',  label: 'Sessions', Icon: IconCalendar, badge: 'sessions' },
  { to: '/chat',      label: 'Chat',     Icon: IconChat,     badge: 'messages' },
  { to: '/requests',  label: 'Board',    Icon: IconBoard },
  { to: '/skills',    label: 'Skills',   Icon: IconStar },
]

// Sidebar nav — all items for desktop
const SIDEBAR_NAV = [
  { to: '/dashboard', label: 'Dashboard', Icon: IconGrid },
  { to: '/sessions',  label: 'Sessions',  Icon: IconCalendar, badge: 'sessions' },
  { to: '/chat',      label: 'Messages',  Icon: IconChat,     badge: 'messages' },
  { to: '/requests',  label: 'Board',     Icon: IconBoard },
  { to: '/wallet',    label: 'Wallet',    Icon: IconWallet },
  { to: '/skills',    label: 'Skills',    Icon: IconStar },
]

// ── Notification Bell ─────────────────────────────────────────────────────────
function NotificationBell() {
  const navigate = useNavigate()
  const { notifications, markAllRead, deleteNotification, clearAllNotifications } = useNotificationStore()
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const ref    = useRef(null)
  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropPos({ top: rect.top, left: rect.right + 8 })
    }
    setOpen(o => !o)
    if (!open && unread > 0) markAllRead()
  }

  const icons = { session_request:'📅', session_accepted:'✅', session_cancelled:'❌', meeting_link:'🔗', reminder:'⏰', rate_prompt:'⭐' }

  return (
    <div ref={ref}>
      <button ref={btnRef} onClick={handleOpen}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)' }}
        onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-muted)' }}>
        <span style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
          <IconBell size={16} />
          {unread > 0 && (
            <span style={{ position:'absolute', top:'-5px', right:'-5px', minWidth:'14px', height:'14px', borderRadius:'7px', background:'var(--brand)', color:'#fff', fontSize:'9px', fontWeight:700, padding:'0 3px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </span>
        <span className="flex-1 text-left">Notifications</span>
      </button>

      {open && (
        <div style={{ position:'fixed', top:`${dropPos.top}px`, left:`${dropPos.left}px`, transform:'translateY(-100%) translateY(-8px)', width:'300px', zIndex:9999, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', boxShadow:'var(--shadow-md)', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <p style={{ fontWeight:500, fontSize:'14px', color:'var(--text)', margin:0 }}>Notifications</p>
            {notifications.length > 0 && <button onClick={clearAllNotifications} style={{ fontSize:'11px', color:'var(--text-faint)', cursor:'pointer', background:'none', border:'none', padding:0 }}>Clear all</button>}
          </div>
          <div style={{ maxHeight:'340px', overflowY:'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding:'28px 16px', textAlign:'center' }}><p style={{ fontSize:'13px', color:'var(--text-faint)', margin:0 }}>No notifications yet</p></div>
            ) : notifications.map(n => (
              <div key={n.id}
                style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)', background: n.read ? 'transparent' : 'var(--brand-bg)', display:'flex', gap:'10px', alignItems:'flex-start', cursor: n.sessionId ? 'pointer' : 'default' }}
                onMouseEnter={e => { if (n.sessionId) e.currentTarget.style.background = 'var(--surface-2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = n.read ? 'transparent' : 'var(--brand-bg)' }}
                onClick={() => { if (n.sessionId) { navigate('/sessions'); setOpen(false) } }}>
                <span style={{ fontSize:'16px', flexShrink:0, lineHeight:'20px' }}>{icons[n.type] || '🔔'}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:'13px', fontWeight:500, color:'var(--text)', margin:0, lineHeight:'1.4' }}>{n.title}</p>
                  <p style={{ fontSize:'12px', color:'var(--text-muted)', margin:'2px 0 0', lineHeight:'1.4' }}>{n.body}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteNotification(n.id) }} style={{ color:'var(--text-faint)', flexShrink:0, fontSize:'18px', lineHeight:1, cursor:'pointer', background:'none', border:'none', padding:'0 0 0 4px', marginTop:'-1px' }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── People Search ─────────────────────────────────────────────────────────────
function PeopleSearch({ open, onClose }) {
  const nav = useNavigate()
  const [q, setQ]           = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const timer    = useRef(null)

  useEffect(() => {
    if (open) { setQ(''); setResults([]); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [open])

  useEffect(() => {
    clearTimeout(timer.current)
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    timer.current = setTimeout(async () => {
      try {
        const { data } = await userApi.searchUsers(q)
        setResults(data.data.users || [])
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 300)
  }, [q])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
      style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <IconSearch size={16} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
          <input ref={inputRef} className="flex-1 text-sm bg-transparent outline-none" style={{ color: 'var(--text)' }}
            placeholder="Search by name or @username…" value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && onClose()} />
          {q && <button onClick={() => setQ('')} style={{ color: 'var(--text-faint)' }}><IconX size={14} /></button>}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading && <div className="p-4 text-center text-sm" style={{ color: 'var(--text-faint)' }}>Searching…</div>}
          {!loading && q.length >= 2 && results.length === 0 && <div className="p-6 text-center"><p className="text-sm" style={{ color: 'var(--text-muted)' }}>No users found for "{q}"</p></div>}
          {!loading && q.length < 2 && <div className="p-4 text-center text-xs" style={{ color: 'var(--text-faint)' }}>Type at least 2 characters · Use @username to search by handle</div>}
          {results.map(u => (
            <button key={u._id} className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
              style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => { nav(`/profile/${u._id}`); onClose() }}>
              <Avatar src={u.avatarUrl} name={u.name} size={38} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{u.name}</p>
                {u.username && <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>@{u.username}</p>}
              </div>
              {u.ratingCount > 0 && (
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold" style={{ color: 'var(--brand)' }}>★ {Number(u.averageRating).toFixed(1)}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{u.totalSessions} sessions</p>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Layout ───────────────────────────────────────────────────────────────
export default function AppLayout() {
  const { user, logout }    = useAuthStore()
  const { unreadMessages, pendingSessions, setUnreadMessages, setPendingSessions } = useNotificationStore()
  const { dark, toggle }    = useThemeStore()
  const navigate            = useNavigate()
  const location            = useLocation()
  const [search, setSearch] = useState(false)

  useEffect(() => {
    chatApi.getUnreadCount().then(({ data }) => setUnreadMessages(data.data.unreadCount || 0)).catch(() => {})
    sessionApi.list({ status: 'pending' })
      .then(({ data }) => {
        const mine = (data.data.sessions || []).filter(s => s.teacherId?._id === user?._id || s.teacherId === user?._id)
        setPendingSessions(mine.length)
      }).catch(() => {})
  }, [user?._id])

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out')
    navigate('/login')
  }

  const getBadge = key => {
    if (key === 'messages') return unreadMessages
    if (key === 'sessions') return pendingSessions
    return 0
  }

  const hoverOn  = e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)' }
  const hoverOff = e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-muted)' }

  // Never hide bottom nav - chat page works with it too
  const isChatPage = false

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0"
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>

        {/* Logo */}
        <NavLink to="/dashboard" className="flex items-center gap-2.5 px-4 h-14 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)', textDecoration: 'none' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand)' }}>
            <span className="text-white font-bold text-xs">S</span>
          </div>
          <span className="font-bold" style={{ color: 'var(--text)' }}>SkillX</span>
        </NavLink>

        {/* Search */}
        <div className="px-3 pt-3">
          <button onClick={() => setSearch(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <IconSearch size={14} />
            <span className="flex-1 text-left text-xs">Find people…</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--border)', color: 'var(--text-faint)' }}>⌘K</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto mt-1">
          {SIDEBAR_NAV.map(({ to, label, Icon, badge }) => {
            const count = badge ? getBadge(badge) : 0
            return (
              <NavLink key={to} to={to}
                className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? '' : ''}`}
                style={({ isActive }) => isActive
                  ? { background: 'var(--brand-bg)', color: 'var(--brand)', border: '1px solid var(--brand-border)' }
                  : { color: 'var(--text-muted)' }}
                onMouseEnter={e => { if (!e.currentTarget.style.color.includes('var(--brand)')) hoverOn(e) }}
                onMouseLeave={e => { if (!e.currentTarget.style.color.includes('var(--brand)')) hoverOff(e) }}>
                <Icon size={16} />
                <span className="flex-1">{label}</span>
                {count > 0 && (
                  <span className="text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    style={{ background: badge === 'sessions' ? '#fef08a' : 'var(--brand)', color: badge === 'sessions' ? '#713f12' : '#fff' }}>
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 space-y-0.5" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={toggle}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
            {dark ? <IconSun size={15} /> : <IconMoon size={15} />}
            <span className="flex-1">{dark ? 'Light mode' : 'Dark mode'}</span>
            <div className="w-8 h-4 rounded-full flex items-center px-0.5 transition-colors duration-200" style={{ background: dark ? 'var(--brand)' : 'var(--border-2)' }}>
              <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform duration-200 ${dark ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>

          <NotificationBell />

          <button onClick={() => navigate(`/profile/${user?._id}`)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left"
            style={{ color: 'var(--text-muted)' }} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
            <Avatar src={user?.avatarUrl} name={user?.name} size={28} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{user?.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>
                {user?.username ? `@${user.username}` : `${user?.creditBalance ?? 0} credits`}
              </p>
            </div>
          </button>

          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-muted)' }}>
            <IconLogout size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 flex-shrink-0"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <NavLink to="/dashboard" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--brand)' }}>
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>SkillX</span>
          </NavLink>

          <div className="flex items-center gap-1">
            <button onClick={() => setSearch(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <IconSearch size={18} />
            </button>

            <MobileNotifButton />

            <button onClick={toggle}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
            </button>

            <button onClick={() => navigate(`/profile/${user?._id}`)}
              className="w-9 h-9 flex items-center justify-center rounded-xl">
              <Avatar src={user?.avatarUrl} name={user?.name} size={28} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 min-h-0"
          style={{ overflowY: 'auto', paddingBottom: '64px' }}>
          <Outlet />
        </main>

        {/* ── Mobile bottom tab bar ─────────────────────────────────────── */}
        <nav className="lg:hidden flex-shrink-0"
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}>
          <div className="flex">
            {BOTTOM_NAV.map(({ to, label, Icon, badge }) => {
              const count   = badge ? getBadge(badge) : 0
              const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to))
                return (
                  <NavLink key={to} to={to}
                    className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all active:scale-95"
                    style={{ color: isActive ? 'var(--brand)' : 'var(--text-faint)', minHeight: '52px' }}>
                    <span style={{ position: 'relative', display: 'inline-flex' }}>
                      <Icon size={22} />
                      {count > 0 && (
                        <span style={{
                          position: 'absolute', top: '-4px', right: '-6px',
                          minWidth: '14px', height: '14px', borderRadius: '7px',
                          background: 'var(--brand)', color: '#fff',
                          fontSize: '9px', fontWeight: 700, padding: '0 3px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {count > 9 ? '9+' : count}
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 400, lineHeight: 1 }}>
                      {label}
                    </span>
                    {isActive && (
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--brand)', marginTop: '1px' }} />
                    )}
                  </NavLink>
                )
              })}
            </div>
          </nav>
      </div>

      <PeopleSearch open={search} onClose={() => setSearch(false)} />
    </div>
  )
}

// Mobile notification button — sheet style
function MobileNotifButton() {
  const navigate = useNavigate()
  const { notifications, markAllRead, deleteNotification, clearAllNotifications } = useNotificationStore()
  const [open, setOpen] = useState(false)
  const unread = notifications.filter(n => !n.read).length
  const icons  = { session_request:'📅', session_accepted:'✅', session_cancelled:'❌', meeting_link:'🔗', reminder:'⏰', rate_prompt:'⭐' }

  const handleOpen = () => { setOpen(true); if (unread > 0) markAllRead() }

  return (
    <>
      <button onClick={handleOpen}
        className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
        style={{ color: 'var(--text-muted)', position: 'relative' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <IconBell size={18} />
        {unread > 0 && (
          <span style={{ position:'absolute', top:'4px', right:'4px', width:'8px', height:'8px', borderRadius:'50%', background:'var(--brand)' }} />
        )}
      </button>

      {/* Bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl overflow-hidden"
            style={{ background: 'var(--surface)', maxHeight: '80vh' }}
            onClick={e => e.stopPropagation()}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--border-2)' }} />
            </div>
            <div className="flex items-center justify-between px-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>Notifications</p>
              {notifications.length > 0 && (
                <button onClick={clearAllNotifications} style={{ fontSize: '13px', color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Clear all
                </button>
              )}
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 'calc(80vh - 80px)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-2xl mb-2">🔔</p>
                  <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No notifications yet</p>
                </div>
              ) : notifications.map(n => (
                <div key={n.id}
                  style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: n.read ? 'transparent' : 'var(--brand-bg)', display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: n.sessionId ? 'pointer' : 'default' }}
                  onClick={() => { if (n.sessionId) { navigate('/sessions'); setOpen(false) } }}>
                  <span style={{ fontSize: '20px', flexShrink: 0, lineHeight: '24px' }}>{icons[n.type] || '🔔'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', margin: 0 }}>{n.title}</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '3px 0 0' }}>{n.body}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteNotification(n.id) }} style={{ color: 'var(--text-faint)', fontSize: '20px', lineHeight: 1, cursor: 'pointer', background: 'none', border: 'none', padding: 0, flexShrink: 0 }}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}