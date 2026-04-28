import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-4 py-1.5 rounded-full text-sm mb-6">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Multi-chain payments live
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent leading-tight">
          Web3 Payment<br />Infrastructure
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Accept crypto payments on Ethereum, BSC, and Polygon.
          Monitor on-chain transactions in real-time. Webhook callbacks.
          Built for developers.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/pay" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/25">
            Create Payment →
          </Link>
          <a href="#features" className="border border-gray-700 hover:border-gray-500 text-gray-300 px-8 py-3.5 rounded-xl font-semibold transition-all">
            Learn More
          </a>
        </div>
      </div>

      {/* Chain Support */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-3 gap-6">
          {[
            { name: 'Ethereum', icon: '⟠', color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/20' },
            { name: 'BSC', icon: '🔷', color: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/20' },
            { name: 'Polygon', icon: '🟣', color: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/20' },
          ].map(chain => (
            <div key={chain.name} className={`bg-gradient-to-b ${chain.color} border ${chain.border} rounded-2xl p-6 text-center`}>
              <div className="text-4xl mb-3">{chain.icon}</div>
              <div className="text-white font-semibold">{chain.name}</div>
              <div className="text-gray-500 text-sm mt-1">Native + USDT + USDC</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div id="features" className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Built for Developers</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '🔗', title: 'Multi-Chain', desc: 'Ethereum, BSC, Polygon. Native tokens and ERC20.' },
            { icon: '🔐', title: 'SIWE Auth', desc: 'Sign-In with Ethereum. No passwords, no emails.' },
            { icon: '📡', title: 'Real-time Monitor', desc: 'On-chain listener detects payments within 10 seconds.' },
            { icon: '🔔', title: 'Webhooks', desc: 'HMAC-signed callbacks when payments are confirmed.' },
            { icon: '📊', title: 'Admin Dashboard', desc: 'Manage orders, addresses, and audit logs.' },
            { icon: '🐳', title: 'Docker Deploy', desc: 'One command: docker compose up -d' },
          ].map(f => (
            <div key={f.title} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-indigo-500/30 transition-colors">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Code Example */}
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Create a Payment in 3 Lines</h2>
        <div className="bg-gray-900 border border-gray-700/50 rounded-2xl p-6 overflow-x-auto">
          <pre className="text-sm text-gray-300 leading-relaxed">
            <code>{`// 1. Connect wallet + SIWE sign
const { token } = await login(address, signature)

// 2. Create payment order
const { pay_address, amount, chain } = await api('/orders', {
  method: 'POST',
  body: { chain: 'eth', token: 'usdt', amount: '1000000' }
})

// 3. User sends tokens → webhook fires on confirm`}</code>
          </pre>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 py-8 text-center">
        <p className="text-gray-500 text-sm">ChainPay — Web3 Payment Infrastructure</p>
        <p className="text-gray-600 text-xs mt-2">Built by Starlynk Group · Open Source</p>
      </div>
    </div>
  )
}
