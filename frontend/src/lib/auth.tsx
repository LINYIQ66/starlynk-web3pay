'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

interface AuthCtx {
  token: string | null
  address: string | null
  isAdmin: boolean
  login: (token: string, address: string, isAdmin: boolean) => void
  logout: () => void
  headers: Record<string, string>
}

const Ctx = createContext<AuthCtx>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('cp_token')
    const a = localStorage.getItem('cp_address')
    if (t && a) { setToken(t); setAddress(a) }
  }, [])

  const login = (t: string, a: string, admin: boolean) => {
    setToken(t); setAddress(a); setIsAdmin(admin)
    localStorage.setItem('cp_token', t)
    localStorage.setItem('cp_address', a)
  }

  const logout = () => {
    setToken(null); setAddress(null); setIsAdmin(false)
    localStorage.removeItem('cp_token')
    localStorage.removeItem('cp_address')
  }

  return (
    <Ctx.Provider value={{
      token, address, isAdmin, login, logout,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)

export async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts.headers },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
