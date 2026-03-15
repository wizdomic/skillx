import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { skillApi, userApi } from '../api/index'
import { useAuthStore } from '../store/authStore'
import Loader from '../components/common/Loader'
import toast from 'react-hot-toast'

export default function OnboardingPage() {
  const nav = useNavigate()
  const { user, updateUser } = useAuthStore()
  const [step, setStep] = useState(0)
  const [skills, setSkills] = useState([])
  const [search, setSearch] = useState('')
  const [teachSkills, setTeachSkills] = useState([])
  const [learnSkills, setLearnSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    skillApi.list({ limit: 300 })
      .then(({ data }) => setSkills(data.data.skills))
      .catch(() => toast.error('Failed to load skills'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = skills.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
  const getName = id => skills.find(s => s._id === id)?.name || id

  const toggleTeach = s => setTeachSkills(p =>
    p.find(x => x.skillId === s._id) ? p.filter(x => x.skillId !== s._id) : [...p, { skillId: s._id, level: 'intermediate' }])
  const toggleLearn = s => setLearnSkills(p =>
    p.find(x => x.skillId === s._id) ? p.filter(x => x.skillId !== s._id) : [...p, { skillId: s._id }])

  const finish = async () => {
    if (!teachSkills.length && !learnSkills.length) { toast.error('Select at least one skill'); return }
    setSaving(true)
    try {
      await userApi.completeOnboarding({ teachSkills, learnSkills })
      updateUser({ onboardingCompleted: true })
      setStep(3)
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  if (loading) return <Loader fullscreen />

  const STEPS = ['Welcome', 'Teach', 'Learn', 'Done']
  const isTeach = step === 1
  const selected = isTeach ? teachSkills : learnSkills

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: i < step ? '#f97316' : i === step ? 'var(--accent-bg)' : 'var(--surface-2)',
                  color: i < step ? '#fff' : i === step ? '#f97316' : 'var(--text-faint)',
                  border: i === step ? '2px solid #f97316' : '2px solid transparent',
                }}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-6 h-px" style={{ background: i < step ? '#f97316' : 'var(--border)' }} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-6">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="text-5xl mb-4">👋</div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                Welcome, {user?.name?.split(' ')[0]}!
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                Tell us what you can teach and want to learn. Takes 2 minutes.
              </p>
              <div className="flex gap-3 justify-center mb-6">
                {[
                  { value: user?.creditBalance || 10, label: 'starting credits', color: 'text-orange-500' },
                  { value: '1:1', label: 'live sessions', color: '' },
                ].map(s => (
                  <div key={s.label} className="card px-5 py-3 text-center shadow-none flex-1">
                    <p className={`font-bold text-xl ${s.color}`} style={!s.color ? { color: 'var(--text)' } : {}}>{s.value}</p>
                    <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{s.label}</p>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary btn-lg w-full" onClick={() => setStep(1)}>
                Get started →
              </button>
            </div>
          )}

          {/* Steps 1 & 2: Skill selection */}
          {(step === 1 || step === 2) && (
            <div>
              <h2 className="font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>
                {isTeach ? 'What can you teach?' : 'What do you want to learn?'}
              </h2>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                {isTeach ? "Skills you're confident sharing." : 'This powers your matches.'}
              </p>

              <input className="input mb-3" placeholder="Search skills…"
                value={search} onChange={e => setSearch(e.target.value)} />

              {/* Selected tags */}
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selected.map(ts => (
                    <span key={ts.skillId}
                      className={`badge gap-1.5 ${isTeach ? 'badge-orange' : 'badge-blue'}`}>
                      {getName(ts.skillId)}
                      <button onClick={() => isTeach ? toggleTeach({ _id: ts.skillId }) : toggleLearn({ _id: ts.skillId })}
                        className="opacity-60 hover:opacity-100 transition-opacity leading-none">×</button>
                    </span>
                  ))}
                </div>
              )}

              {/* Skill grid */}
              <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-0.5">
                {filtered.map(skill => {
                  const sel = isTeach
                    ? !!teachSkills.find(s => s.skillId === skill._id)
                    : !!learnSkills.find(s => s.skillId === skill._id)
                  return (
                    <button key={skill._id}
                      onClick={() => isTeach ? toggleTeach(skill) : toggleLearn(skill)}
                      className="p-2.5 rounded-lg text-left text-sm transition-all"
                      style={{
                        border: `1px solid ${sel ? (isTeach ? '#f97316' : '#3b82f6') : 'var(--border)'}`,
                        background: sel ? (isTeach ? 'var(--accent-bg)' : 'rgba(59,130,246,0.08)') : 'var(--surface)',
                        color: sel ? (isTeach ? '#f97316' : '#3b82f6') : 'var(--text)',
                      }}>
                      <p className="font-medium text-sm">{skill.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{skill.category}</p>
                    </button>
                  )
                })}
                {filtered.length === 0 && (
                  <p className="col-span-2 text-center py-6 text-sm" style={{ color: 'var(--text-faint)' }}>
                    No skills found for "{search}"
                  </p>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <button className="btn btn-white btn-md flex-1" onClick={() => setStep(s => s - 1)}>← Back</button>
                <button className="btn btn-primary btn-md flex-1"
                  onClick={() => step === 1 ? setStep(2) : finish()} disabled={saving}>
                  {saving ? 'Saving…' : step === 1 ? `Next (${teachSkills.length})` : `Finish (${learnSkills.length})`}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="font-bold text-xl mb-2" style={{ color: 'var(--text)' }}>You're all set!</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                Teaching <strong className="text-orange-500">{teachSkills.length}</strong> skill{teachSkills.length !== 1 ? 's' : ''},
                learning <strong style={{ color: '#3b82f6' }}>{learnSkills.length}</strong>
              </p>
              <button className="btn btn-primary btn-lg w-full" onClick={() => nav('/dashboard')}>
                See my matches →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}