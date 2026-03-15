export default function Loader({ fullscreen = false, size = 24 }) {
  const spinner = (
    <div
      className="rounded-full animate-spin"
      style={{
        width: size,
        height: size,
        border: '2px solid var(--border)',
        borderTopColor: '#f97316',
      }}
    />
  )
  if (fullscreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50"
        style={{ background: 'var(--bg)' }}>
        {spinner}
      </div>
    )
  }
  return <div className="flex justify-center py-10">{spinner}</div>
}