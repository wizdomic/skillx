import { useState, useEffect } from 'react'
import { skillApi, userApi } from '../api/index'
import { Modal } from '../components/common/index'
import Loader from '../components/common/Loader'
import toast from 'react-hot-toast'

const CAT_EMOJI = {
  'Programming':      '💻',
  'AI & No-Code':     '🤖',
  'Design':           '🎨',
  'Language':         '🌍',
  'Music':            '🎵',
  'Business':         '📊',
  'Finance':          '💰',
  'Marketing':        '📣',
  'Arts & Crafts':    '🖌️',
  'Sports & Fitness': '🏃',
  'Cooking':          '🍳',
  'Science':          '🔬',
  'Career & Exams':   '🎯',
  'Other':            '✨',
}

// Top 20 most valuable skills for India 2026
const TOP_SKILLS = [
  'Prompt Engineering', 'React', 'Next.js', 'Python', 'Machine Learning',
  'System Design', 'AWS', 'TypeScript', 'Flutter', 'UI/UX Design',
  'Spring Boot', 'PostgreSQL', 'LangChain', 'Performance Marketing',
  'Financial Modeling', 'English Communication', 'Cybersecurity',
  'Webflow', 'Content Creation', 'Interview Preparation',
]

export default function SkillsPage() {
  const [allSkills, setAllSkills]   = useState([])
  const [mySkills, setMySkills]     = useState([])
  const [categories, setCategories] = useState([])
  const [cat, setCat]               = useState('')
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(null)
  const [addForm, setAddForm]       = useState({ type: 'teach', level: 'intermediate', description: '' })
  const [adding, setAdding]         = useState(false)
  const [showTop, setShowTop]       = useState(true)

  const load = () => Promise.all([
    skillApi.list({ limit: 500 }).then(({ data }) => setAllSkills(data.data.skills)),
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

  const myIds = new Set(mySkills.map(s => `${s.skillId?._id || s.skillId}:${s.type}`))

  const topSkillObjects = allSkills.filter(s => TOP_SKILLS.includes(s.name))

  const filtered = (search || cat)
    ? allSkills.filter(s =>
        (!cat || s.category === cat) &&
        s.name.toLowerCase().includes(search.toLowerCase())
      )
    : allSkills

  const openModal = (skill) => {
    const hasTeach = myIds.has(`${skill._id}:teach`)
    const hasLearn = myIds.has(`${skill._id}:learn`)
    // Default to the type not yet added
    const defaultType = hasTeach ? 'learn' : 'teach'
    setModal(skill)
    setAddForm({ type: defaultType, level: 'intermediate', description: '' })
  }

  const handleAdd = async () => {
    setAdding(true)
    try {
      await userApi.addSkill({
        skillId:     modal._id,
        type:        addForm.type,
        level:       addForm.type === 'teach' ? addForm.level : undefined,
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
          {allSkills.length} skills across {categories.length} categories
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
                        {s.level && <span className="opacity-60 text-[10px]">· {s.level}</span>}
                        <button onClick={() => handleRemove(s._id, s.skillId?.name)}
                          className="opacity-50 hover:opacity-100 transition-opacity leading-none">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Top skills for India 2026 */}
      {!search && !cat && topSkillObjects.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🔥</span>
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                Top skills — India 2026
              </h2>
              <span className="badge-orange text-[10px]">High demand</span>
            </div>
            <button onClick={() => setShowTop(p => !p)}
              className="text-xs transition-colors"
              style={{ color: 'var(--text-faint)' }}>
              {showTop ? 'Hide' : 'Show'}
            </button>
          </div>
          {showTop && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {topSkillObjects.map(skill => {
                const hasTeach  = myIds.has(`${skill._id}:teach`)
                const hasLearn  = myIds.has(`${skill._id}:learn`)
                const bothAdded = hasTeach && hasLearn
                return (
                  <SkillCard key={skill._id} skill={skill} myIds={myIds}
                    onAdd={() => openModal(skill)} />
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Search + filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input className="input flex-1 min-w-40" placeholder="Search all skills…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input w-auto" value={cat}
          onChange={e => setCat(e.target.value)}
          style={{ background: 'var(--surface)', color: 'var(--text)' }}>
          <option value="">All categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{CAT_EMOJI[c] || '✨'} {c}</option>
          ))}
        </select>
      </div>

      {/* Category browsing (no search active) */}
      {!search && !cat ? (
        <div className="space-y-8">
          {categories.map(category => {
            const catSkills = allSkills.filter(s => s.category === category)
            if (!catSkills.length) return null
            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    <span>{CAT_EMOJI[category] || '✨'}</span>
                    {category}
                    <span className="text-xs font-normal" style={{ color: 'var(--text-faint)' }}>
                      {catSkills.length}
                    </span>
                  </h3>
                  <button onClick={() => setCat(category)}
                    className="text-xs transition-colors"
                    style={{ color: 'var(--brand)' }}>
                    See all →
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {catSkills.slice(0, 10).map(skill => {
                    const bothAdded = myIds.has(`${skill._id}:teach`) && myIds.has(`${skill._id}:learn`)
                    return (
                      <SkillCard key={skill._id} skill={skill} myIds={myIds}
                        onAdd={() => openModal(skill)} />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Search / filter results */
        filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>No skills found</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Try a different search or category
            </p>
            <button onClick={() => { setSearch(''); setCat('') }} className="btn btn-white btn-sm">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {filtered.map(skill => {
              const bothAdded = myIds.has(`${skill._id}:teach`) && myIds.has(`${skill._id}:learn`)
              return (
                <SkillCard key={skill._id} skill={skill} myIds={myIds}
                  onAdd={() => openModal(skill)} />
              )
            })}
          </div>
        )
      )}

      {/* Add skill modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={`Add "${modal?.name}"`}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: 'teach', l: '🎓 Teach it', s: 'Earn 1 credit per session' },
              { v: 'learn', l: '📚 Learn it', s: 'Spend 1 credit per session' },
            ].map(({ v, l, s }) => {
              const active   = addForm.type === v
              const alreadyAdded = modal && myIds.has(`${modal._id}:${v}`)
              return (
                <button key={v}
                  onClick={() => !alreadyAdded && setAddForm(f => ({ ...f, type: v }))}
                  disabled={alreadyAdded}
                  className="p-3 rounded-lg text-left transition-all"
                  style={{
                    border:     `1px solid ${alreadyAdded ? 'var(--border)' : active ? (v === 'teach' ? 'var(--brand)' : '#3b82f6') : 'var(--border)'}`,
                    background: alreadyAdded ? 'var(--surface-2)' : active ? (v === 'teach' ? 'var(--accent-bg)' : 'rgba(59,130,246,0.08)') : 'var(--surface-2)',
                    opacity:    alreadyAdded ? 0.5 : 1,
                    cursor:     alreadyAdded ? 'not-allowed' : 'pointer',
                  }}>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{l}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {alreadyAdded ? '✓ Already added' : s}
                  </p>
                </button>
              )
            })}
          </div>

          {addForm.type === 'teach' && (
            <div>
              <label className="label">Your level</label>
              <div className="flex gap-1">
                {['beginner', 'intermediate', 'advanced'].map(l => {
                  const active = addForm.level === l
                  return (
                    <button key={l} onClick={() => setAddForm(f => ({ ...f, level: l }))}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                      style={{
                        border:     `1px solid ${active ? 'var(--brand)' : 'var(--border)'}`,
                        background: active ? 'var(--accent-bg)' : 'var(--surface-2)',
                        color:      active ? 'var(--brand)'     : 'var(--text-muted)',
                      }}>
                      {l}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <label className="label">Description (optional)</label>
            <textarea className="input resize-none" rows={3}
              placeholder="Describe your experience or what you hope to learn…"
              value={addForm.description}
              onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="flex gap-2">
            <button className="btn btn-white btn-md flex-1" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary btn-md flex-1" onClick={handleAdd} disabled={adding}>
              {adding ? 'Adding…' : 'Add skill'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function SkillCard({ skill, myIds, onAdd }) {
  const hasTeach  = myIds.has(`${skill._id}:teach`)
  const hasLearn  = myIds.has(`${skill._id}:learn`)
  const bothAdded = hasTeach && hasLearn

  let statusBadge = null
  if (bothAdded) {
    statusBadge = <span className="badge-green text-[10px]">✓ Both added</span>
  } else if (hasTeach) {
    statusBadge = <span className="badge-orange text-[10px]">🎓 Teaching</span>
  } else if (hasLearn) {
    statusBadge = <span className="badge-blue text-[10px]">📚 Learning</span>
  }

  return (
    <div className="rounded-xl p-3 text-center transition-all"
      style={{
        background: bothAdded ? 'var(--accent-bg)' : 'var(--surface)',
        border:     `1px solid ${bothAdded ? 'var(--accent-border)' : 'var(--border)'}`,
        boxShadow:  'var(--shadow)',
      }}>
      <div className="text-xl mb-1.5">{CAT_EMOJI[skill.category] || '✨'}</div>
      <p className="font-semibold text-xs leading-tight mb-0.5" style={{ color: 'var(--text)' }}>
        {skill.name}
      </p>
      <p className="text-[10px] mb-2.5" style={{ color: 'var(--text-faint)' }}>
        {skill.category}
      </p>
      {bothAdded ? (
        <span className="badge-green text-[10px]">✓ Added</span>
      ) : statusBadge ? (
        <button onClick={onAdd}
          className="w-full text-xs font-semibold rounded-lg py-1 transition-all"
          style={{ background: 'var(--surface-2)', color: 'var(--brand)', border: '1px solid var(--brand-border)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--brand)' }}>
          + Add other
        </button>
      ) : (
        <button onClick={onAdd}
          className="w-full text-xs font-semibold rounded-lg py-1 transition-all"
          style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--brand)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
          + Add
        </button>
      )}
    </div>
  )
}