'use client'
import { useAuth, api } from '@/lib/auth'
import { useEffect, useState } from 'react'

interface Order {
  order_no: string
  chain: string
  token: string
  amount: string
  status: string
  tx_hash: string | null
  pay_address: string
  created_at: string
  expired_at: string | null
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirming: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-green-500/20 text-green-400',
  expired: 'bg-gray-500/20 text-gray-400',
  failed: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-gray-500/20 text-gray-400',
}

export default function OrdersPage() {
  const { token, headers } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    api('/orders', { headers })
      .then(data => { setOrders(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  if (!token) return (
    <div className="max-w-4xl mx-auto px-4 pt-24 text-center">
      <h1 className="text-2xl font-bold mb-4">Connect your wallet to view orders</h1>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <p className="text-lg mb-4">No orders yet</p>
          <a href="/pay" className="text-indigo-400 hover:text-indigo-300">Create your first payment →</a>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.order_no} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-mono text-sm">{o.order_no}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[o.status] || 'bg-gray-700 text-gray-300'}`}>
                  {o.status}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 text-xs">Chain</div>
                  <div className="text-gray-300 uppercase">{o.chain}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Token</div>
                  <div className="text-gray-300 uppercase">{o.token}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Amount</div>
                  <div className="text-gray-300 font-mono">{o.amount}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Created</div>
                  <div className="text-gray-300">{o.created_at ? new Date(o.created_at).toLocaleDateString() : '-'}</div>
                </div>
              </div>
              {o.tx_hash && (
                <div className="mt-3 text-xs">
                  <span className="text-gray-500">TX: </span>
                  <span className="text-indigo-400 font-mono">{o.tx_hash.slice(0, 20)}...</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
