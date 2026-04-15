'use client'
import { useAuth, api } from '@/lib/auth'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Order {
  id: string; order_no: string; chain: string; token: string
  amount: string; amount_usd: string; pay_address: string
  status: string; tx_hash: string | null; confirmations: number
  expired_at: string | null; created_at: string
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirming: 'bg-blue-500/20 text-blue-400',
  confirmed: 'bg-green-500/20 text-green-400',
  completed: 'bg-green-500/20 text-green-400',
  expired: 'bg-gray-500/20 text-gray-400',
  failed: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-red-500/20 text-red-400',
}

export default function OrdersPage() {
  const { token, headers } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    api('/orders', { headers }).then(setOrders).catch(console.error).finally(() => setLoading(false))
  }, [token])

  if (!token) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold mb-4">Connect your wallet to view orders</h1>
      <p className="text-gray-400">Use the Connect Wallet button above.</p>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <Link href="/pay" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + New Payment
        </Link>
      </div>

      {loading ? <p className="text-gray-400">Loading...</p> : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">No orders yet</p>
          <Link href="/pay" className="text-indigo-400">Create your first payment →</Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-[#1e1e2e]">
                <th className="pb-3 pr-4">Order</th>
                <th className="pb-3 pr-4">Chain</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">TX</th>
                <th className="pb-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-[#1e1e2e] hover:bg-white/[0.02]">
                  <td className="py-3 pr-4 font-mono text-xs">{o.order_no}</td>
                  <td className="py-3 pr-4 uppercase text-xs font-medium">{o.chain}</td>
                  <td className="py-3 pr-4">{o.amount_usd !== '0' ? `$${o.amount_usd}` : o.amount}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[o.status] || ''}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs">
                    {o.tx_hash ? (
                      <a href={`https://etherscan.io/tx/${o.tx_hash}`} target="_blank" className="text-indigo-400">
                        {o.tx_hash.slice(0, 10)}...
                      </a>
                    ) : '—'}
                  </td>
                  <td className="py-3 text-gray-400 text-xs">
                    {new Date(o.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
