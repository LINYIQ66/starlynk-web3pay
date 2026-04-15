'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WalletButton } from './WalletButton'
import { useAuth } from '@/lib/auth'

export function Navbar() {
  const path = usePathname()
  const { isAdmin } = useAuth()
  const links = [
    { href: '/', label: 'Home' },
    { href: '/orders', label: 'Orders' },
    { href: '/pay', label: 'New Payment' },
  ]
  if (isAdmin) links.push({ href: '/admin', label: 'Admin' })

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-[#1e1e2e]">
      <div className="max-w-6xl mx-auto px-4 flex items-center h-14">
        <Link href="/" className="text-indigo-400 font-bold text-lg mr-6">⛓️ ChainPay</Link>
        <div className="flex gap-1">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm ${path === l.href ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:text-white'}`}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto"><WalletButton /></div>
      </div>
    </nav>
  )
}
