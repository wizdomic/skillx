import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi } from '../api/index'
import { useAuthStore } from '../store/authStore'
import { Avatar } from '../components/common/index'
import toast from 'react-hot-toast'

const TZ = ['UTC','America/New_York','America/Chicago','America/Los_Angeles','Europe/London','Europe/Paris','Asia/Kolkata','Asia/Tokyo','Australia/Sydney']

export default function EditProfilePage() {
  const nav = useNavigate()
  const { user, setUser } = useAuthStore()
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    name:      user?.name      || '',
    username:  user?.username  || '',
    bio:       user?.bio       || '',
    location:  user?.location  || '',
    timezone:  user?.timezone  || 'UTC',
    avatarUrl: user?.avatarUrl || '',
  })
  const [saving, setSaving]         = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [errors, setErrors]         = useState({})
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '')

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return }

    // Local preview
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target.result)
    reader.readAsDataURL(file)

    // Upload to Cloudinary via backend
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const { data } = await userApi.uploadAvatar(formData)
      setForm(f => ({ ...f, avatarUrl: data.data.avatarUrl }))
      setUser({ ...user, avatarUrl: data.data.avatarUrl })
      toast.success('Avatar updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
      setAvatarPreview(user?.avatarUrl || '')
    } finally { setUploading(false) }
  }

  const save = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Required'
    if (form.username && !/^[a-z0-9_]{3,30}$/.test(form.username.toLowerCase()))
      errs.username = 'Letters, numbers and underscores only (3–30 chars)'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      const { data } = await userApi.updateProfile({ ...form, username: form.username.toLowerCase() || undefined })
      setUser(data.data)
      toast.success('Profile updated!')
      nav(`/profile/${user._id}`)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update'
      if (msg.toLowerCase().includes('username')) setErrors({ username: msg })
      else toast.error(msg)
    } finally { setSaving(false) }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Edit profile</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Update your public information</p>
      </div>

      <form onSubmit={save} className="space-y-4">
        <div className="card p-5 space-y-4">

          {/* Avatar upload */}
          <div>
            <label className="label">Profile photo</label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar src={avatarPreview} name={form.name} size={72} />
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full"
                    style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div>
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="btn btn-white btn-sm" disabled={uploading}>
                  {uploading ? 'Uploading…' : '📷 Upload photo'}
                </button>
                <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                  JPG, PNG, GIF — max 5 MB
                </p>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
          </div>

          {/* Name */}
          <div>
            <label className="label">Display name *</label>
            <input className={`input ${errors.name ? 'input-error' : ''}`}
              value={form.name} onChange={e => set('name', e.target.value)} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Username */}
          <div>
            <label className="label">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                style={{ color: 'var(--text-muted)' }}>@</span>
              <input className={`input pl-7 ${errors.username ? 'input-error' : ''}`}
                placeholder="your_username"
                value={form.username}
                onChange={e => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                maxLength={30} />
            </div>
            {errors.username
              ? <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              : <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                  People can search you by @{form.username || 'username'}
                </p>
            }
          </div>

          {/* Bio */}
          <div>
            <label className="label">Bio</label>
            <textarea className="input resize-none" rows={4} maxLength={500}
              placeholder="Tell people about yourself…"
              value={form.bio} onChange={e => set('bio', e.target.value)} />
            <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-faint)' }}>
              {form.bio.length}/500
            </p>
          </div>

          {/* Location */}
          <div>
            <label className="label">Location</label>
            <input className="input" placeholder="City, Country"
              value={form.location} onChange={e => set('location', e.target.value)} />
          </div>

          {/* Timezone */}
          <div>
            <label className="label">Timezone</label>
            <select className="input" value={form.timezone} onChange={e => set('timezone', e.target.value)}>
              {TZ.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={() => nav(-1)} className="btn btn-white btn-md flex-1">Cancel</button>
          <button type="submit" className="btn btn-primary btn-md flex-1" disabled={saving || uploading}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}