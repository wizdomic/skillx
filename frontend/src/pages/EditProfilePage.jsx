import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi } from '../api/index'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const TZ = ['UTC','America/New_York','America/Chicago','America/Los_Angeles','Europe/London','Europe/Paris','Asia/Kolkata','Asia/Tokyo','Australia/Sydney']

export default function EditProfilePage() {
  const nav = useNavigate()
  const { user, setUser } = useAuthStore()
  const [form, setForm] = useState({
    name:      user?.name || '',
    bio:       user?.bio || '',
    location:  user?.location || '',
    timezone:  user?.timezone || 'UTC',
    avatarUrl: user?.avatarUrl || '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (k,v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const save = async e => {
    e.preventDefault()
    if (!form.name.trim()) { setErrors({ name:'Required' }); return }
    setSaving(true)
    try {
      const { data } = await userApi.updateProfile(form)
      setUser(data.data)
      toast.success('Profile updated!')
      nav(`/profile/${user._id}`)
    } catch { toast.error('Failed to update') }
    finally { setSaving(false) }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
        <p className="text-gray-500 text-sm mt-0.5">Update your public information</p>
      </div>

      <form onSubmit={save} className="space-y-4">
        <div className="card p-5 space-y-4">
          <div>
            <label className="label">Avatar URL</label>
            <input className="input" placeholder="https://…"
              value={form.avatarUrl} onChange={e => set('avatarUrl', e.target.value)} />
            {form.avatarUrl && (
              <img src={form.avatarUrl} alt="preview"
                className="mt-2 w-14 h-14 rounded-full object-cover border-2 border-orange-200"
                onError={e => { e.target.style.display = 'none' }} />
            )}
          </div>
          <div>
            <label className="label">Display name *</label>
            <input className={`input ${errors.name ? 'input-error' : ''}`}
              value={form.name} onChange={e => set('name', e.target.value)} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea className="input resize-none" rows={4} maxLength={500}
              placeholder="Tell people about yourself…"
              value={form.bio} onChange={e => set('bio', e.target.value)} />
            <p className="text-gray-400 text-xs mt-1 text-right">{form.bio.length}/500</p>
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" placeholder="City, Country"
              value={form.location} onChange={e => set('location', e.target.value)} />
          </div>
          <div>
            <label className="label">Timezone</label>
            <select className="input" value={form.timezone} onChange={e => set('timezone', e.target.value)}>
              {TZ.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => nav(-1)} className="btn btn-white btn-md flex-1">Cancel</button>
          <button type="submit" className="btn btn-primary btn-md flex-1" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}