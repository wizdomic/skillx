import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/authApi'
import { AuthShell, Logo, Divider } from '../components/common/AuthShell'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const nav = useNavigate()
  const [step, setStep] = useState('email')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [form, setForm] = useState({ otp: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const sendCode = async e => {
    e.preventDefault()
    if (!email) { setErrors({ email: 'Required' }); return }
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      toast.success('Reset code sent!')
      setStep('reset')
    } catch (err) {
      setErrors({ email: err.response?.data?.message || 'Failed' })
    } finally { setLoading(false) }
  }

  const resetPwd = async e => {
    e.preventDefault()
    const errs = {}
    if (form.otp.length < 6) errs.otp = 'Enter the 6-digit code'
    if (form.password.length < 8) errs.password = 'Min 8 characters'
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Include an uppercase letter'
    else if (!/[0-9]/.test(form.password)) errs.password = 'Include a number'
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await authApi.resetPassword({ email, otp: form.otp, newPassword: form.password })
      toast.success('Password reset! Sign in with your new password.')
      nav('/login')
    } catch (err) {
      setErrors({ otp: err.response?.data?.message || 'Invalid or expired code' })
    } finally { setLoading(false) }
  }

  return (
    <AuthShell>
      <div className="text-center mb-6">
        <Logo />
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>
          {step === 'email' ? 'Forgot password?' : 'Set new password'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {step === 'email'
            ? "Enter your email and we'll send a reset code"
            : `Code sent to ${email}`}
        </p>
      </div>

      <div className="card p-6">
        {step === 'email' ? (
          <form onSubmit={sendCode} className="space-y-3">
            <div>
              <label className="label">Email address</label>
              <input className={`input ${errors.email ? 'input-error' : ''}`} type="email"
                placeholder="you@example.com" value={email}
                onChange={e => { setEmail(e.target.value); setErrors({}) }} autoFocus />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <button className="btn btn-primary btn-md w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset code'}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPwd} className="space-y-3">
            <div>
              <label className="label">6-digit code</label>
              <input
                className={`input text-center font-mono text-xl tracking-[0.4em] ${errors.otp ? 'input-error' : ''}`}
                type="text" inputMode="numeric" maxLength={6} placeholder="······"
                value={form.otp} onChange={e => set('otp', e.target.value.replace(/\D/g, ''))} autoFocus />
              {errors.otp && <p className="text-red-500 text-xs mt-1 text-center">{errors.otp}</p>}
            </div>
            <div>
              <label className="label">New password</label>
              <input className={`input ${errors.password ? 'input-error' : ''}`} type="password"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                value={form.password} onChange={e => set('password', e.target.value)} />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input className={`input ${errors.confirm ? 'input-error' : ''}`} type="password"
                placeholder="Repeat new password"
                value={form.confirm} onChange={e => set('confirm', e.target.value)} />
              {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm}</p>}
            </div>
            <button className="btn btn-primary btn-md w-full" disabled={loading}>
              {loading ? 'Resetting…' : 'Reset password'}
            </button>
            <button type="button" onClick={() => setStep('email')}
              className="w-full text-sm transition-colors"
              style={{ color: 'var(--text-faint)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--brand)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
              ← Different email
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-sm mt-4">
        <Link to="/login" style={{ color: 'var(--brand)' }}>← Back to sign in</Link>
      </p>
    </AuthShell>
  )
}