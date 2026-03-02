'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function WachtwoordVergetenPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!email.includes('@')) return setError('Vul een geldig e-mailadres in')
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      return setError(data.error || 'Er is iets misgegaan')
    }

    setSent(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🍽️</span>
            <span className="text-2xl font-black text-white">Res<span className="text-blue-200">Vysion</span></span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">

          {sent ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📧</div>
              <h1 className="text-2xl font-black text-gray-900 mb-2">Check je inbox</h1>
              <p className="text-gray-500 text-sm mb-6">
                We hebben een reset-link gestuurd naar <strong>{email}</strong>.<br />
                Controleer ook je spamfolder.
              </p>
              <Link href="/login" className="text-blue-600 font-semibold hover:underline text-sm">
                ← Terug naar inloggen
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-black text-gray-900 mb-2">Wachtwoord vergeten</h1>
              <p className="text-gray-500 text-sm mb-6">
                Vul je e-mailadres in en we sturen je een reset-link.
              </p>

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
                    onKeyDown={e => e.key === 'Enter' && submit()}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <button
                  onClick={submit}
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {loading ? '⏳ Versturen...' : 'Reset-link sturen →'}
                </button>

                <Link href="/login" className="block text-center text-gray-400 text-sm hover:text-gray-600 py-2">
                  ← Terug naar inloggen
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
