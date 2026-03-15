import { useEffect } from 'react'

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} card p-6 shadow-2xl fade-up`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base" style={{ color: 'var(--text)' }}>{title}</h3>
          <button onClick={onClose}
            className="p-1 rounded-lg transition-all hover:opacity-70"
            style={{ color: 'var(--text-muted)', background: 'var(--surface-2)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── StarRating ────────────────────────────────────────────────────────────────
export function StarRating({ value = 0, onChange, readonly = false, size = 18 }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <button key={s} disabled={readonly} onClick={() => onChange?.(s)}
          className={`transition-transform ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}>
          <svg width={size} height={size} viewBox="0 0 24 24"
            fill={s <= value ? '#f97316' : 'none'}
            stroke={s <= value ? '#f97316' : 'var(--border-2)'} strokeWidth="1.5">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
          </svg>
        </button>
      ))}
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ emoji = '📭', title, description, action }) {
  return (
    <div className="text-center py-14">
      <div className="text-4xl mb-3">{emoji}</div>
      <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>{title}</h3>
      {description && (
        <p className="text-sm max-w-xs mx-auto mb-4" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      )}
      {action}
    </div>
  )
}

// ── PageHeader ────────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{title}</h1>
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ src, name, size = 36 }) {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const dim = { width: size, height: size }
  if (src) {
    return <img src={src} alt={name} style={dim} className="rounded-full object-cover flex-shrink-0" />
  }
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 font-semibold"
      style={{
        ...dim,
        fontSize: size * 0.38,
        background: 'var(--accent-bg)',
        border: '1px solid var(--accent-border)',
        color: '#f97316',
      }}>
      {initials}
    </div>
  )
}