'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

interface Tenant {
  id: string
  restaurant_name: string
  slug: string
  email: string
  phone: string
  plan: string
  subscription_status: string
  trial_ends_at: string
  created_at: string
}

export default function SuperAdminPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total: 0, trial: 0, active: 0, cancelled: 0 })

  useEffect(() => {
    const session = getSession()
    if (!session || session.role !== 'superadmin') {
      router.push('/login')
      return
    }
    load()
  }, [router])

  const load = async () => {
    const { data } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })

    const list = data || []
    setTenants(list)
    setStats({
      total: list.length,
      trial: list.filter(t => t.subscription_status === 'trial').length,
      active: list.filter(t => t.subscription_status === 'active').length,
      cancelled: list.filter(t => t.subscription_status === 'cancelled').length,
    })
    setLoading(false)
  }

  const updatePlan = async (id: string, plan: string, status: string) => {
    await supabase.from('tenants').update({ plan, subscription_status: status }).eq('id', id)
    setTenants(prev => prev.map(t => t.id === id ? { ...t, plan, subscription_status: status } : t))
  }

  const deleteTenant = async (id: string, name: string) => {
    if (!confirm(`Weet je zeker dat je "${name}" wil verwijderen?`)) return
    await supabase.from('tenants').delete().eq('id', id)
    setTenants(prev => prev.filter(t => t.id !== id))
  }

  const filtered = tenants.filter(t =>
    search === '' ||
    t.restaurant_name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.includes(search.toLowerCase())
  )

  const planBadge: Record<string, string> = {
    trial: 'bg-yellow-100 text-yellow-700',
    starter: 'bg-blue-100 text-blue-700',
    pro: 'bg-purple-100 text-purple-700',
  }
  const statusBadge: Record<string, string> = {
    trial: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
    expired: 'bg-gray-100 text-gray-600',
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🍽️</span>
              <h1 className="text-2xl font-black text-white">ResVysion <span className="text-blue-400">Superadmin</span></h1>
            </div>
            <p className="text-gray-400 mt-1">Beheer alle restaurants</p>
          </div>
          <button
            onClick={() => { localStorage.removeItem('rv_session'); router.push('/login') }}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700"
          >
            Uitloggen
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Totaal', value: stats.total, color: 'text-white' },
            { label: 'Trial', value: stats.trial, color: 'text-yellow-400' },
            { label: 'Actief (betaald)', value: stats.active, color: 'text-green-400' },
            { label: 'Geannuleerd', value: stats.cancelled, color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-800 rounded-2xl p-5 text-center">
              <p className={`text-4xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-gray-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Zoekbalk */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Zoek op naam, email of slug..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />

        {/* Restaurantlijst */}
        <div className="bg-gray-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-6 gap-4 px-6 py-3 border-b border-gray-700 text-xs font-bold text-gray-400 uppercase tracking-wide">
            <div className="col-span-2">Restaurant</div>
            <div>Slug</div>
            <div>Plan</div>
            <div>Status</div>
            <div>Acties</div>
          </div>

          <div className="divide-y divide-gray-700">
            {filtered.map(tenant => {
              const trialDays = Math.max(0, Math.ceil((new Date(tenant.trial_ends_at).getTime() - Date.now()) / 86400000))
              return (
                <div key={tenant.id} className="grid grid-cols-6 gap-4 px-6 py-4 items-center hover:bg-gray-750">
                  <div className="col-span-2">
                    <p className="font-bold text-white">{tenant.restaurant_name}</p>
                    <p className="text-gray-400 text-xs">{tenant.email}</p>
                    {tenant.phone && <p className="text-gray-500 text-xs">📞 {tenant.phone}</p>}
                    <p className="text-gray-600 text-xs mt-1">
                      Aangemeld: {new Date(tenant.created_at).toLocaleDateString('nl-BE')}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-300 text-sm font-mono">{tenant.slug}</p>
                    <a
                      href={`/reserveer/${tenant.slug}`}
                      target="_blank"
                      className="text-blue-400 text-xs hover:underline"
                    >
                      Bekijk pagina →
                    </a>
                  </div>

                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${planBadge[tenant.plan] || 'bg-gray-700 text-gray-300'}`}>
                      {tenant.plan}
                    </span>
                  </div>

                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusBadge[tenant.subscription_status] || 'bg-gray-700 text-gray-300'}`}>
                      {tenant.subscription_status}
                    </span>
                    {tenant.subscription_status === 'trial' && (
                      <p className="text-xs text-gray-500 mt-1">{trialDays} dagen resterend</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <select
                      value={`${tenant.plan}-${tenant.subscription_status}`}
                      onChange={e => {
                        const [plan, status] = e.target.value.split('-')
                        updatePlan(tenant.id, plan, status)
                      }}
                      className="bg-gray-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                    >
                      <option value="trial-trial">Trial</option>
                      <option value="starter-active">Starter - Actief</option>
                      <option value="pro-active">Pro - Actief</option>
                      <option value="starter-cancelled">Geannuleerd</option>
                    </select>
                    <button
                      onClick={() => deleteTenant(tenant.id, tenant.restaurant_name)}
                      className="text-red-400 hover:text-red-300 text-xs text-left"
                    >
                      🗑️ Verwijderen
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              {search ? 'Geen restaurants gevonden' : 'Nog geen restaurants geregistreerd'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
