import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { userApi, ratingApi, sessionApi } from '../api/index'
import { useAuthStore } from '../store/authStore'
import { Avatar, StarRating, Modal } from '../components/common/index'
import Loader from '../components/common/Loader'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function ProfilePage() {
  const { userId } = useParams()
  const nav = useNavigate()
  const { user: me, logout } = useAuthStore()

  const [profile, setProfile]             = useState(null)
  const [ratings, setRatings]             = useState([])
  const [loading, setLoading]             = useState(true)
  const [bookModal, setBookModal]         = useState(false)
  const [deleteModal, setDeleteModal]     = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting]           = useState(false)
  const [form, setForm]                   = useState({ skillId:'', scheduledAt:'', notes:'' })
  const [booking, setBooking]             = useState(false)
  const [activeTab, setActiveTab]         = useState('about')

  const isMe = userId === me?._id

  useEffect(() => {
    setLoading(true)
    setActiveTab('about')
    Promise.all([
      userApi.getUser(userId),
      ratingApi.getUserRatings(userId, { limit: 20 }),
    ])
      .then(([p, r]) => {
        setProfile(p.data.data)
        setRatings(r.data.data.ratings || [])
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [userId])

  const handleBook = async () => {
    if (!form.skillId || !form.scheduledAt) {
      toast.error('Please select a skill and a time')
      return
    }
    setBooking(true)
    try {
      await sessionApi.create({
        teacherId:   profile._id,
        skillId:     form.skillId,
        scheduledAt: form.scheduledAt,
        notes:       form.notes,
      })
      toast.success('Session request sent!')
      setBookModal(false)
      setForm({ skillId:'', scheduledAt:'', notes:'' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request')
    } finally { setBooking(false) }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return
    setDeleting(true)
    try {
      await userApi.deleteAccount()
      await logout()
      toast.success('Your account has been permanently deleted.')
      nav('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account')
      setDeleting(false)
    }
  }

  if (loading) return <Loader />
  if (!profile) return null

  const teach = (profile.teachSkills || []).filter(ts => ts.skillId?.name)
  const learn = (profile.learnSkills || []).filter(ls => ls.skillId?.name)
  const minDT = new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)

  return (
    <div className="max-w-2xl mx-auto pb-10">
      {/* Banner */}
      <div className="h-28 w-full"
        style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-hover) 100%)' }} />

      <div className="px-6">
        {/* Avatar + actions */}
        <div className="flex items-end justify-between -mt-10 mb-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden"
              style={{ border: '3px solid var(--surface)' }}>
              <Avatar src={profile.avatarUrl} name={profile.name} size={80} />
            </div>
            <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-green-400"
              style={{ border: '2px solid var(--surface)' }} />
          </div>

          <div className="flex gap-2 flex-wrap justify-end">
            {isMe ? (
              <button onClick={() => nav('/profile/edit')} className="btn btn-white btn-sm">
                ✏️ Edit profile
              </button>
            ) : (
              <>
                <button onClick={() => nav(`/chat/${profile._id}`)} className="btn btn-white btn-sm">
                  💬 Message
                </button>
                {teach.length > 0 && (
                  <button onClick={() => setBookModal(true)} className="btn btn-primary btn-sm">
                    📅 Book session
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Name + meta */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>
            {profile.name}
          </h1>
          {profile.username && (
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--brand)' }}>
              @{profile.username}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {profile.location && (
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>📍 {profile.location}</span>
            )}
            {profile.timezone && profile.timezone !== 'UTC' && (
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>🕐 {profile.timezone}</span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <StarRating value={profile.averageRating || 0} readonly size={15} />
              <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                {profile.ratingCount > 0 ? Number(profile.averageRating).toFixed(1) : '—'}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                ({profile.ratingCount || 0} reviews)
              </span>
            </div>
            <div className="w-px h-4" style={{ background: 'var(--border-2)' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text)' }}>{profile.totalSessions || 0}</strong> sessions
            </span>
            <div className="w-px h-4" style={{ background: 'var(--border-2)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>
              {profile.creditBalance ?? 0} credits
            </span>
          </div>

          {profile.bio && (
            <p className="text-sm leading-relaxed mt-3" style={{ color: 'var(--text-muted)' }}>
              {profile.bio}
            </p>
          )}
        </div>

        {/* Skills */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl p-4"
            style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--brand)' }}>
                🎓 Teaches
              </p>
              <span className="badge-orange text-[10px]">{teach.length}</span>
            </div>
            {teach.length > 0 ? (
              <div className="space-y-2">
                {teach.map(ts => (
                  <div key={ts._id} className="flex items-center justify-between gap-2">
                    <span className="badge-orange text-xs">{ts.skillId.name}</span>
                    {ts.level && (
                      <span className="text-[10px] capitalize flex-shrink-0"
                        style={{ color: 'var(--text-faint)' }}>{ts.level}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Nothing added yet</p>
            )}
          </div>

          <div className="rounded-xl p-4"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-500">📚 Learning</p>
              <span className="badge-blue text-[10px]">{learn.length}</span>
            </div>
            {learn.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {learn.map(ls => (
                  <span key={ls._id} className="badge-blue text-xs">{ls.skillId.name}</span>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Nothing added yet</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 rounded-lg p-0.5 mb-5" style={{ background: 'var(--surface-2)' }}>
          {[
            { id: 'about',   label: 'About' },
            { id: 'reviews', label: `Reviews (${ratings.length})` },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="flex-1 py-2 rounded-md text-xs font-semibold transition-all"
              style={{
                background: activeTab === t.id ? 'var(--surface)' : 'transparent',
                color:      activeTab === t.id ? 'var(--text)'    : 'var(--text-muted)',
                boxShadow:  activeTab === t.id ? 'var(--shadow)'  : 'none',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* About tab */}
        {activeTab === 'about' && (
          <div className="space-y-4 fade-up">
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon:'🎓', value: teach.length,               label:'Skills teaching' },
                { icon:'📚', value: learn.length,               label:'Skills learning' },
                { icon:'📅', value: profile.totalSessions || 0, label:'Sessions done' },
              ].map(s => (
                <div key={s.label} className="card p-3 text-center">
                  <div className="text-xl mb-1">{s.icon}</div>
                  <p className="font-bold text-lg" style={{ color: 'var(--text)' }}>{s.value}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {profile.bio ? (
              <div className="card p-4">
                <p className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--text-faint)' }}>About</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                  {profile.bio}
                </p>
              </div>
            ) : isMe ? (
              <button onClick={() => nav('/profile/edit')}
                className="w-full card p-4 text-center"
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <p className="text-sm font-medium" style={{ color: 'var(--brand)' }}>
                  + Add a bio to attract more students
                </p>
              </button>
            ) : null}

            {/* ── Danger zone — own profile only ─────────────────────── */}
            {isMe && (
              <div className="rounded-xl p-4"
                style={{ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.04)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#ef4444' }}>
                  Danger zone
                </p>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                  Permanently delete your account and all associated data. This cannot be undone.
                </p>
                <button
                  onClick={() => { setDeleteConfirm(''); setDeleteModal(true) }}
                  className="btn btn-danger btn-sm">
                  🗑️ Delete my account
                </button>
              </div>
            )}
          </div>
        )}

        {/* Reviews tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-3 fade-up">
            {ratings.length > 0 && (
              <div className="card p-4 flex items-center gap-5 mb-2">
                <div className="text-center">
                  <p className="text-4xl font-extrabold" style={{ color: 'var(--text)' }}>
                    {Number(profile.averageRating || 0).toFixed(1)}
                  </p>
                  <StarRating value={Math.round(profile.averageRating || 0)} readonly size={16} />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                    {profile.ratingCount} review{profile.ratingCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5,4,3,2,1].map(star => {
                    const count = ratings.filter(r => r.score === star).length
                    const pct   = ratings.length ? (count / ratings.length) * 100 : 0
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs w-3" style={{ color: 'var(--text-faint)' }}>{star}</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"
                          style={{ color: 'var(--brand)' }}>
                          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                        </svg>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                          style={{ background: 'var(--surface-2)' }}>
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: 'var(--brand)' }} />
                        </div>
                        <span className="text-xs w-4 text-right" style={{ color: 'var(--text-faint)' }}>
                          {count}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {ratings.length === 0 ? (
              <div className="card p-10 text-center">
                <div className="text-3xl mb-2">⭐</div>
                <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>No reviews yet</p>
                <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
                  {isMe ? 'Complete sessions to get your first review.' : 'Be the first to leave a review!'}
                </p>
              </div>
            ) : ratings.map(r => (
              <div key={r._id} className="card p-4">
                <div className="flex items-start gap-3">
                  <Avatar src={r.raterId?.avatarUrl} name={r.raterId?.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                      <button onClick={() => nav(`/profile/${r.raterId?._id}`)}
                        className="font-semibold text-sm transition-colors"
                        style={{ color: 'var(--text)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--brand)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}>
                        {r.raterId?.name}
                      </button>
                      <div className="flex items-center gap-2">
                        <StarRating value={r.score} readonly size={13} />
                        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                          {format(new Date(r.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    {r.comment && (
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        "{r.comment}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Book modal */}
      <Modal open={bookModal} onClose={() => setBookModal(false)} title={`Book with ${profile.name}`}>
        <div className="space-y-3">
          <div>
            <label className="label">Skill to learn *</label>
            {teach.length === 0 ? (
              <p className="text-sm py-2" style={{ color: 'var(--brand)' }}>
                This user hasn't added any teach skills yet.
              </p>
            ) : (
              <select className="input" value={form.skillId}
                onChange={e => setForm(f => ({ ...f, skillId: e.target.value }))}>
                <option value="">Select a skill…</option>
                {teach.map(ts => (
                  <option key={ts._id} value={ts.skillId._id}>
                    {ts.skillId.name}{ts.level ? ` · ${ts.level}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="label">Date & time *</label>
            <input className="input" type="datetime-local" min={minDT}
              value={form.scheduledAt}
              onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input resize-none" rows={3}
              placeholder="Your experience level, what you want to focus on…"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-white btn-md flex-1" onClick={() => setBookModal(false)}>Cancel</button>
            <button className="btn btn-primary btn-md flex-1" onClick={handleBook} disabled={booking}>
              {booking ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete account modal */}
      <Modal
        open={deleteModal}
        onClose={() => { setDeleteModal(false); setDeleteConfirm('') }}
        title="Delete your account">
        <div className="space-y-4">
          <div className="rounded-lg p-3"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#ef4444' }}>
              ⚠️ This cannot be undone
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              This will permanently delete your account, skills, sessions, messages, ratings, and credits from our servers.
            </p>
          </div>

          <div>
            <label className="label">
              Type <strong style={{ color: 'var(--text)' }}>DELETE</strong> to confirm
            </label>
            <input
              className="input"
              placeholder="DELETE"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="flex gap-2">
            <button
              className="btn btn-white btn-md flex-1"
              onClick={() => { setDeleteModal(false); setDeleteConfirm('') }}>
              Cancel
            </button>
            <button
              className="btn btn-danger btn-md flex-1"
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'DELETE' || deleting}>
              {deleting ? 'Deleting…' : 'Delete permanently'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}