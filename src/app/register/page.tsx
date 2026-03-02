'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { registerOwner, loginOwner } from '@/lib/auth'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    restaurantName: '',
    slug: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const set = (k: keyof typeof form, v: string) => {
    setForm(p => {
      const updated = { ...p, [k]: v }
      if (k === 'restaurantName') updated.slug = slugify(v)
      return updated
    })
    setError('')
  }

  const nextStep = () => {
    if (!form.restaurantName.trim()) return setError('Vul de naam van je restaurant in')
    if (!form.slug.trim()) return setError('Vul een URL-naam in')
    setStep(2)
  }

  const submit = async () => {
    if (!form.email.includes('@')) return setError('Ongeldig e-mailadres')
    if (form.password.length < 8) return setError('Wachtwoord moet minstens 8 tekens zijn')
    if (form.password !== form.confirmPassword) return setError('Wachtwoorden komen niet overeen')

    setLoading(true)
    setError('')

    // Stap 1: registreer
    const regResult = await registerOwner({
      email: form.email,
      password: form.password,
      restaurantName: form.restaurantName,
      slug: form.slug,
      phone: form.phone,
    })

    if (regResult.error) {
      setLoading(false)
      return setError(regResult.error)
    }

    // Stap 2: direct inloggen — geen email-bevestiging nodig
    const loginResult = await loginOwner(form.email, form.password)

    setLoading(false)

    if (loginResult.error) {
      return setError('Account aangemaakt maar inloggen mislukt. Probeer in te loggen.')
    }

    router.push(`/dashboard/${loginResult.user?.slug}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🍽️</span>
            <span className="text-2xl font-black text-white">Res<span className="text-blue-200">Vysion</span></span>
          </Link>
          <p className="text-blue-200 mt-2">30 dagen gratis proberen</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">

          {/* Stappen indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-3 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step >= s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}>{s}</div>
                {s < 2 && <div className={`flex-1 h-1 rounded-full transition-colors ${step > s ? 'bg-blue-600' : 'bg-gray-100'}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-black text-gray-900">Jouw restaurant</h1>
                <p className="text-gray-500 text-sm mt-1">Hoe noem je jouw zaak?</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Naam van je restaurant *</label>
                <input
                  type="text"
                  value={form.restaurantName}
                  onChange={e => set('restaurantName', e.target.value)}
                  placeholder="Bv. Restaurant De Gouden Lepel"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-gray-900"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jouw reservatie-URL
                  <span className="ml-2 text-xs text-gray-400 font-normal">Klanten reserveren op deze link</span>
                </label>
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500">
                  <span className="px-3 py-3 bg-gray-50 text-gray-400 text-sm border-r border-gray-200 whitespace-nowrap">resvysion.app/reserveer/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => set('slug', slugify(e.target.value))}
                    className="flex-1 px-3 py-3 focus:outline-none text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Telefoon <span className="text-gray-400 font-normal">(optioneel)</span></label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+32 4xx xx xx xx"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-gray-900"
                />
              </div>

              {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

              <button
                onClick={nextStep}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors"
              >
                Volgende →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-black text-gray-900">Jouw account</h1>
                <p className="text-gray-500 text-sm mt-1">Waarmee log je in?</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">E-mailadres *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="jij@restaurant.be"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-gray-900"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Wachtwoord *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Minstens 8 tekens"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Wachtwoord bevestigen *</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => set('confirmPassword', e.target.value)}
                  placeholder="Herhaal wachtwoord"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-gray-900"
                  onKeyDown={e => e.key === 'Enter' && submit()}
                />
              </div>

              {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

              <button
                onClick={submit}
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {loading ? '⏳ Account aanmaken...' : '🚀 Start gratis proefperiode'}
              </button>

              <button onClick={() => setStep(1)} className="w-full text-gray-400 text-sm hover:text-gray-600 py-2">
                ← Terug
              </button>
            </div>
          )}

          <p className="text-center text-sm text-gray-400 mt-6">
            Al een account?{' '}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">Inloggen</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
