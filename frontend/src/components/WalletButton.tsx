'use client'
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi'
import { useAuth, api } from '@/lib/auth'
import { useState } from 'react'

export function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connectors, connect } = useConnect()
    const { disconnect } = useDisconnect()
  const { signMessageAsync } = useSignMessage()
  const { token, login, logout } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!address) return
    setLoading(true)
    try {
      // 1. Get nonce
      const { nonce, message } = await api(`/auth/nonce?address=${address}`)
      // 2. Sign
      const signature = await signMessageAsync({ message })
      // 3. Verify
      const data = await api('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ address, message, signature }),
      })
      login(data.token, data.address, data.is_admin)
    } catch (e: any) {
      alert('Login failed: ' + (e.message || 'Unknown error'))
    }
    setLoading(false)
  }

  if (token && address) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-green-400 font-mono">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button onClick={() => { disconnect(); logout() }}
          className="text-xs bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/30">
          Disconnect
        </button>
      </div>
    )
  }

  if (isConnected && !token) {
    return (
      <button onClick={handleLogin} disabled={loading}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
        {loading ? 'Signing...' : 'Sign In with Wallet'}
      </button>
    )
  }

  return (
    <button onClick={() => connect({ connector: connectors[0] })}
      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
      Connect Wallet
    </button>
  )
}
