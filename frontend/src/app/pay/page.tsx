'use client'
import { useAuth, api } from '@/lib/auth'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PayPage() {
  const { token, headers } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ chain: 'eth', token: 'native', amount_usd: '', amount: '', webhook_url: '' })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  if (!token) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold mb-4">Connect wallet first</h1>
    </div>
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await api('/orders', {
        method: 'POST', headers,
        body: JSON.stringify({
          chain: form.chain,
          token: form.token,
          amount: form.amount || '0',
          amount_usd: form.amount_usd || '0',
          webhook_url: form.webhook_url || null,
        }),
      })
      setResult(data)
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
    setLoading(false)
  }

  if (result) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20">
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-8">
          <h2 className="text-xl font-bold text-green-400 mb-6">✅ Payment Created</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Order</span><span className="font-mono">{result.order_no}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Chain</span><span className="uppercase">{result.chain}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Token</span><span className="uppercase">{result.token}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Status</span><span className="text-yellow-400">{result.status}</span></div>
            <div className="border-t border-[#1e1e2e] pt-3">
              <p className="text-gray-400 mb-1">Send payment to:</p>
              <p className="font-mono text-indigo-400 break-all bg-[#0a0a0f] p-3 rounded-lg">{result.pay_address}</p>
            </div>
            <div className="flex justify-between"><span className="text-gray-400">Expires</span><span>{result.expired_at ? new Date(result.expired_at).toLocaleString() : '—'}</span></div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => router.push('/orders')} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm">View Orders</button>
            <button onClick={() => { setResult(null) }} className="flex-1 border border-[#1e1e2e] py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5">New Payment</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">Create Payment</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Chain</label>
          <select value={form.chain} onChange={e => setForm({ ...form, chain: e.target.value })}
            className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-600">
            <option value="eth">Ethereum</option>
            <option value="bsc">BNB Chain</option>
            <option value="polygon">Polygon</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Token</label>
          <select value={form.token} onChange={e => setForm({ ...form, token: e.target.value })}
            className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-600">
            <option value="native">Native (ETH/BNB/MATIC)</option>
            <option value="usdt">USDT</option>
            <option value="usdc">USDC</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Amount (USD)</label>
          <input type="number" step="0.01" value={form.amount_usd}
            onChange={e => setForm({ ...form, amount_usd: e.target.value })}
            placeholder="100.00"
            className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-600" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Amount (Wei, for native) or raw amount</label>
          <input type="text" value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })}
            placeholder="Leave empty if using USD"
            className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-600" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Webhook URL (optional)</label>
          <input type="url" value={form.webhook_url}
            onChange={e => setForm({ ...form, webhook_url: e.target.value })}
            placeholder="https://your-server.com/webhook"
            className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-600" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Payment Order'}
        </button>
      </form>
    </div>
  )
}
