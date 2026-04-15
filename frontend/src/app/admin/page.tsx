'use client'
import { useAuth, api } from '@/lib/auth'
import { useEffect, useState } from 'react'

export default function AdminPage() {
  const { token, headers, isAdmin } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [addresses, setAddresses] = useState<any[]>([])
  const [tab, setTab] = useState('orders')
  const [newAddr, setNewAddr] = useState({ chain: 'eth', address: '' })

  useEffect(() => {
    if (!token || !isAdmin) return
    api('/admin/stats', { headers }).then(setStats)
    api('/admin/orders', { headers }).then(setOrders)
    api('/admin/addresses', { headers }).then(setAddresses)
  }, [token, isAdmin])

  const addAddress = async () => {
    if (!newAddr.address) return
    await api(`/admin/addresses?chain=${newAddr.chain}&address_param=${newAddr.address}`, {
      method: 'POST', headers,
    })
    const addrs = await api('/admin/addresses', { headers })
    setAddresses(addrs)
    setNewAddr({ chain: 'eth', address: '' })
  }

  if (!token || !isAdmin) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
      <p className="text-gray-400">Connect an admin wallet to access this page.</p>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-gray-400 text-sm">Total Orders</p>
            <p className="text-3xl font-bold mt-1">{stats.total_orders}</p>
          </div>
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-gray-400 text-sm">Completed</p>
            <p className="text-3xl font-bold text-green-400 mt-1">{stats.completed}</p>
          </div>
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-gray-400 text-sm">Pending</p>
            <p className="text-3xl font-bold text-yellow-400 mt-1">{stats.pending}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['orders', 'addresses'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-indigo-600 text-white' : 'bg-[#12121a] text-gray-400 border border-[#1e1e2e]'}`}>
            {t === 'orders' ? '📋 All Orders' : '🏦 Address Pool'}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-[#1e1e2e]">
                <th className="pb-3 pr-4">Order</th>
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Chain</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">TX</th>
                <th className="pb-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id} className="border-b border-[#1e1e2e] hover:bg-white/[0.02]">
                  <td className="py-3 pr-4 font-mono text-xs">{o.order_no}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{o.user_address?.slice(0, 8)}...</td>
                  <td className="py-3 pr-4 uppercase text-xs">{o.chain}</td>
                  <td className="py-3 pr-4">{o.amount_usd !== '0' ? `$${o.amount_usd}` : o.amount}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      o.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      o.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>{o.status}</span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs">{o.tx_hash?.slice(0, 10) || '—'}</td>
                  <td className="py-3 text-gray-400 text-xs">{new Date(o.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'addresses' && (
        <div>
          <div className="flex gap-3 mb-6">
            <select value={newAddr.chain} onChange={e => setNewAddr({ ...newAddr, chain: e.target.value })}
              className="bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm">
              <option value="eth">ETH</option>
              <option value="bsc">BSC</option>
              <option value="polygon">Polygon</option>
            </select>
            <input value={newAddr.address} onChange={e => setNewAddr({ ...newAddr, address: e.target.value })}
              placeholder="0x..."
              className="flex-1 bg-[#12121a] border border-[#1e1e2e] rounded-lg px-4 py-2 text-sm font-mono" />
            <button onClick={addAddress}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              Add Address
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-[#1e1e2e]">
                <th className="pb-3 pr-4">Address</th>
                <th className="pb-3 pr-4">Chain</th>
                <th className="pb-3 pr-4">Active</th>
                <th className="pb-3">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {addresses.map((a: any) => (
                <tr key={a.id} className="border-b border-[#1e1e2e]">
                  <td className="py-3 pr-4 font-mono text-xs">{a.address}</td>
                  <td className="py-3 pr-4 uppercase text-xs">{a.chain}</td>
                  <td className="py-3 pr-4">{a.is_active ? '✅' : '❌'}</td>
                  <td className="py-3 text-xs text-gray-400">{a.assigned_order || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
