'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getSession, clearSession } from '@/lib/auth'

const NAV = [
  { href: '', icon: '📊', label: 'Overzicht' },
  { href: '/reserveringen', icon: '📅', label: 'Reserveringen' },
  { href: '/tafelplan', icon: '🗺️', label: 'Tafelplan' },
  { href: '/gasten', icon: '👤', label: 'Gasten CRM' },
  { href: '/no-show', icon: '🛡️', label: 'No-show' },
  { href: '/online-boeking', icon: '📱', label: 'Online Boeking' },
  { href: '/instellingen', icon: '⚙️', label: 'Instellingen' },
]

export default function DashboardLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const pathname = usePathname()
  const router = useRouter()
  const [session, setSession] = useState<{ restaurantName: string; email: string } | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.push('/login'); return }
    setSession({ restaurantName: s.restaurantName, email: s.email })
  }, [router])

  const { slug } = use(params)
  const base = `/dashboard/${slug}`
  const isActive = (href: string) => {
    if (href === '') return pathname === base
    return pathname.startsWith(`${base}${href}`)
  }

  const logout = () => { clearSession(); router.push('/login') }

  if (!session) return null

  const Sidebar = () => (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Logo */}
      <div className="p-5 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🍽️</span>
          <span className="font-black text-white text-lg">Res<span className="text-blue-400">Vysion</span></span>
        </Link>
        <p className="text-gray-400 text-xs mt-1 truncate">{session.restaurantName}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(item => (
          <Link
            key={item.href}
            href={`${base}${item.href}`}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
              isActive(item.href)
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Publieke link */}
      <div className="p-3 border-t border-gray-800">
        <Link
          href={`/reserveer/${slug}`}
          target="_blank"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white text-sm font-medium transition-colors"
        >
          <span className="text-lg">🔗</span>
          Reservatiepagina bekijken
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-gray-800 text-sm font-medium transition-colors mt-1"
        >
          <span className="text-lg">🚪</span>
          Uitloggen
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 fixed left-0 top-0 bottom-0 z-30">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 z-50">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gray-900 z-30 flex items-center justify-between px-4">
        <button onClick={() => setMobileOpen(true)} className="text-white p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-white font-bold">{session.restaurantName}</span>
        <div className="w-10" />
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        <div className="p-6 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
