// Shared wrapper for all auth pages — handles dark/light bg, centering, logo

export function AuthShell({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm fade-up">
        {children}
      </div>
    </div>
  )
}

export function Logo() {
  return (
    <div className="inline-flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
        <span className="text-white font-bold text-sm">S</span>
      </div>
      <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>SkillX</span>
    </div>
  )
}

export function Divider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      <span className="text-xs" style={{ color: 'var(--text-faint)' }}>or</span>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  )
}