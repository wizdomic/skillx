import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ratingApi, userApi } from '../api/index'
import { Avatar, StarRating } from '../components/common/index'
import Loader from '../components/common/Loader'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function RatingsPage() {
  const { userId } = useParams()
  const nav = useNavigate()
  const [profile, setProfile] = useState(null)
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      userApi.getUser(userId),
      ratingApi.getUserRatings(userId, { limit: 50 }),
    ])
      .then(([p, r]) => { setProfile(p.data.data); setRatings(r.data.data.ratings) })
      .catch(() => toast.error('Failed'))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <Loader />
  if (!profile) return null

  const dist = [5,4,3,2,1].map(s => ({
    s,
    count: ratings.filter(r => r.score === s).length,
    pct: ratings.length ? (ratings.filter(r => r.score === s).length / ratings.length) * 100 : 0,
  }))

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Reviews for {profile.name}</h1>
      </div>

      {/* Summary */}
      <div className="card p-5 mb-5 fade-up">
        <div className="flex items-center gap-4 mb-4">
          <Avatar src={profile.avatarUrl} name={profile.name} size={52} />
          <div>
            <button onClick={() => nav(`/profile/${profile._id}`)}
              className="font-bold text-gray-900 hover:text-orange-500 transition-colors">
              {profile.name}
            </button>
            <div className="flex items-center gap-2 mt-1">
              <StarRating value={profile.averageRating} readonly size={16} />
              <span className="font-bold text-gray-900">{Number(profile.averageRating).toFixed(1)}</span>
              <span className="text-gray-400 text-sm">({profile.ratingCount})</span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          {dist.map(({ s, count, pct }) => (
            <div key={s} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-3 text-right">{s}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#f97316">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-gray-400 w-3">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* List */}
      {ratings.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-3xl mb-2">⭐</div>
          <p className="text-gray-500 text-sm">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ratings.map(r => (
            <div key={r._id} className="card p-4 fade-up">
              <div className="flex items-start gap-3">
                <Avatar src={r.raterId?.avatarUrl} name={r.raterId?.name} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                    <button onClick={() => nav(`/profile/${r.raterId?._id}`)}
                      className="font-semibold text-gray-900 text-sm hover:text-orange-500 transition-colors">
                      {r.raterId?.name}
                    </button>
                    <div className="flex items-center gap-2">
                      <StarRating value={r.score} readonly size={12} />
                      <span className="text-gray-400 text-xs">
                        {format(new Date(r.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  {r.comment && <p className="text-gray-500 text-sm">"{r.comment}"</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}