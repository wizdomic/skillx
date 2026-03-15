import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell, Logo, Divider } from '../components/common/AuthShell'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const nav = useNavigate()
  const { register, verifyEmail } = useAuthStore()
  const [step, setStep] = useState('form')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'' })
  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState({})

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:''})) }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.email) e.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (form.password.length < 8) e.password = 'Min 8 characters'
    else if (!/[A-Z]/.test(form.password)) e.password = 'Include an uppercase letter'
    else if (!/[0-9]/.test(form.password)) e.password = 'Include a number'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleRegister = async e => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await register({ name: form.name, email: form.email, password: form.password })
      setEmail(form.email)
      setStep('verify')
      toast.success('Check your email for a verification code!')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      if (msg.toLowerCase().includes('email')) setErrors({ email: msg })
      else toast.error(msg)
    } finally { setLoading(false) }
  }

  const handleVerify = async e => {
    e.preventDefault()
    if (otp.length < 6) { setErrors({ otp: 'Enter the 6-digit code' }); return }
    setLoading(true)
    try {
      await verifyEmail({ email, otp })
      toast.success('Email verified! Welcome to SkillX 🎉')
      nav('/onboarding')
    } catch (err) {
      setErrors({ otp: err.response?.data?.message || 'Invalid or expired code' })
    } finally { setLoading(false) }
  }

  const oauthUrl = p => `${import.meta.env.VITE_SOCKET_URL || ''}/api/auth/${p}`

  if (step === 'verify') return (
    <AuthShell>
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">📬</div>
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Check your inbox</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Code sent to <strong style={{ color: 'var(--text)' }}>{email}</strong>
        </p>
      </div>
      <div className="card p-6">
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="label">Verification code</label>
            <input
              className={`input text-center font-mono text-2xl tracking-[0.5em] ${errors.otp ? 'input-error' : ''}`}
              type="text" inputMode="numeric" maxLength={6} placeholder="······"
              value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g,'')); setErrors({}) }} autoFocus />
            {errors.otp && <p className="text-red-500 text-xs mt-1 text-center">{errors.otp}</p>}
          </div>
          <button className="btn btn-primary btn-md w-full" disabled={loading}>
            {loading ? 'Verifying…' : 'Verify & continue →'}
          </button>
        </form>
        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-faint)' }}>
          Didn't get it? Check spam or{' '}
          <button onClick={() => setStep('form')} className="hover:underline"
            style={{ color: 'var(--brand)' }}>
            try again
          </button>
        </p>
      </div>
    </AuthShell>
  )

  return (
    <AuthShell>
      <div className="text-center mb-6">
        <Logo />
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Create your account</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Free forever</p>
      </div>
      <div className="card p-6">
        <div className="space-y-2 mb-4">
          <a href={oauthUrl('google')} className="btn btn-white btn-md w-full">
            <GoogleIcon /> Continue with Google
          </a>
          <a href={oauthUrl('github')} className="btn btn-white btn-md w-full">
            <GithubIcon /> Continue with GitHub
          </a>
        </div>
        <Divider />
        <form onSubmit={handleRegister} className="space-y-3">
          {[
            { k:'name',     type:'text',     ph:'Your full name',       label:'Full name' },
            { k:'email',    type:'email',    ph:'you@example.com',      label:'Email' },
            { k:'password', type:'password', ph:'Min 8 chars, A, 1',    label:'Password' },
            { k:'confirm',  type:'password', ph:'Repeat your password', label:'Confirm password' },
          ].map(({ k, type, ph, label }) => (
            <div key={k}>
              <label className="label">{label}</label>
              <input className={`input ${errors[k] ? 'input-error' : ''}`} type={type}
                placeholder={ph} value={form[k]} onChange={e => set(k, e.target.value)} />
              {errors[k] && <p className="text-red-500 text-xs mt-1">{errors[k]}</p>}
            </div>
          ))}
          <button className="btn btn-primary btn-md w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Create account →'}
          </button>
        </form>
      </div>
      <p className="text-center text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
        Already have an account?{' '}
        <Link to="/login" className="font-semibold" style={{ color: 'var(--brand)' }}>
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}

function GoogleIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
}

function GithubIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
}