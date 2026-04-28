'use client'
import { useState } from 'react'
import { useAuth, api } from '@/lib/auth'

export default function SwapPage() {
  const { token, headers } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [form, setForm] = useState({ chain: 'eth', token_in: 'eth', token_out: 'usdt', amount_in: '', amount_out: '', slippage: 0.5 })

  if (!token) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Connect wallet first</h1>
        <p className="text-gray-400">Use the Connect Wallet button above.</p>
      </div>
    )
  }

  const submitSwap = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await api('/swap', {
        method: 'POST', headers,
        body: JSON.stringify(form)
      })
      setResult(data)
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">Uniswap V2 Swap</h1>
      <form onSubmit={submitSwap} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">From</label>
            <select value={form.token_in} onChange={e => setForm({ ...form, token_in: e.target.value })}
              className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-4 py-3 text-sm">
              <option value="eth">ETH</option>
              <option value="usdt">USDT</option>
              <option value="usdc">USDC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">To</label>
            <select value={form.token_out} onChange={e => setForm({ ...form, token_out: e.target.value })}
              className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-4 py-3 text-sm">
              <option value="usdt">USDT</option>
              <option value="usdc">USDC</option>
              <option value="eth">ETH</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Amount</label>
          <input type="number" step="any" value={form.amount_in}
            onChange={e => setForm({ ...form, amount_in: e.target.value })}
            placeholder="0.0" className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-4 py-3 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Slippage (%)</label>
          <input type="number" step="0.1" value={form.slippage}
            onChange={e => setForm({ ...form, slippage: parseFloat(e.target.value) })}
            className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-4 py-3 text-sm" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50">
          {loading ? 'Swapping...' : 'Swap'}
        </button>
      </form>
      {result && (
        <div className="mt-6 bg-[#12121a] border border-[#1e1e2e] rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Swap Result</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Tx Hash:</span><span className="font-mono">{result.tx_hash}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Amount In:</span><span>{result.amount_in}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Amount Out:</span><span>{result.amount_out}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Status:</span><span className="text-green-400">{result.status}</span></div>
          </div>
        </div>
      )}
    </div>
  }
