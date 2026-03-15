import { useState, useEffect } from 'react'
import { requestApi, skillApi } from '../api/index'
import { useAuthStore } from '../store/authStore'
import { Avatar, Modal } from '../components/common/index'
import Loader from '../components/common/Loader'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

export default function SkillRequestBoardPage() {
  const { user } = useAuthStore()
  const [requests, setRequests]     = useState([])
  const [skills, setSkills]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState({ type:'', skillId:'' })
  const [createModal, setCreateModal] = useState(false)
  const [form, setForm]             = useState({ skillId:'', type:'offer', title:'', description:'' })
  const [creating, setCreating]     = useState(false)

  const load = (f = filter) =>
    requestApi.list(f.type || f.skillId
      ? { type: f.type || undefined, skillId: f.skillId || undefined }
      : {}
    ).then(({ data }) => setRequests(data.data.requests))

  useEffect(() => {
    setLoading(true)
    Promise.all([
      load(),
      skillApi.list({ limit: 200 }).then(({ data }) => setSkills(data.data.skills)),
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
      setForm({ skillId:'', type:'offer', title:'', description:'' })
      load()
    } catch { toast.error('Failed') }
    finally { setCreating(false) }
  }

  const del = async id => {
    if (!confirm('Delete this request?')) return
    await requestApi.delete(id)
    setRequests(p => p.filter(r => r._id !== id))
    toast.success('Deleted')
  }

  if (loading) return <Loader />

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Skill Board</h1>
          <p className="text-gray-500 text-sm mt-0.5">Browse skill offers and requests</p>
        </div>
        <button onClick={() => setCreateModal(true)} className="btn btn-primary btn-md">+ Post</button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {[{v:'',l:'All'},{v:'offer',l:'🎓 Offering'},{v:'wanted',l:'📚 Wanted'}].map(({v,l}) => (
            <button key={v} onClick={() => setFilter(f => ({ ...f, type: v }))}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all
                ${filter.type === v ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
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

      {requests.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-semibold text-gray-900 mb-1">No requests yet</p>
          <p className="text-gray-500 text-sm mb-4">Be the first to post!</p>
          <button onClick={() => setCreateModal(true)} className="btn btn-primary btn-md">Post first request</button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req._id} className="card p-4 hover:border-gray-300 transition-all">
              <div className="flex items-start gap-3">
                <Avatar src={req.userId?.avatarUrl} name={req.userId?.name} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={req.type === 'offer' ? 'badge-orange' : 'badge-blue'}>
                        {req.type === 'offer' ? '🎓 Offering' : '📚 Wanted'}
                      </span>
                      <span className="badge-gray">{req.skillId?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                      </span>
                      {req.userId?._id === user?._id && (
                        <button onClick={() => del(req._id)}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{req.title}</h3>
                  <p className="text-gray-500 text-sm line-clamp-2">{req.description}</p>
                  <p className="text-xs text-gray-400 mt-1.5 font-medium">{req.userId?.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Post a request">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[{v:'offer',l:'🎓 Offering to teach'},{v:'wanted',l:'📚 Looking to learn'}].map(({v,l}) => (
              <button key={v} onClick={() => setForm(f => ({ ...f, type: v }))}
                className={`p-3 rounded-lg border text-sm text-left transition-all
                  ${form.type === v ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                {l}
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
            <input className="input"
              placeholder={form.type === 'offer' ? 'e.g. Teaching React to beginners' : 'e.g. Looking for a guitar teacher'}
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={150} />
          </div>
          <div>
            <label className="label">Description *</label>
            <textarea className="input resize-none" rows={4}
              placeholder="Your experience, availability, goals…"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} maxLength={1000} />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-white btn-md flex-1" onClick={() => setCreateModal(false)}>Cancel</button>
            <button className="btn btn-primary btn-md flex-1" onClick={handleCreate} disabled={creating}>
              {creating ? 'Posting…' : 'Post request'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}