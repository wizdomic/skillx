import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestApi, skillApi, sessionApi } from '../api/index'
import { useAuthStore } from '../store/authStore'
import { Avatar, StarRating, Modal } from '../components/common/index'
import Loader from '../components/common/Loader'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

export default function SkillRequestBoardPage() {
  const { user } = useAuthStore()
  const nav = useNavigate()

  const [requests, setRequests]       = useState([])
  const [skills, setSkills]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [filter, setFilter]           = useState({ type: '', skillId: '' })
  const [createModal, setCreateModal] = useState(false)
  const [bookModal, setBookModal]     = useState(null) // the request being booked
  const [form, setForm]               = useState({ skillId: '', type: 'offer', title: '', description: '' })
  const [bookForm, setBookForm]       = useState({ scheduledAt: '', notes: '' })
  const [creating, setCreating]       = useState(false)
  const [booking, setBooking]         = useState(false)

  const load = (f = filter) =>
    requestApi.list(
      f.type || f.skillId
        ? { type: f.type || undefined, skillId: f.skillId || undefined }
        : {}
    ).then(({ data }) => setRequests(data.data.requests))

  useEffect(() => {
    setLoading(true)
    Promise.all([
      load(),
      skillApi.list({ limit: 300 }).then(({ data }) => setSkills(data.data.skills)),
    ])
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [filter])

  const handleCreate = async () => {
    if (!form.skillId || !form.title || !form.description) {
      toast.error('Fill in all fields'); return
    }
    setCreating(true)
    try {
      await requestApi.create(form)
      toast.success('Posted!')
      setCreateModal(false)
      setForm({ skillId: '', type: 'offer', title: '', description: '' })
      load()
    } catch { toast.error('Failed') }
    finally { setCreating(false) }
  }

  const handleBook = async () => {
    if (!bookForm.scheduledAt) { toast.error('Please select a date and time'); return }
    setBooking(true)
    try {
      await sessionApi.create({
        teacherId:   bookModal.userId._id,
        skillId:     bookModal.skillId._id,
        scheduledAt: bookForm.scheduledAt,
        notes:       bookForm.notes,
      })
      toast.success('Session request sent!')
      setBookModal(null)
      setBookForm({ scheduledAt: '', notes: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request')
    } finally { setBooking(false) }
  }

  const del = async id => {
    if (!confirm('Delete this post?')) return
    await requestApi.delete(id)
    setRequests(p => p.filter(r => r._id !== id))
    toast.success('Deleted')
  }

  const minDT = new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)

  if (loading) return <Loader />

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Skill Board</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Posts matched to your skills
          </p>
        </div>
        <button onClick={() => setCreateModal(true)} className="btn btn-primary btn-md">+ Post</button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <div className="flex rounded-lg p-0.5" style={{ background: 'var(--surface-2)' }}>
          {[{ v: '', l: 'All' }, { v: 'offer', l: '🎓 Offering' }, { v: 'wanted', l: '📚 Wanted' }].map(({ v, l }) => (
            <button key={v} onClick={() => setFilter(f => ({ ...f, type: v }))}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
              style={{
                background: filter.type === v ? 'var(--surface)' : 'transparent',
                color:      filter.type === v ? 'var(--text)'    : 'var(--text-muted)',
                boxShadow:  filter.type === v ? 'var(--shadow)'  : 'none',
              }}>
              {l}
            </button>
          ))}
        </div>
        <select className="input w-auto text-sm" value={filter.skillId}
          onChange={e => setFilter(f => ({ ...f, skillId: e.target.value }))}>
          <option value="">All skills</option>
          {skills.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      {/* Empty state */}
      {requests.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>No matching posts yet</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Posts appear here when they match your skills. Add more skills to see more posts.
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <button onClick={() => setCreateModal(true)} className="btn btn-primary btn-md">Post now</button>
            <button onClick={() => nav('/skills')} className="btn btn-white btn-md">Add skills</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const isOwn = req.userId?._id === user?._id
            // offer = poster teaches → viewer can book a session
            // wanted = poster wants to learn → viewer can message
            const canBook    = !isOwn && req.type === 'offer'
            const canMessage = !isOwn && req.type === 'wanted'

            return (
              <div key={req._id} className="card p-4 transition-all"
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div className="flex items-start gap-3">
                  <button onClick={() => nav(`/profile/${req.userId?._id}`)}>
                    <Avatar src={req.userId?.avatarUrl} name={req.userId?.name} size={38} />
                  </button>
                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={req.type === 'offer' ? 'badge-orange' : 'badge-blue'}>
                          {req.type === 'offer' ? '🎓 Offering' : '📚 Wanted'}
                        </span>
                        <span className="badge-gray text-xs">{req.skillId?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                          {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                        </span>
                        {isOwn && (
                          <button onClick={() => del(req._id)}
                            className="text-xs transition-colors"
                            style={{ color: '#ef4444' }}>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>
                      {req.title}
                    </h3>
                    <p className="text-sm line-clamp-2 mb-2" style={{ color: 'var(--text-muted)' }}>
                      {req.description}
                    </p>

                    {/* Poster info */}
                    <button onClick={() => nav(`/profile/${req.userId?._id}`)}
                      className="flex items-center gap-2 mb-3 transition-opacity hover:opacity-80">
                      <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                        {req.userId?.name}
                      </span>
                      {req.userId?.ratingCount > 0 && (
                        <>
                          <StarRating value={req.userId.averageRating || 0} readonly size={11} />
                          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                            {Number(req.userId.averageRating).toFixed(1)}
                          </span>
                        </>
                      )}
                    </button>

                    {/* Action buttons */}
                    {(canBook || canMessage) && (
                      <div className="flex gap-2 flex-wrap">
                        {canMessage && (
                          <button
                            onClick={() => nav(`/chat/${req.userId?._id}`)}
                            className="btn btn-white btn-sm">
                            💬 Message
                          </button>
                        )}
                        {canBook && (
                          <button
                            onClick={() => { setBookModal(req); setBookForm({ scheduledAt: '', notes: '' }) }}
                            className="btn btn-primary btn-sm">
                            📅 Book session
                          </button>
                        )}
                        <button
                          onClick={() => nav(`/profile/${req.userId?._id}`)}
                          className="btn btn-ghost btn-sm">
                          View profile →
                        </button>
                      </div>
                    )}

                    {isOwn && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                        Your post · visible to matched users
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Post to skill board">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: 'offer',  l: '🎓 Offering to teach', s: 'People who want to learn will see this' },
              { v: 'wanted', l: '📚 Looking to learn',  s: 'People who can teach will see this' },
            ].map(({ v, l, s }) => (
              <button key={v} onClick={() => setForm(f => ({ ...f, type: v }))}
                className="p-3 rounded-lg text-left transition-all"
                style={{
                  border:     `1px solid ${form.type === v ? 'var(--brand)' : 'var(--border)'}`,
                  background: form.type === v ? 'var(--accent-bg)' : 'var(--surface-2)',
                }}>
                <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{l}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s}</p>
              </button>
            ))}
          </div>
          <div>
            <label className="label">Skill *</label>
            <select className="input" value={form.skillId}
              onChange={e => setForm(f => ({ ...f, skillId: e.target.value }))}>
              <option value="">Select…</option>
              {skills.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Title *</label>
            <input className="input" maxLength={150}
              placeholder={form.type === 'offer' ? 'e.g. Teaching React to beginners' : 'e.g. Looking for a guitar teacher'}
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="label">Description *</label>
            <textarea className="input resize-none" rows={4} maxLength={1000}
              placeholder="Your experience, availability, goals…"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-white btn-md flex-1" onClick={() => setCreateModal(false)}>Cancel</button>
            <button className="btn btn-primary btn-md flex-1" onClick={handleCreate} disabled={creating}>
              {creating ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Book session modal */}
      <Modal
        open={!!bookModal}
        onClose={() => { setBookModal(null); setBookForm({ scheduledAt: '', notes: '' }) }}
        title={`Book session with ${bookModal?.userId?.name}`}>
        {bookModal && (
          <div className="space-y-3">
            {/* Post summary */}
            <div className="rounded-lg p-3 flex items-center gap-3"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <Avatar src={bookModal.userId?.avatarUrl} name={bookModal.userId?.name} size={36} />
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                  {bookModal.userId?.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Teaching: <span style={{ color: 'var(--brand)' }}>{bookModal.skillId?.name}</span>
                </p>
              </div>
            </div>

            <div>
              <label className="label">Date & time *</label>
              <input className="input" type="datetime-local" min={minDT}
                value={bookForm.scheduledAt}
                onChange={e => setBookForm(f => ({ ...f, scheduledAt: e.target.value }))} />
              <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                Sessions are 60 minutes by default
              </p>
            </div>

            <div>
              <label className="label">Notes (optional)</label>
              <textarea className="input resize-none" rows={3}
                placeholder="Your experience level, what you want to focus on…"
                value={bookForm.notes}
                onChange={e => setBookForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div className="flex gap-2">
              <button className="btn btn-white btn-md flex-1"
                onClick={() => { setBookModal(null); setBookForm({ scheduledAt: '', notes: '' }) }}>
                Cancel
              </button>
              <button className="btn btn-primary btn-md flex-1"
                onClick={handleBook} disabled={booking}>
                {booking ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}