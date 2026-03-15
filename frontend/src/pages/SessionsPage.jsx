import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { sessionApi, ratingApi } from '../api/index'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { Avatar, StarRating, Modal } from '../components/common/index'
import { IconVideo, IconCheck, IconX, IconChat, IconEdit } from '../components/common/AppLayout'
import Loader from '../components/common/Loader'
import toast from 'react-hot-toast'
import { format, isFuture, isPast } from 'date-fns'

const STATUS = {
  pending: { badge: 'badge-yellow', label: 'Pending' },
  accepted: { badge: 'badge-blue', label: 'Accepted' },
  completed: { badge: 'badge-green', label: 'Completed' },
  cancelled: { badge: 'badge-red', label: 'Cancelled' },
  disputed: { badge: 'badge-red', label: 'Disputed' },
}

const TABS = [
  { val: '', label: 'All' },
  { val: 'pending', label: 'Pending' },
  { val: 'accepted', label: 'Upcoming' },
  { val: 'completed', label: 'Completed' },
  { val: 'cancelled', label: 'Cancelled' },
]

const PLATFORMS = [
  { id: 'jitsi', label: 'Jitsi Meet', icon: '🟦', hint: 'Free, auto-generated — no account needed', needsLink: false, placeholder: '' },
  { id: 'zoom', label: 'Zoom', icon: '📹', hint: 'Paste your Zoom meeting link', needsLink: true, placeholder: 'https://zoom.us/j/...' },
  { id: 'gmeet', label: 'Google Meet', icon: '🟢', hint: 'Paste your Google Meet link', needsLink: true, placeholder: 'https://meet.google.com/abc-xyz' },
  { id: 'teams', label: 'Microsoft Teams', icon: '🟣', hint: 'Paste your Teams meeting link', needsLink: true, placeholder: 'https://teams.microsoft.com/l/...' },
  { id: 'custom', label: 'Other link', icon: '🔗', hint: 'Any video call or meeting URL', needsLink: true, placeholder: 'https://...' },
]
const getPlatform = id => PLATFORMS.find(p => p.id === id) || PLATFORMS[0]

