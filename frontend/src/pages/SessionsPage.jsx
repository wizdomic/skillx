import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { sessionApi, ratingApi } from '../api/index'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { Avatar, StarRating, Modal } from '../components/common/index'
import { IconVideo, IconCheck, IconX, IconChat } from '../components/common/AppLayout'
import Loader from '../components/common/Loader'
import toast from 'react-hot-toast'
import { format, isFuture, isPast } from 'date-fns'

const STATUS = {
  pending:   { badge:'badge-yellow', label:'Pending' },
  accepted:  { badge:'badge-blue',   label:'Accepted' },
  completed: { badge:'badge-green',  label:'Completed' },
  cancelled: { badge:'badge-red',    label:'Cancelled' },
  disputed:  { badge:'badge-red',    label:'Disputed' },
}

const TABS = [
  { val:'',          label:'All' },
  { val:'pending',   label:'Pending' },
  { val:'accepted',  label:'Upcoming' },
  { val:'completed', label:'Completed' },
  { val:'cancelled', label:'Cancelled' },
]

export default function SessionsPage() {
  const { user } = useAuthStore()
  const { dismissRatingPrompt } = useNotificationStore()
  const nav = useNavigate()

  const [sessions, setSessions]         = useState([])
  const [tab, setTab]                   = useState('')
  const [loading, setLoading]           = useState(true)
  const [cancelModal, setCancelModal]   = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [rateModal, setRateModal]       = useState(null)
  const [ratingForm, setRatingForm]     = useState({ score:0, comment:'' })
  const [busy, setBusy]                 = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    sessionApi.list(tab ? { status: tab } : {})
      .then(({ data }) => setSessions(data.data.sessions))
      .catch(() => toast.error('Failed to load sessions'))
      .finally(() => setLoading(false))
  }, [tab])

  useEffect(() => { load() }, [load])

  const isTeacher    = s => s.teacherId?._id === user?._id
  const partner      = s => isTeacher(s) ? s.learnerId : s.teacherId
  const hasConfirmed = s => isTeacher(s) ? s.teacherConfirmed : s.learnerConfirmed
  const pendingCount = sessions.filter(s => s.status === 'pending' && isTeacher(s)).length
  const unratedCount = sessions.filter(s => s.canRate).length

  const accept = async id => {
    setBusy(id + 'accept')
    try { await sessionApi.accept(id); toast.success('Session accepted!'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setBusy(null) }
  }

  const cancel = async () => {
    setBusy(cancelModal._id + 'cancel')
    try {
      await sessionApi.cancel(cancelModal._id, cancelReason)
      toast.success('Cancelled')
      setCancelModal(null); setCancelReason(''); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setBusy(null) }
  }

  const confirm = async id => {
    setBusy(id + 'confirm')
    try {
      const { data } = await sessionApi.confirm(id)
      toast.success(data.message || 'Confirmed!')
      load()
    }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setBusy(null) }
  }

  const rate = async () => {
    if (!ratingForm.score) { toast.error('Please select a star rating'); return }
    setBusy('rate')
    try {
      await ratingApi.submit({ sessionId: rateModal._id, ...ratingForm })
      toast.success('Rating submitted! Thank you 🙏')
      dismissRatingPrompt(rateModal._id)
      setRateModal(null)
      setRatingForm({ score:0, comment:'' })
      load()
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit'
      if (msg.includes('already rated')) toast.error('You already rated this session.')
      else toast.error(msg)
    }
    finally { setBusy(null) }
  }

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
              <span className="text-xs font-semibold text-yellow-600">
                {pendingCount} pending request{pendingCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {unratedCount > 0 && (
            <div className="flex items-center gap-2 rounded-full px-3 py-1"
              style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)' }}>
              <span className="text-orange-500 text-xs font-semibold">
                ⭐ {unratedCount} session{unratedCount !== 1 ? 's' : ''} to rate
              </span>
            </div>
          )}
        </div>
      </div>

      {/* How ratings work — shown only if user has accepted sessions */}
      {sessions.some(s => s.status === 'accepted') && (
        <div className="rounded-xl p-3 mb-5 flex gap-3 items-start"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <span className="text-lg mt-0.5">💡</span>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text)' }}>How to complete a session:</strong>{' '}
            After the session ends, click <strong>"Confirm done"</strong>. If the session time has
            already passed, one confirmation is enough. Credits transfer and rating opens automatically.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0.5 rounded-lg p-0.5 mb-6 flex-wrap"
        style={{ background: 'var(--surface-2)' }}>
        {TABS.map(({ val, label }) => (
          <button key={val} onClick={() => setTab(val)}
            className="flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all relative min-w-fit"
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
            {val === 'completed' && unratedCount > 0 && tab !== 'completed' && (
              <span className="absolute -top-1 -right-0.5 w-3.5 h-3.5 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unratedCount}
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
            const p          = partner(s)
            const teach      = isTeacher(s)
            const upcoming   = s.scheduledAt && isFuture(new Date(s.scheduledAt))
            const past       = s.scheduledAt && isPast(new Date(s.scheduledAt))
            const canConfirm = s.status === 'accepted' && past && !hasConfirmed(s)
            const waitingOther = s.status === 'accepted' && past && hasConfirmed(s)
            const canRate    = s.canRate  // ← from backend, not ratingPending
            const st         = STATUS[s.status] || STATUS.pending

            return (
              <div key={s._id} className="card p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar + number */}
                  <div className="relative flex-shrink-0">
                    <Avatar src={p?.avatarUrl} name={p?.name} size={40} />
                    <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      {i + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Status + skill + role */}
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`badge text-xs ${st.badge}`}>{st.label}</span>
                        <span className="badge-gray text-xs">{s.skillId?.name}</span>
                        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                          {teach ? '🎓 Teaching' : '📚 Learning'}
                        </span>
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

                    {/* Partner name */}
                    <p className="text-sm mb-1" style={{ color: 'var(--text-2)' }}>
                      {teach ? 'Teaching ' : 'Learning from '}
                      <button onClick={() => nav(`/profile/${p?._id}`)}
                        className="font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                        {p?.name}
                      </button>
                    </p>

                    {s.notes && (
                      <p className="text-xs italic mb-2" style={{ color: 'var(--text-faint)' }}>"{s.notes}"</p>
                    )}

                    {/* Credit info for completed */}
                    {s.status === 'completed' && (
                      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                        {s.creditsEligible
                          ? `🪙 ${s.creditsAmount} credit${s.creditsAmount !== 1 ? 's' : ''} transferred`
                          : '⚠️ No credits (weekly limit reached)'}
                      </p>
                    )}

                    {/* Waiting hint */}
                    {waitingOther && (
                      <p className="text-xs mb-2 text-blue-500">
                        ⏳ You confirmed — waiting for {p?.name} to confirm too
                      </p>
                    )}

                    {/* Rated badge */}
                    {s.status === 'completed' && s.userHasRated && (
                      <p className="text-xs mb-2 text-green-600">✓ You've rated this session</p>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap mt-2">
                      {/* Accept (teacher only, pending) */}
                      {teach && s.status === 'pending' && (
                        <button onClick={() => accept(s._id)} disabled={busy === s._id + 'accept'}
                          className="btn btn-primary btn-sm">
                          <IconCheck size={13} />
                          {busy === s._id + 'accept' ? 'Accepting…' : 'Accept'}
                        </button>
                      )}

                      {/* Join call */}
                      {s.status === 'accepted' && s.videoLink && upcoming && (
                        <a href={s.videoLink} target="_blank" rel="noopener noreferrer"
                          className="btn btn-primary btn-sm">
                          <IconVideo size={13} /> Join call
                        </a>
                      )}

                      {/* Message */}
                      {['accepted','completed','pending'].includes(s.status) && (
                        <button onClick={() => nav(`/chat/${p?._id}`)} className="btn btn-white btn-sm">
                          <IconChat size={13} /> Message
                        </button>
                      )}

                      {/* Confirm done */}
                      {canConfirm && (
                        <button onClick={() => confirm(s._id)} disabled={busy === s._id + 'confirm'}
                          className="btn btn-primary btn-sm">
                          <IconCheck size={13} />
                          {busy === s._id + 'confirm' ? 'Confirming…' : 'Mark as done'}
                        </button>
                      )}

                      {/* Rate */}
                      {canRate && (
                        <button onClick={() => { setRateModal(s); setRatingForm({ score:0, comment:'' }) }}
                          className="btn btn-white btn-sm"
                          style={{ border: '1px solid #f97316', color: '#f97316' }}>
                          ⭐ Leave a rating
                        </button>
                      )}

                      {/* Cancel */}
                      {['pending','accepted'].includes(s.status) && (
                        <button onClick={() => setCancelModal(s)}
                          className="btn btn-danger btn-sm">
                          <IconX size={13} /> Cancel
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

      {/* Cancel modal */}
      <Modal open={!!cancelModal} onClose={() => setCancelModal(null)} title="Cancel session">
        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            The other participant will be notified.
          </p>
          <div>
            <label className="label">Reason (optional)</label>
            <textarea className="input resize-none" rows={3}
              placeholder="Let them know why…"
              value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-white btn-md flex-1" onClick={() => setCancelModal(null)}>
              Keep it
            </button>
            <button className="btn btn-danger btn-md flex-1" onClick={cancel} disabled={!!busy}>
              Cancel session
            </button>
          </div>
        </div>
      </Modal>

      {/* Rate modal */}
      <Modal open={!!rateModal} onClose={() => setRateModal(null)} title="Rate your session">
        {rateModal && (
          <div className="space-y-4">
            {/* Partner info */}
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

            {/* Stars */}
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

            {/* Comment */}
            <div>
              <label className="label">Write a review (optional)</label>
              <textarea className="input resize-none" rows={3}
                placeholder="Share what you learned, how the session went…"
                value={ratingForm.comment}
                onChange={e => setRatingForm(f => ({ ...f, comment: e.target.value }))} />
            </div>

            <div className="flex gap-2">
              <button className="btn btn-white btn-md flex-1" onClick={() => setRateModal(null)}>
                Skip
              </button>
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