import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const nav = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center fade-up">
        <p className="font-mono text-orange-500 text-sm font-semibold mb-3 tracking-widest">404</p>
        <h1 className="text-3xl font-extrabold text-gray-500 mb-2">Page not found</h1>
        <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
        <div className="flex gap-2 justify-center">
          <button onClick={() => nav(-1)} className="btn btn-white btn-md">← Go back</button>
          <button onClick={() => nav('/dashboard')} className="btn btn-primary btn-md">Dashboard</button>
        </div>
      </div>
    </div>
  )
}