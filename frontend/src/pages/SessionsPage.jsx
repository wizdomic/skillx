import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { sessionApi, ratingApi } from '../api/index'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { Avatar, StarRating, Modal } from '../components/common/index'
import { IconCheck, IconX, IconChat } from '../components/common/AppLayout'
import Loader from '../components/common/Loader'
import toast from 'react-hot-toast'
import { format, isFuture, isPast } from 'date-fns'

const STATUS_COLOR = {
  pending:   { bg: '#fef9c3', color: '#854d0e', label: 'Pending' },
  accepted:  { bg: '#dbeafe', color: '#1e40af', label: 'Upcoming' },
  completed: { bg: '#dcfce7', color: '#166534', label: 'Done' },
  cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
}

const TABS = [
  { val: '',          label: 'All' },
  { val: 'pending',   label: 'Pending' },
  { val: 'accepted',  label: 'Upcoming' },
  { val: 'completed', label: 'Done' },
  { val: 'cancelled', label: 'Cancelled' },
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
  const [ratingForm, setRatingForm]     = useState({ score: 0, comment: '' })
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

  const accept = async id => {
    setBusy(id + 'accept')
    try { await sessionApi.accept(id); toast.success('Session accepted!'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setBusy(null) }
  }

  const cancel = async () => {
    setBusy('cancel')
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
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setBusy(null) }
  }

  const rate = async () => {
    if (!ratingForm.score) { toast.error('Select a star rating'); return }
    setBusy('rate')
    try {
      await ratingApi.submit({ sessionId: rateModal._id, ...ratingForm })
      toast.success('Rating submitted!')
      dismissRatingPrompt(rateModal._id)
      setRateModal(null)
      setRatingForm({ score: 0, comment: '' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message?.includes('already') ? 'Already rated.' : 'Failed to submit')
    } finally { setBusy(null) }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 8px' }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Sessions</h1>
        {pendingCount > 0 && (
          <p style={{ fontSize: 13, color: '#b45309', marginTop: 4 }}>
            {pendingCount} pending request{pendingCount !== 1 ? 's' : ''} waiting for your response
          </p>
        )}
      </div>

      {/* Tabs — horizontal scroll on mobile */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 16, scrollbarWidth: 'none' }}>
        {TABS.map(({ val, label }) => {
          const active = tab === val
          const isPending = val === 'pending' && pendingCount > 0
          return (
            <button key={val} onClick={() => setTab(val)}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                border: active ? '1px solid var(--brand)' : '1px solid var(--border)',
                background: active ? 'var(--brand)' : 'var(--surface)',
                color: active ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                position: 'relative',
              }}>
              {label}
              {isPending && !active && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 14, height: 14, borderRadius: '50%',
                  background: '#eab308', color: '#fff',
                  fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{pendingCount}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* List */}
      {loading ? <Loader /> : sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
          <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No sessions here</p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {tab ? `No ${tab} sessions.` : 'Book a session from the dashboard.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sessions.map(s => {
            const p          = partner(s)
            const teach      = isTeacher(s)
            const past       = s.scheduledAt && isPast(new Date(s.scheduledAt))
            const upcoming   = s.scheduledAt && isFuture(new Date(s.scheduledAt))
            const canConfirm = s.status === 'accepted' && past && !hasConfirmed(s)
            const waitConfirm= s.status === 'accepted' && past && hasConfirmed(s)
            const st         = STATUS_COLOR[s.status] || STATUS_COLOR.pending

            return (
              <div key={s._id} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 14,
              }}>
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <button onClick={() => nav(`/profile/${p?._id}`)} style={{ flexShrink: 0 }}>
                    <Avatar src={p?.avatarUrl} name={p?.name} size={40} />
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{p?.name}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                        background: st.bg, color: st.color,
                      }}>{st.label}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                      {teach ? '🎓 Teaching' : '📚 Learning'} · {s.skillId?.name}
                    </p>
                  </div>
                </div>

                {/* Date + time */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'var(--surface-2)', borderRadius: 8,
                  padding: '7px 10px', marginBottom: 10,
                }}>
                  <span style={{ fontSize: 14 }}>📅</span>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                    {format(new Date(s.scheduledAt), 'EEE, MMM d · h:mm a')}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-faint)', marginLeft: 'auto' }}>
                    {s.durationMins}min
                  </span>
                </div>

                {/* Notes */}
                {s.notes && (
                  <p style={{ fontSize: 12, color: 'var(--text-faint)', fontStyle: 'italic', marginBottom: 10 }}>
                    "{s.notes}"
                  </p>
                )}

                {/* Status messages */}
                {s.status === 'completed' && (
                  <p style={{ fontSize: 12, color: s.creditsEligible ? '#16a34a' : '#b45309', marginBottom: 8 }}>
                    {s.creditsEligible
                      ? `✓ ${s.creditsAmount} credit${s.creditsAmount !== 1 ? 's' : ''} transferred`
                      : '⚠️ No credits — weekly limit reached'}
                  </p>
                )}
                {waitConfirm && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                    ⏳ You confirmed — waiting for {p?.name}
                  </p>
                )}
                {s.userHasRated && (
                  <p style={{ fontSize: 12, color: '#16a34a', marginBottom: 8 }}>✓ Rated</p>
                )}
                {s.status === 'cancelled' && s.cancelReason && (
                  <p style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>
                    Reason: {s.cancelReason}
                  </p>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {teach && s.status === 'pending' && (
                    <button onClick={() => accept(s._id)} disabled={busy === s._id + 'accept'}
                      style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--brand)', color: '#fff', border: 'none', cursor: 'pointer', minWidth: 80 }}>
                      {busy === s._id + 'accept' ? '…' : '✓ Accept'}
                    </button>
                  )}
                  {canConfirm && (
                    <button onClick={() => confirm(s._id)} disabled={busy === s._id + 'confirm'}
                      style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--brand)', color: '#fff', border: 'none', cursor: 'pointer', minWidth: 80 }}>
                      {busy === s._id + 'confirm' ? '…' : '✓ Mark done'}
                    </button>
                  )}
                  {s.canRate && (
                    <button onClick={() => { setRateModal(s); setRatingForm({ score: 0, comment: '' }) }}
                      style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', cursor: 'pointer', minWidth: 80 }}>
                      ⭐ Rate
                    </button>
                  )}
                  {['pending','accepted','completed'].includes(s.status) && (
                    <button onClick={() => nav(`/chat/${p?._id}`)}
                      style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', cursor: 'pointer', minWidth: 80 }}>
                      💬 Chat
                    </button>
                  )}
                  {['pending','accepted'].includes(s.status) && (
                    <button onClick={() => setCancelModal(s)}
                      style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'transparent', color: '#ef4444', border: '1px solid #fca5a5', cursor: 'pointer', minWidth: 80 }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Cancel modal */}
      <Modal open={!!cancelModal} onClose={() => setCancelModal(null)} title="Cancel session">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>The other person will be notified.</p>
          <div>
            <label className="label">Reason (optional)</label>
            <textarea className="input" style={{ resize: 'none' }} rows={3}
              placeholder="Let them know why…"
              value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-white btn-md" style={{ flex: 1 }} onClick={() => setCancelModal(null)}>Keep</button>
            <button style={{ flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 14, fontWeight: 600, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}
              onClick={cancel} disabled={busy === 'cancel'}>
              {busy === 'cancel' ? '…' : 'Cancel session'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Rate modal */}
      <Modal open={!!rateModal} onClose={() => setRateModal(null)} title="Rate your session">
        {rateModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <Avatar src={partner(rateModal)?.avatarUrl} name={partner(rateModal)?.name} size={40} />
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: 0 }}>{partner(rateModal)?.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  {rateModal.skillId?.name} · {format(new Date(rateModal.scheduledAt), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>How was your experience?</p>
              <StarRating value={ratingForm.score} onChange={v => setRatingForm(f => ({ ...f, score: v }))} size={40} />
              {ratingForm.score > 0 && (
                <p style={{ fontSize: 14, marginTop: 8, color: 'var(--text-muted)' }}>
                  {['','😞 Poor','😐 Fair','🙂 Good','😊 Great','🤩 Excellent!'][ratingForm.score]}
                </p>
              )}
            </div>
            <div>
              <label className="label">Review (optional)</label>
              <textarea className="input" style={{ resize: 'none' }} rows={3}
                placeholder="Share how it went…"
                value={ratingForm.comment}
                onChange={e => setRatingForm(f => ({ ...f, comment: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-white btn-md" style={{ flex: 1 }} onClick={() => setRateModal(null)}>Skip</button>
              <button className="btn btn-primary btn-md" style={{ flex: 1 }} onClick={rate}
                disabled={busy === 'rate' || !ratingForm.score}>
                {busy === 'rate' ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}