'use client'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'

import MarketData from '@/components/MarketData'

export default function Home() {
  const { token } = useAuth()

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Web3 Payment Infrastructure
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
          Accept crypto payments. Monitor on-chain transactions. Manage orders and callbacks. Built for developers.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/pay"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold">
            Create Payment →
          </Link>
          {token && (
            <Link href="/orders"
              className="border border-indigo-600/50 text-indigo-400 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-600/10">
              View Orders
            </Link>
          )}
        </div>
      </div>

      <MarketData />

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {[
          { icon: '🔗', title: 'Multi-Chain', desc: 'Ethereum, BSC, Polygon. Native & ERC20 tokens (USDT, USDC).' },
          { icon: '📡', title: 'On-Chain Monitor', desc: 'Real-time payment detection. Configurable confirmation threshold.' },
          { icon: '🔔', title: 'Webhook Callbacks', desc: 'Auto-notify your backend when payments are confirmed.' },
          { icon: '🔐', title: 'Wallet Login', desc: 'SIWE (Sign-In with Ethereum). No passwords. No email.' },
          { icon: '📊', title: 'Admin Dashboard', desc: 'Order management, address pool, audit logs, and analytics.' },
          { icon: '🚀', title: 'API First', desc: 'RESTful API. Docker deploy. Start in minutes.' },
        ].map((f, i) => (
          <div key={i} className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-6 hover:border-indigo-600/50 transition">
            <div className="text-2xl mb-3">{f.icon}</div>
            <h3 className="font-semibold mb-2">{f.title}</h3>
            <p className="text-gray-400 text-sm">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Supported */}
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Supported Chains & Tokens</h2>
        <div className="flex flex-wrap gap-3 justify-center">
          {['ETH', 'BNB', 'MATIC', 'USDT', 'USDC'].map(t => (
            <span key={t} className="px-4 py-2 rounded-full bg-indigo-600/10 text-indigo-400 text-sm font-medium">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
