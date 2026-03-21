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
  const [modalSkills, setModalSkills]   = useState([])
  const [loadingSkills, setLoadingSkills] = useState(false)
  const [form, setForm]                 = useState({ skillId: '', scheduledAt: '', notes: '' })
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
    } catch { toast.error('Failed to load') }
    finally { setLoading(false); setLoadingMore(false) }
  }, [])

  useEffect(() => { loadMatches(1) }, [loadMatches])

  const openBookModal = async (match) => {
    setSessionModal(match)
    setForm({ skillId: '', scheduledAt: '', notes: '' })
    const fromMatch = (match.teachSkills || []).filter(ts => ts?.skillId?.name)
    if (fromMatch.length > 0) { setModalSkills(fromMatch); return }
    setLoadingSkills(true)
    try {
      const { data } = await userApi.getUser(match.user._id)
      setModalSkills((data.data.teachSkills || []).filter(ts => ts?.skillId?.name))
    } catch { setModalSkills([]); toast.error('Could not load skills') }
    finally { setLoadingSkills(false) }
  }

  const handleBook = async () => {
    if (!form.skillId || !form.scheduledAt) { toast.error('Select a skill and time'); return }
    setBooking(true)
    try {
      await sessionApi.create({ teacherId: sessionModal.user._id, skillId: form.skillId, scheduledAt: form.scheduledAt, notes: form.notes })
      toast.success('Session request sent!')
      setSessionModal(null); setModalSkills([]); setForm({ skillId: '', scheduledAt: '', notes: '' })
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setBooking(false) }
  }

  const minDT = new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px 16px 8px' }}>

      {/* Rating prompts */}
      {ratingPrompts.map(p => (
        <div key={p.sessionId} style={{
          marginBottom: 12, padding: '10px 14px', borderRadius: 10,
          background: 'var(--brand-bg)', border: '1px solid var(--brand-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap',
        }}>
          <p style={{ fontSize: 13, color: 'var(--brand)', margin: 0 }}>⭐ Session done — leave a rating</p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-primary btn-sm" onClick={() => nav('/sessions')}>Rate</button>
            <button className="btn btn-ghost btn-sm" onClick={() => dismissRatingPrompt(p.sessionId)}>Later</button>
          </div>
        </div>
      ))}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {total > 0 ? `${total} people match your skills` : 'Add skills to find matches'}
          </p>
        </div>
        <button className="btn btn-white btn-sm" onClick={() => nav('/skills')}>+ Skills</button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
        {[
          { icon: '🪙', value: user?.creditBalance ?? 0, sub: 'credits',  to: '/wallet' },
          { icon: '📅', value: user?.totalSessions ?? 0, sub: 'sessions', to: '/sessions' },
          {
            icon: '⭐',
            value: user?.ratingCount ? `${Number(user.averageRating).toFixed(1)}★` : '—',
            sub: user?.ratingCount ? `${user.ratingCount} reviews` : 'no reviews',
            to: `/ratings/${user?._id}`,
          },
        ].map(s => (
          <button key={s.sub} onClick={() => nav(s.to)} style={{
            padding: '12px 10px', borderRadius: 10, textAlign: 'center',
            background: 'var(--surface)', border: '1px solid var(--border)',
            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}>
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{s.value}</span>
            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{s.sub}</span>
          </button>
        ))}
      </div>

      {/* Matches */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontWeight: 600, color: 'var(--text)', margin: 0 }}>Your matches</p>
        {total > 0 && <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{matches.length}/{total}</span>}
      </div>

      {loading ? <Loader /> : matches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No matches yet</p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>Add skills you can teach and want to learn.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn btn-primary btn-md" onClick={() => nav('/skills')}>Browse skills</button>
            <button className="btn btn-white btn-md" onClick={() => nav('/requests')}>Skill board</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {matches.map(match => (
              <MatchCard key={match.user._id} match={match}
                onProfile={() => nav(`/profile/${match.user._id}`)}
                onMessage={e => { e.stopPropagation(); nav(`/chat/${match.user._id}`) }}
                onBook={e => { e.stopPropagation(); openBookModal(match) }} />
            ))}
          </div>
          {page < totalPages && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button className="btn btn-white btn-md" onClick={() => loadMatches(page + 1, true)} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : `Show more (${total - matches.length})`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Book modal */}
      <Modal open={!!sessionModal} onClose={() => { setSessionModal(null); setModalSkills([]) }} title="Request a session">
        {sessionModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <button onClick={() => { setSessionModal(null); setModalSkills([]); nav(`/profile/${sessionModal.user._id}`) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left' }}>
              <Avatar src={sessionModal.user.avatarUrl} name={sessionModal.user.name} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: 0 }}>{sessionModal.user.name}</p>
                <StarRating value={sessionModal.user.averageRating || 0} readonly size={12} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-faint)', flexShrink: 0 }}>Profile →</span>
            </button>

            <div>
              <label className="label">Skill to learn *</label>
              {loadingSkills ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading skills…</p>
              ) : modalSkills.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  ⚠️ This user hasn't added teach skills yet.
                </p>
              ) : (
                <select className="input" value={form.skillId} onChange={e => setForm(f => ({ ...f, skillId: e.target.value }))}>
                  <option value="">Select a skill…</option>
                  {modalSkills.map(ts => (
                    <option key={ts._id} value={ts.skillId._id}>{ts.skillId.name}{ts.level ? ` · ${ts.level}` : ''}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="label">Date & time *</label>
              <input className="input" type="datetime-local" min={minDT}
                value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
            </div>

            <div>
              <label className="label">Notes (optional)</label>
              <textarea className="input" style={{ resize: 'none' }} rows={2}
                placeholder="Your level, goals, questions…"
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-white btn-md" style={{ flex: 1 }} onClick={() => { setSessionModal(null); setModalSkills([]) }}>Cancel</button>
              <button className="btn btn-primary btn-md" style={{ flex: 1 }} onClick={handleBook}
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

function MatchCard({ match, onProfile, onMessage, onBook }) {
  const { user, teachSkills = [], learnSkills = [], sharedSkillCount } = match
  return (
    <div onClick={onProfile} style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: 14, cursor: 'pointer',
    }}>
      {/* Top */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Avatar src={user.avatarUrl} name={user.name} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{user.name}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: 'var(--brand-bg)', color: 'var(--brand)' }}>
              {sharedSkillCount} match
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StarRating value={user.averageRating || 0} readonly size={11} />
            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
              {user.ratingCount > 0 ? `${Number(user.averageRating).toFixed(1)} · ${user.ratingCount} reviews` : 'No reviews'}
            </span>
          </div>
        </div>
        {user.location && (
          <span style={{ fontSize: 11, color: 'var(--text-faint)', flexShrink: 0 }}>📍 {user.location}</span>
        )}
      </div>

      {/* Skills */}
      {teachSkills.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600 }}>TEACHES  </span>
          {teachSkills.slice(0, 4).map((ts, i) => (
            <span key={i} style={{ display: 'inline-block', fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--accent-bg)', color: 'var(--brand)', border: '1px solid var(--brand-border)', marginRight: 4, marginBottom: 4 }}>
              {ts.skillId?.name}
            </span>
          ))}
          {teachSkills.length > 4 && <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>+{teachSkills.length - 4}</span>}
        </div>
      )}
      {learnSkills.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600 }}>LEARNING  </span>
          {learnSkills.slice(0, 4).map((ls, i) => (
            <span key={i} style={{ display: 'inline-block', fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'rgba(59,130,246,0.08)', color: '#2563eb', border: '1px solid rgba(59,130,246,0.2)', marginRight: 4, marginBottom: 4 }}>
              {ls.skillId?.name}
            </span>
          ))}
          {learnSkills.length > 4 && <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>+{learnSkills.length - 4}</span>}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onMessage} style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', cursor: 'pointer' }}>
          💬 Message
        </button>
        <button onClick={onBook} style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--brand)', color: '#fff', border: 'none', cursor: 'pointer' }}>
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