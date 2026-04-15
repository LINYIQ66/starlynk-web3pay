import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/lib/wagmi'
import { AuthProvider } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'ChainPay — Web3 Payment Infrastructure',
  description: 'On-chain payment, order management, and blockchain infrastructure platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AuthProvider>
            <Navbar />
            <main className="min-h-screen">{children}</main>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
