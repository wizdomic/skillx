import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { recommendationApi, sessionApi, userApi } from '../api/index'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { Avatar, StarRating, Modal } from '../components/common/index'
import Loader from '../components/common/Loader'
import toast from 'react-hot-toast'

const PAGE_SIZE = 9

export default function DashboardPage() {
  const nav = useNavigate()
  const { user } = useAuthStore()
  const { ratingPrompts, dismissRatingPrompt } = useNotificationStore()

  const [matches, setMatches]           = useState([])
  const [page, setPage]                 = useState(1)
  const [totalPages, setTotalPages]     = useState(1)
  const [total, setTotal]               = useState(0)
  const [loading, setLoading]           = useState(true)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [sessionModal, setSessionModal] = useState(null)
  const [modalSkills, setModalSkills]   = useState([]) // teach skills for book modal
  const [loadingSkills, setLoadingSkills] = useState(false)
  const [form, setForm]                 = useState({ skillId:'', scheduledAt:'', notes:'' })
  const [booking, setBooking]           = useState(false)

  const loadMatches = useCallback(async (p = 1, append = false) => {
    if (p === 1) setLoading(true); else setLoadingMore(true)
    try {
      const { data } = await recommendationApi.get({ page: p, limit: PAGE_SIZE })
      const list = data.data.matches || []
      const meta = data.meta || {}
      setMatches(prev => append ? [...prev, ...list] : list)
      setTotalPages(meta.totalPages || 1)
      setTotal(meta.total || list.length)
      setPage(p)
    } catch { toast.error('Failed to load recommendations') }
    finally { setLoading(false); setLoadingMore(false) }
  }, [])

  useEffect(() => { loadMatches(1) }, [loadMatches])

  // Open book modal — always fetch fresh profile to guarantee skills are loaded
  const openBookModal = async (match) => {
    setSessionModal(match)
    setForm({ skillId: '', scheduledAt: '', notes: '' })

    // Use skills from match if already populated with names
    const fromMatch = (match.teachSkills || []).filter(ts => ts?.skillId?.name)
    if (fromMatch.length > 0) {
      setModalSkills(fromMatch)
      return
    }

    // Fallback: fetch fresh profile
    setLoadingSkills(true)
    try {
      const { data } = await userApi.getUser(match.user._id)
      const teach = (data.data.teachSkills || []).filter(ts => ts?.skillId?.name)
      setModalSkills(teach)
    } catch {
      setModalSkills([])
      toast.error('Could not load skills')
    } finally {
      setLoadingSkills(false)
    }
  }

  const handleBook = async () => {
    if (!form.skillId || !form.scheduledAt) {
      toast.error('Please select a skill and a date/time')
      return
    }
    setBooking(true)
    try {
      await sessionApi.create({
        teacherId:   sessionModal.user._id,
        skillId:     form.skillId,
        scheduledAt: form.scheduledAt,
        notes:       form.notes,
      })
      toast.success('Session request sent!')
      setSessionModal(null)
      setModalSkills([])
      setForm({ skillId:'', scheduledAt:'', notes:'' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request')
    } finally { setBooking(false) }
  }

  const minDT = new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Rating prompts */}
      {ratingPrompts.map(p => (
        <div key={p.sessionId}
          className="mb-4 p-3 rounded-xl flex items-center justify-between gap-3 flex-wrap"
          style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
          <p className="text-sm font-medium text-orange-600">
            ⭐ Session completed — leave a rating to help the community.
          </p>
          <div className="flex gap-2">
            <button onClick={() => nav('/sessions')} className="btn btn-primary btn-sm">Rate now</button>
            <button onClick={() => dismissRatingPrompt(p.sessionId)} className="btn btn-ghost btn-sm">Later</button>
          </div>
        </div>
      ))}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {total > 0 ? `${total} people match your skills` : 'Add skills to find matches'}
          </p>
        </div>
        <button onClick={() => nav('/skills')} className="btn btn-white btn-md">+ Add skills</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { icon:'🪙', value: user?.creditBalance ?? 0,  sub:'credits',  to:'/wallet' },
          { icon:'📅', value: user?.totalSessions ?? 0,  sub:'sessions', to:'/sessions' },
          {
            icon:'⭐',
            value: user?.ratingCount ? `${Number(user.averageRating).toFixed(1)}★` : '—',
            sub:   user?.ratingCount ? `${user.ratingCount} reviews` : 'no reviews',
            to:    `/ratings/${user?._id}`,
          },
        ].map(s => (
          <button key={s.sub} onClick={() => nav(s.to)}
            className="card p-4 flex items-center gap-3 transition-all text-left w-full"
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--border-2)'
              e.currentTarget.style.boxShadow   = 'var(--shadow-md)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.boxShadow   = 'var(--shadow)'
            }}>
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="font-bold text-xl leading-tight" style={{ color: 'var(--text)' }}>{s.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{s.sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Matches header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold" style={{ color: 'var(--text)' }}>Your matches</h2>
        {total > 0 && (
          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
            {matches.length} of {total} shown
          </span>
        )}
      </div>

      {loading ? <Loader /> : matches.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>No matches yet</h3>
          <p className="text-sm max-w-xs mx-auto mb-5" style={{ color: 'var(--text-muted)' }}>
            Add skills you can teach and want to learn — we'll find people who complement you.
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <button onClick={() => nav('/skills')}   className="btn btn-primary btn-md">Browse skills</button>
            <button onClick={() => nav('/requests')} className="btn btn-white btn-md">Skill board</button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match, i) => (
              <MatchCard
                key={match.user._id}
                match={match}
                index={i}
                onProfile={() => nav(`/profile/${match.user._id}`)}
                onMessage={e => { e.stopPropagation(); nav(`/chat/${match.user._id}`) }}
                onBook={e => { e.stopPropagation(); openBookModal(match) }}
              />
            ))}
          </div>

          {page < totalPages && (
            <div className="text-center mt-8">
              <button onClick={() => loadMatches(page + 1, true)} disabled={loadingMore}
                className="btn btn-white btn-lg">
                {loadingMore ? 'Loading…' : `Load more (${total - matches.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Book modal */}
      <Modal
        open={!!sessionModal}
        onClose={() => { setSessionModal(null); setModalSkills([]) }}
        title="Request a session">
        {sessionModal && (
          <div className="space-y-3">
            {/* User preview */}
            <button
              onClick={() => { setSessionModal(null); setModalSkills([]); nav(`/profile/${sessionModal.user._id}`) }}
              className="w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#f97316'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <Avatar src={sessionModal.user.avatarUrl} name={sessionModal.user.name} size={40} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                  {sessionModal.user.name}
                </p>
                <StarRating value={sessionModal.user.averageRating || 0} readonly size={13} />
              </div>
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>View profile →</span>
            </button>

            {/* Skill selector */}
            <div>
              <label className="label">Skill to learn *</label>
              {loadingSkills ? (
                <div className="flex items-center gap-2 py-2">
                  <div className="w-4 h-4 rounded-full border-2 border-t-orange-500 animate-spin"
                    style={{ borderColor: 'var(--border)', borderTopColor: '#f97316' }} />
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading skills…</span>
                </div>
              ) : modalSkills.length === 0 ? (
                <div className="p-3 rounded-lg text-sm"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  ⚠️ This user hasn't added any teach skills yet.
                </div>
              ) : (
                <select
                  className="input"
                  value={form.skillId}
                  onChange={e => setForm(f => ({ ...f, skillId: e.target.value }))}>
                  <option value="">Select a skill…</option>
                  {modalSkills.map(ts => (
                    <option key={ts._id} value={ts.skillId._id}>
                      {ts.skillId.name}{ts.level ? ` · ${ts.level}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Date/time */}
            <div>
              <label className="label">Date & time *</label>
              <input
                className="input"
                type="datetime-local"
                min={minDT}
                value={form.scheduledAt}
                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
              <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                Sessions are 60 minutes by default
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="label">Notes (optional)</label>
              <textarea
                className="input resize-none" rows={3}
                placeholder="Your experience level, goals, questions…"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div className="flex gap-2">
              <button
                className="btn btn-white btn-md flex-1"
                onClick={() => { setSessionModal(null); setModalSkills([]) }}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-md flex-1"
                onClick={handleBook}
                disabled={booking || loadingSkills || !modalSkills.length}>
                {booking ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ── Match Card ─────────────────────────────────────────────────────────────────
function MatchCard({ match, index, onProfile, onMessage, onBook }) {
  const { user, teachSkills = [], learnSkills = [], sharedSkillCount } = match
  const delay = Math.min(index, 4) + 1

  return (
    <div
      className={`fade-up-${delay} rounded-xl p-5 flex flex-col cursor-pointer transition-all duration-200`}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
      onClick={onProfile}
      onMouseEnter={e => {
        e.currentTarget.style.transform   = 'translateY(-2px)'
        e.currentTarget.style.borderColor = 'var(--border-2)'
        e.currentTarget.style.boxShadow   = 'var(--shadow-md)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform   = 'translateY(0)'
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow   = 'var(--shadow)'
      }}>

      {/* Avatar + match badge */}
      <div className="flex items-start justify-between mb-3">
        <Avatar src={user.avatarUrl} name={user.name} size={48} />
        <span className="badge-orange text-xs">
          {sharedSkillCount} match{sharedSkillCount !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Name + location */}
      <p className="font-bold text-base mb-0.5" style={{ color: 'var(--text)' }}>{user.name}</p>
      {user.location && (
        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>📍 {user.location}</p>
      )}

      {/* Rating */}
      <div className="flex items-center gap-1.5 mb-4">
        <StarRating value={user.averageRating || 0} readonly size={13} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {user.ratingCount > 0
            ? `${Number(user.averageRating).toFixed(1)} · ${user.ratingCount} review${user.ratingCount !== 1 ? 's' : ''}`
            : 'No reviews yet'}
        </span>
      </div>

      {/* Teaches */}
      {teachSkills.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
            style={{ color: 'var(--text-faint)' }}>🎓 Teaches</p>
          <div className="flex flex-wrap gap-1">
            {teachSkills.slice(0, 4).map((ts, i) => (
              <span key={i} className="badge-orange" style={{ fontSize: '11px' }}>
                {ts.skillId?.name || '—'}
              </span>
            ))}
            {teachSkills.length > 4 && (
              <span className="badge-gray" style={{ fontSize: '11px' }}>
                +{teachSkills.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Wants to learn */}
      {learnSkills.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
            style={{ color: 'var(--text-faint)' }}>📚 Wants to learn</p>
          <div className="flex flex-wrap gap-1">
            {learnSkills.slice(0, 4).map((ls, i) => (
              <span key={i} className="badge-blue" style={{ fontSize: '11px' }}>
                {ls.skillId?.name || '—'}
              </span>
            ))}
            {learnSkills.length > 4 && (
              <span className="badge-gray" style={{ fontSize: '11px' }}>
                +{learnSkills.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* No skills yet */}
      {teachSkills.length === 0 && learnSkills.length === 0 && (
        <p className="text-xs mb-4 italic" style={{ color: 'var(--text-faint)' }}>No skills added yet</p>
      )}

      {/* Bio */}
      {user.bio && (
        <p className="text-xs mb-4 line-clamp-2 italic" style={{ color: 'var(--text-muted)' }}>
          "{user.bio}"
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button onClick={onMessage}
          className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
          💬 Message
        </button>
        <button onClick={onBook}
          className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all bg-orange-500 text-white hover:bg-orange-600 active:scale-95">
          📅 Book
        </button>
      </div>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}