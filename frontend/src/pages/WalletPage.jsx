import { useState, useEffect } from 'react'
import { creditApi } from '../api/index'
import Loader from '../components/common/Loader'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const TYPE = {
  earn: { icon: '⬆️', label: 'Earned', positive: true },
  spend: { icon: '⬇️', label: 'Spent', positive: false },
  bonus: { icon: '🎁', label: 'Bonus', positive: true },
  refund: { icon: '↩️', label: 'Refund', positive: true },
  penalty: { icon: '⚠️', label: 'Penalty', positive: false },
}

export default function WalletPage() {
  const [wallet, setWallet] = useState(null)
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    setLoading(true)
    creditApi.getWallet({ page, limit: 20 })
      .then(({ data }) => { setWallet(data.data); setTxns(data.data.transactions); setMeta(data.meta) })
      .catch(() => toast.error('Failed to load wallet'))
      .finally(() => setLoading(false))
  }, [page])

  if (loading) return <Loader />

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-400">Wallet</h1>
        <p className="text-gray-500 text-sm mt-0.5">Your credits and transaction history</p>
      </div>

      {/* Balance */}
      <div className="card p-6 mb-5 fade-up">
        <p className="text-gray-500 text-sm mb-1">Current balance</p>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-4xl font-extrabold text-white">{wallet?.balance}</span>
          <span className="text-orange-500 font-semibold">credits</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg p-3 " style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <p className="text-xs text-gray-500 mb-1">Teaching earns</p>
            <p className="font-bold text-green-600">+1 per session</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <p className="text-xs text-gray-500 mb-1">Learning costs</p>
            <p className="font-bold text-red-500">-1 per session</p>
          </div>
        </div>
      </div>

      {/* History */}
      <h2 className="font-semibold text-gray-500 mb-3">Transaction history</h2>

      {txns.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-3xl mb-2">🪙</div>
          <p className="text-gray-500 text-sm">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {txns.map(tx => {
            const cfg = TYPE[tx.type] || TYPE.earn
            return (
              <div key={tx._id} className="card p-4 flex items-center gap-3 fade-up">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 " style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-500 text-sm truncate">{tx.description}</p>
                  <p className="text-gray-400 text-xs">
                    {format(new Date(tx.createdAt), 'MMM d, yyyy · h:mm a')} · {cfg.label}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-bold ${cfg.positive ? 'text-green-600' : 'text-red-500'}`}>
                    {cfg.positive ? '+' : ''}{tx.amount}
                  </p>
                  <p className="text-gray-400 text-xs">bal: {tx.balanceAfter}</p>
                </div>
              </div>
            )
          })}

          {meta?.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <button onClick={() => setPage(p => p - 1)} disabled={!meta.hasPrev}
                className="btn btn-white btn-sm">← Prev</button>
              <span className="self-center text-gray-500 text-sm">{page}/{meta.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={!meta.hasNext}
                className="btn btn-white btn-sm">Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}