export default function SessionsPage() {
  const { user } = useAuthStore()
  const { dismissRatingPrompt } = useNotificationStore()
  const nav = useNavigate()

  const [sessions, setSessions] = useState([])
  const [tab, setTab] = useState('')
  const [loading, setLoading] = useState(true)
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [rateModal, setRateModal] = useState(null)
  const [ratingForm, setRatingForm] = useState({ score: 0, comment: '' })
  const [meetingModal, setMeetingModal] = useState(null)
  const [meetingForm, setMeetingForm] = useState({ platform: 'jitsi', customLink: '' })
  const [busy, setBusy] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    sessionApi.list(tab ? { status: tab } : {})
      .then(({ data }) => setSessions(data.data.sessions))
      .catch(() => toast.error('Failed to load sessions'))
      .finally(() => setLoading(false))
  }, [tab])

  useEffect(() => { load() }, [load])

  const isTeacher = s => s.teacherId?._id === user?._id
  const partner = s => isTeacher(s) ? s.learnerId : s.teacherId
  const hasConfirmed = s => isTeacher(s) ? s.teacherConfirmed : s.learnerConfirmed
  const pendingCount = sessions.filter(s => s.status === 'pending' && isTeacher(s)).length
  const unratedCount = sessions.filter(s => s.canRate).length

  const accept = async id => {
    setBusy(id + 'accept')
    try {
      await sessionApi.accept(id)
      toast.success('Session accepted! A Jitsi link was auto-generated — change it anytime.')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setBusy(null) }
  }

  const saveMeetingLink = async () => {
    const pl = getPlatform(meetingForm.platform)
    if (pl.needsLink && !meetingForm.customLink.trim()) {
      toast.error('Please paste your meeting link'); return
    }
    setBusy('meeting')
    try {
      await sessionApi.setMeetingLink(meetingModal._id, {
        platform: meetingForm.platform,
        customLink: meetingForm.customLink.trim(),
      })
      toast.success('Meeting link saved!')
      setMeetingModal(null)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setBusy(null) }
  }

  const cancel = async () => {
    setBusy(cancelModal._id + 'cancel')
    try {
      await sessionApi.cancel(cancelModal._id, cancelReason)
      toast.success('Session cancelled — credit refunded.')
      setCancelModal(null); setCancelReason(''); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setBusy(null) }
  }

  const deleteSession = async (id) => {
    if (!window.confirm('Remove this session from your history? This cannot be undone.')) return
    setBusy(id + 'delete')
    try {
      await sessionApi.delete(id)
      setSessions(prev => prev.filter(s => s._id !== id))
      toast.success('Session removed from history.')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setBusy(null) }
  }

  const confirmDone = async id => {
    setBusy(id + 'confirm')
    try {
      const { data } = await sessionApi.confirm(id)
      toast.success(data.message || 'Confirmed!')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setBusy(null) }
  }

  const rate = async () => {
    if (!ratingForm.score) { toast.error('Please select a rating'); return }
    setBusy('rate')
    try {
      await ratingApi.submit({ sessionId: rateModal._id, ...ratingForm })
      toast.success('Rating submitted! 🙏')
      dismissRatingPrompt(rateModal._id)
      setRateModal(null); setRatingForm({ score: 0, comment: '' }); load()
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed'
      toast.error(msg.includes('already rated') ? 'You already rated this session.' : msg)
    } finally { setBusy(null) }
  }

  const openMeetingModal = s => {
    setMeetingModal(s)
    const isJitsi = s.videoLink?.includes('meet.jit.si')
    setMeetingForm({
      platform: s.meetingPlatform || 'jitsi',
      customLink: isJitsi ? '' : (s.videoLink || ''),
    })
  }

  const selectedPlatform = getPlatform(meetingForm.platform)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Sessions</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Manage your teaching and learning sessions
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 rounded-full px-3 py-1"
              style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)' }}>
              <span className="w-5 h-5 rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold flex items-center justify-center">
                {pendingCount}
              </span>
              <span className="text-xs font-semibold text-yellow-600">{pendingCount} pending</span>
            </div>
          )}
          {unratedCount > 0 && (
            <div className="flex items-center gap-2 rounded-full px-3 py-1"
              style={{ background: 'var(--brand-bg)', border: '1px solid var(--brand-border)' }}>
              <span className="text-xs font-semibold" style={{ color: 'var(--brand)' }}>
                ⭐ {unratedCount} to rate
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 rounded-lg p-0.5 mb-6"
        style={{ background: 'var(--surface-2)' }}>
        {TABS.map(({ val, label }) => (
          <button key={val} onClick={() => setTab(val)}
            className="flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all relative"
            style={{
              background: tab === val ? 'var(--surface)' : 'transparent',
              color: tab === val ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: tab === val ? 'var(--shadow)' : 'none',
            }}>
            {label}
            {val === 'pending' && pendingCount > 0 && tab !== 'pending' && (
              <span className="absolute -top-1 -right-0.5 w-3.5 h-3.5 rounded-full bg-yellow-400 text-yellow-900 text-[9px] font-bold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? <Loader /> : sessions.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">📅</div>
          <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>No sessions found</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {tab ? `No ${tab} sessions.` : 'Book a session from the dashboard to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s, i) => {
            const p = partner(s)
            const teach = isTeacher(s)
            const upcoming = s.scheduledAt && isFuture(new Date(s.scheduledAt))
            const past = s.scheduledAt && isPast(new Date(s.scheduledAt))
            const canConfirm = s.status === 'accepted' && past && !hasConfirmed(s)
            const waitingOther = s.status === 'accepted' && past && hasConfirmed(s)
            const canRate = s.canRate
            const canDelete = ['cancelled', 'completed'].includes(s.status)
            const st = STATUS[s.status] || STATUS.pending
            const pl = s.meetingPlatform ? getPlatform(s.meetingPlatform) : null
            const hasLink = s.videoLink && s.status === 'accepted'

            return (
              <div key={s._id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <Avatar src={p?.avatarUrl} name={p?.name} size={40} />
                    <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      {i + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Status row */}
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`badge text-xs ${st.badge}`}>{st.label}</span>
                        <span className="badge-gray text-xs">{s.skillId?.name}</span>
                        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                          {teach ? '🎓 Teaching' : '📚 Learning'}
                        </span>
                        {pl && hasLink && (
                          <span className="badge-gray text-xs">{pl.icon} {pl.label}</span>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-xs" style={{ color: 'var(--text)' }}>
                          {format(new Date(s.scheduledAt), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {format(new Date(s.scheduledAt), 'h:mm a')} · {s.durationMins}min
                        </p>
                      </div>
                    </div>

                    {/* Partner */}
                    <p className="text-sm mb-1" style={{ color: 'var(--text-2)' }}>
                      {teach ? 'Teaching ' : 'Learning from '}
                      <button onClick={() => nav(`/profile/${p?._id}`)}
                        className="font-semibold hover:opacity-80 transition-opacity"
                        style={{ color: 'var(--brand)' }}>
                        {p?.name}
                      </button>
                    </p>

                    {s.notes && (
                      <p className="text-xs italic mb-2" style={{ color: 'var(--text-faint)' }}>
                        "{s.notes}"
                      </p>
                    )}

                    {/* No meeting link warning */}
                    {s.status === 'accepted' && !s.videoLink && (
                      <div className="flex items-center gap-2 text-xs mb-2 p-2 rounded-lg"
                        style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', color: '#92400e' }}>
                        ⚠️ No meeting link set —{' '}
                        <button onClick={() => openMeetingModal(s)} className="underline font-semibold">
                          Set one now
                        </button>
                      </div>
                    )}

                    {/* Cancellation reason */}
                    {s.status === 'cancelled' && s.cancelReason && (
                      <p className="text-xs italic mb-2" style={{ color: 'var(--text-faint)' }}>
                        Reason: {s.cancelReason}
                      </p>
                    )}

                    {s.status === 'completed' && (
                      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                        {s.creditsEligible
                          ? `🪙 ${s.creditsAmount} credit transferred`
                          : '⚠️ No credits (weekly limit)'}
                      </p>
                    )}

                    {waitingOther && (
                      <p className="text-xs mb-2 text-blue-500">
                        ⏳ You confirmed — waiting for {p?.name}
                      </p>
                    )}

                    {s.status === 'completed' && s.userHasRated && (
                      <p className="text-xs mb-2 text-green-600">✓ You rated this session</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap mt-2">
                      {/* One-click accept */}
                      {teach && s.status === 'pending' && (
                        <button onClick={() => accept(s._id)} disabled={busy === s._id + 'accept'}
                          className="btn btn-primary btn-sm">
                          <IconCheck size={13} />
                          {busy === s._id + 'accept' ? 'Accepting…' : 'Accept'}
                        </button>
                      )}

                      {/* Join call */}
                      {hasLink && upcoming && (
                        <a href={s.videoLink} target="_blank" rel="noopener noreferrer"
                          className="btn btn-primary btn-sm">
                          <IconVideo size={13} />
                          {pl ? `${pl.icon} Join` : 'Join'}
                        </a>
                      )}

                      {/* Edit meeting link */}
                      {s.status === 'accepted' && (
                        <button onClick={() => openMeetingModal(s)} className="btn btn-white btn-sm">
                          <IconEdit size={13} />
                          {s.videoLink ? 'Edit link' : 'Set meeting'}
                        </button>
                      )}

                      {/* Message */}
                      {['accepted', 'completed', 'pending'].includes(s.status) && (
                        <button onClick={() => nav(`/chat/${p?._id}`)} className="btn btn-white btn-sm">
                          <IconChat size={13} /> Message
                        </button>
                      )}

                      {/* Confirm done */}
                      {canConfirm && (
                        <button onClick={() => confirmDone(s._id)} disabled={busy === s._id + 'confirm'}
                          className="btn btn-primary btn-sm">
                          <IconCheck size={13} />
                          {busy === s._id + 'confirm' ? 'Confirming…' : 'Mark as done'}
                        </button>
                      )}

                      {/* Rate */}
                      {canRate && (
                        <button onClick={() => { setRateModal(s); setRatingForm({ score: 0, comment: '' }) }}
                          className="btn btn-white btn-sm"
                          style={{ border: '1px solid var(--brand)', color: 'var(--brand)' }}>
                          ⭐ Rate
                        </button>
                      )}

                      {/* Cancel */}
                      {['pending', 'accepted'].includes(s.status) && (
                        <button onClick={() => setCancelModal(s)} className="btn btn-danger btn-sm">
                          <IconX size={13} /> Cancel
                        </button>
                      )}

                      {/* Delete from history */}
                      {canDelete && (
                        <button
                          onClick={() => deleteSession(s._id)}
                          disabled={busy === s._id + 'delete'}
                          className="btn btn-danger btn-sm"
                          title="Remove from history">
                          🗑️ {busy === s._id + 'delete' ? 'Deleting…' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Meeting link modal ─────────────────────────────────────── */}
      <Modal open={!!meetingModal} onClose={() => setMeetingModal(null)}
        title={meetingModal?.videoLink ? 'Edit meeting link' : 'Set meeting link'}>
        {meetingModal && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Either participant can set or change this at any time before the session starts.
            </p>

            <div className="space-y-2">
              {PLATFORMS.map(pl => (
                <button key={pl.id}
                  onClick={() => setMeetingForm(f => ({ ...f, platform: pl.id, customLink: f.platform === pl.id ? f.customLink : '' }))}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all"
                  style={{
                    border: `1px solid ${meetingForm.platform === pl.id ? 'var(--brand)' : 'var(--border)'}`,
                    background: meetingForm.platform === pl.id ? 'var(--brand-bg)' : 'var(--surface)',
                  }}>
                  <span className="text-lg flex-shrink-0">{pl.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{pl.label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{pl.hint}</p>
                  </div>
                  {meetingForm.platform === pl.id && (
                    <span className="font-bold text-xs" style={{ color: 'var(--brand)' }}>✓</span>
                  )}
                </button>
              ))}
            </div>

            {selectedPlatform.needsLink && (
              <div>
                <label className="label">{selectedPlatform.label} link *</label>
                <input
                  className="input"
                  placeholder={selectedPlatform.placeholder}
                  value={meetingForm.customLink}
                  onChange={e => setMeetingForm(f => ({ ...f, customLink: e.target.value }))}
                  autoFocus
                />
              </div>
            )}

            {meetingForm.platform === 'jitsi' && (
              <p className="text-xs p-2 rounded-lg"
                style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                ✅ A unique room is auto-generated — just click the Join button when it's time.
              </p>
            )}

            <div className="flex gap-2">
              <button className="btn btn-white btn-md flex-1" onClick={() => setMeetingModal(null)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-md flex-1" onClick={saveMeetingLink}
                disabled={busy === 'meeting'}>
                {busy === 'meeting' ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Cancel modal ─────────────────────────────────────────────── */}
      <Modal open={!!cancelModal} onClose={() => setCancelModal(null)} title="Cancel session">
        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            The other participant will be notified. Your credit will be refunded immediately.
          </p>
          <div>
            <label className="label">Reason (optional)</label>
            <textarea className="input resize-none" rows={3} placeholder="Let them know why…"
              value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-white btn-md flex-1" onClick={() => setCancelModal(null)}>Keep it</button>
            <button className="btn btn-danger btn-md flex-1" onClick={cancel} disabled={!!busy}>
              Cancel session
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Rate modal ───────────────────────────────────────────────── */}
      <Modal open={!!rateModal} onClose={() => setRateModal(null)} title="Rate your session">
        {rateModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <Avatar src={partner(rateModal)?.avatarUrl} name={partner(rateModal)?.name} size={40} />
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                  {partner(rateModal)?.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {rateModal.skillId?.name} · {format(new Date(rateModal.scheduledAt), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="text-center">
              <p className="label mb-3">How was your experience? *</p>
              <StarRating
                value={ratingForm.score}
                onChange={v => setRatingForm(f => ({ ...f, score: v }))}
                size={40} />
              {ratingForm.score > 0 && (
                <p className="text-sm mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                  {['', '😞 Poor', '😐 Fair', '🙂 Good', '😊 Great', '🤩 Excellent!'][ratingForm.score]}
                </p>
              )}
            </div>

            <div>
              <label className="label">Review (optional)</label>
              <textarea className="input resize-none" rows={3}
                placeholder="Share what you learned, how the session went…"
                value={ratingForm.comment}
                onChange={e => setRatingForm(f => ({ ...f, comment: e.target.value }))} />
            </div>

            <div className="flex gap-2">
              <button className="btn btn-white btn-md flex-1" onClick={() => setRateModal(null)}>Skip</button>
              <button className="btn btn-primary btn-md flex-1" onClick={rate}
                disabled={busy === 'rate' || !ratingForm.score}>
                {busy === 'rate' ? 'Submitting…' : 'Submit rating'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}