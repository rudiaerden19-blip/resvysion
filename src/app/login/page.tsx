'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loginOwner } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!email || !password) return setError('Vul alle velden in')
    setLoading(true)
    setError('')

    const result = await loginOwner(email, password)
    setLoading(false)

    if (result.error) return setError(result.error)

    if (result.user?.role === 'superadmin') {
      router.push('/superadmin')
    } else {
      router.push(`/dashboard/${result.user?.slug}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🍽️</span>
            <span className="text-2xl font-black text-white">Res<span className="text-blue-200">Vysion</span></span>
          </Link>
          <p className="text-blue-200 mt-2">Inloggen op jouw dashboard</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h1 className="text-2xl font-black text-gray-900 mb-6">Welkom terug</h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">E-mailadres</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="jij@restaurant.be"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-gray-900"
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">Wachtwoord</label>
                <Link href="/wachtwoord-vergeten" className="text-xs text-blue-600 hover:underline">Vergeten?</Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="••••••••"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-gray-900"
                onKeyDown={e => e.key === 'Enter' && submit()}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">⚠️ {error}</p>
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {loading ? '⏳ Inloggen...' : 'Inloggen →'}
            </button>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            Nog geen account?{' '}
            <Link href="/register" className="text-blue-600 font-semibold hover:underline">
              30 dagen gratis proberen
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
