import { useState, useEffect } from 'react'
import { skillApi, userApi } from '../api/index'
import { Modal } from '../components/common/index'
import Loader from '../components/common/Loader'
import toast from 'react-hot-toast'

const CAT_EMOJI = {
  Programming:'💻', Design:'🎨', Language:'🌍', Music:'🎵',
  Business:'📊', Finance:'💰', 'Arts & Crafts':'🖌️',
  'Sports & Fitness':'🏃', Cooking:'🍳', Science:'🔬',
  Marketing:'📣', Other:'✨',
}

export default function SkillsPage() {
  const [allSkills, setAllSkills]   = useState([])
  const [mySkills, setMySkills]     = useState([])
  const [categories, setCategories] = useState([])
  const [cat, setCat]               = useState('')
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(null)
  const [addForm, setAddForm]       = useState({ type:'teach', level:'intermediate', description:'' })
  const [adding, setAdding]         = useState(false)

  const load = () => Promise.all([
    skillApi.list({ limit: 300 }).then(({ data }) => setAllSkills(data.data.skills)),
    skillApi.getCategories().then(({ data }) => setCategories(data.data.categories)),
    userApi.getMe().then(({ data }) => {
      const me = data.data
      setMySkills([
        ...me.teachSkills.map(s => ({ ...s, type: 'teach' })),
        ...me.learnSkills.map(s => ({ ...s, type: 'learn' })),
      ])
    }),
  ])

  useEffect(() => {
    load().catch(() => toast.error('Failed to load')).finally(() => setLoading(false))
  }, [])

  const filtered = allSkills.filter(s =>
    (!cat || s.category === cat) &&
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const myIds = new Set(mySkills.map(s => `${s.skillId?._id || s.skillId}:${s.type}`))

  const handleAdd = async () => {
    setAdding(true)
    try {
      await userApi.addSkill({
        skillId: modal._id,
        type: addForm.type,
        level: addForm.type === 'teach' ? addForm.level : undefined,
        description: addForm.description,
      })
      await load()
      toast.success(`Added ${modal.name}!`)
      setModal(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add skill')
    } finally { setAdding(false) }
  }

  const handleRemove = async (id, name) => {
    try {
      await userApi.removeSkill(id)
      setMySkills(p => p.filter(s => s._id !== id))
      toast.success(`Removed ${name}`)
    } catch { toast.error('Failed to remove') }
  }

  if (loading) return <Loader />

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Skills</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Browse and manage your skill profile
        </p>
      </div>

      {/* My skills */}
      {mySkills.length > 0 && (
        <div className="card p-5 mb-5">
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>My skills</h2>
          <div className="space-y-4">
            {['teach', 'learn'].map(type => {
              const list = mySkills.filter(s => s.type === type)
              if (!list.length) return null
              return (
                <div key={type}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: 'var(--text-faint)' }}>
                    {type === 'teach' ? '🎓 Teaching' : '📚 Learning'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {list.map(s => (
                      <span key={s._id}
                        className={`badge gap-1.5 ${type === 'teach' ? 'badge-orange' : 'badge-blue'}`}>
                        {s.skillId?.name}
                        {s.level && (
                          <span className="opacity-60 text-[10px]">· {s.level}</span>
                        )}
                        <button
                          onClick={() => handleRemove(s._id, s.skillId?.name)}
                          className="opacity-50 hover:opacity-100 transition-opacity leading-none">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          className="input flex-1 min-w-40"
          placeholder="Search skills…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="input w-auto"
          value={cat}
          onChange={e => setCat(e.target.value)}
          style={{ background: 'var(--surface)', color: 'var(--text)' }}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Skill grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>No skills found</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Try a different search or category
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {filtered.map(skill => {
            const hasTeach = myIds.has(`${skill._id}:teach`)
            const hasLearn = myIds.has(`${skill._id}:learn`)
            const bothAdded = hasTeach && hasLearn

            return (
              <div
                key={skill._id}
                className="rounded-xl p-3 text-center transition-all"
                style={{
                  background: bothAdded ? 'var(--accent-bg)' : 'var(--surface)',
                  border: `1px solid ${bothAdded ? 'var(--accent-border)' : 'var(--border)'}`,
                  boxShadow: 'var(--shadow)',
                }}>
                <div className="text-xl mb-1.5">{CAT_EMOJI[skill.category] || '✨'}</div>
                <p
                  className="font-semibold text-xs leading-tight mb-0.5"
                  style={{ color: 'var(--text)' }}>
                  {skill.name}
                </p>
                <p
                  className="text-[10px] mb-2.5"
                  style={{ color: 'var(--text-faint)' }}>
                  {skill.category}
                </p>

                {bothAdded ? (
                  <span className="badge-green text-[10px]">✓ Added</span>
                ) : (
                  <button
                    onClick={() => {
                      setModal(skill)
                      setAddForm({ type: 'teach', level: 'intermediate', description: '' })
                    }}
                    className="w-full text-xs font-semibold rounded-lg py-1 transition-all"
                    style={{
                      background: 'var(--surface-2)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#f97316'
                      e.currentTarget.style.color = '#fff'
                      e.currentTarget.style.borderColor = '#f97316'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'var(--surface-2)'
                      e.currentTarget.style.color = 'var(--text-muted)'
                      e.currentTarget.style.borderColor = 'var(--border)'
                    }}>
                    + Add
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add skill modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={`Add "${modal?.name}"`}>
        <div className="space-y-4">
          {/* Teach or Learn */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: 'teach', l: '🎓 Teach it', s: 'Earn 1 credit per session' },
              { v: 'learn', l: '📚 Learn it', s: 'Spend 1 credit per session' },
            ].map(({ v, l, s }) => {
              const active = addForm.type === v
              return (
                <button
                  key={v}
                  onClick={() => setAddForm(f => ({ ...f, type: v }))}
                  className="p-3 rounded-lg text-left transition-all"
                  style={{
                    border: `1px solid ${active
                      ? v === 'teach' ? '#f97316' : '#3b82f6'
                      : 'var(--border)'}`,
                    background: active
                      ? v === 'teach' ? 'var(--accent-bg)' : 'rgba(59,130,246,0.08)'
                      : 'var(--surface-2)',
                  }}>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{l}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s}</p>
                </button>
              )
            })}
          </div>

          {/* Level picker (teach only) */}
          {addForm.type === 'teach' && (
            <div>
              <label className="label">Your level</label>
              <div className="flex gap-1">
                {['beginner', 'intermediate', 'advanced'].map(l => {
                  const active = addForm.level === l
                  return (
                    <button
                      key={l}
                      onClick={() => setAddForm(f => ({ ...f, level: l }))}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                      style={{
                        border: `1px solid ${active ? '#f97316' : 'var(--border)'}`,
                        background: active ? 'var(--accent-bg)' : 'var(--surface-2)',
                        color: active ? '#f97316' : 'var(--text-muted)',
                      }}>
                      {l}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="label">Description (optional)</label>
            <textarea
              className="input resize-none" rows={3}
              placeholder="Describe your experience or what you hope to learn…"
              value={addForm.description}
              onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button className="btn btn-white btn-md flex-1" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button className="btn btn-primary btn-md flex-1" onClick={handleAdd} disabled={adding}>
              {adding ? 'Adding…' : 'Add skill'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}