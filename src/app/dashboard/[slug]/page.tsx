'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Stats {
  todayCount: number
  pendingCount: number
  weekCount: number
  noShowCount: number
  todayReservations: Array<{
    id: string
    customer_name: string
    party_size: number
    reservation_time: string
    status: string
  }>
}

export default function DashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const { slug } = use(params)
  const today = new Date().toISOString().split('T')[0]
  const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      const [todayRes, pendingRes, weekRes, noShowRes] = await Promise.all([
        supabase.from('reservations').select('id,customer_name,party_size,reservation_time,status').eq('tenant_slug', slug).eq('reservation_date', today).order('reservation_time'),
        supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('tenant_slug', slug).eq('status', 'pending'),
        supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('tenant_slug', slug).gte('reservation_date', today).lte('reservation_date', weekFromNow).not('status', 'in', '("cancelled","no_show")'),
        supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('tenant_slug', slug).eq('status', 'no_show'),
      ])

      setStats({
        todayCount: todayRes.data?.length || 0,
        pendingCount: pendingRes.count || 0,
        weekCount: weekRes.count || 0,
        noShowCount: noShowRes.count || 0,
        todayReservations: todayRes.data || [],
      })
      setLoading(false)
    }
    load()
  }, [slug, today, weekFromNow])

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-600',
    no_show: 'bg-purple-100 text-purple-700',
  }
  const statusLabel: Record<string, string> = {
    pending: '⏳ Wacht',
    confirmed: '✓ Bevestigd',
    completed: '✔️ Voltooid',
    cancelled: '❌ Geannuleerd',
    no_show: '👻 No-show',
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Goedendag 👋</h1>
          <p className="text-gray-500">{new Date().toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <Link
          href={`/dashboard/${slug}/reserveringen`}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 text-sm"
        >
          + Nieuwe reservatie
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Vandaag', value: stats!.todayCount, icon: '📅', color: 'text-blue-600', href: `/dashboard/${slug}/reserveringen` },
          { label: 'Wacht op bevestiging', value: stats!.pendingCount, icon: '⏳', color: stats!.pendingCount > 0 ? 'text-yellow-500' : 'text-gray-400', href: `/dashboard/${slug}/reserveringen` },
          { label: 'Deze week', value: stats!.weekCount, icon: '📆', color: 'text-green-500', href: `/dashboard/${slug}/reserveringen` },
          { label: 'No-shows totaal', value: stats!.noShowCount, icon: '👻', color: stats!.noShowCount > 0 ? 'text-purple-500' : 'text-gray-400', href: `/dashboard/${slug}/no-show` },
        ].map(s => (
          <Link key={s.label} href={s.href} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{s.icon}</span>
            </div>
            <p className={`text-4xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-gray-500 text-sm mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Vandaag */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">📅 Vandaag</h2>
          <Link href={`/dashboard/${slug}/reserveringen`} className="text-blue-600 text-sm font-medium hover:underline">
            Alles bekijken →
          </Link>
        </div>

        {stats!.todayReservations.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-5xl block mb-3">🎉</span>
            <p className="text-gray-500">Geen reservaties vandaag</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {stats!.todayReservations.map(r => (
              <div key={r.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="text-center bg-gray-50 rounded-xl px-3 py-2 min-w-[60px]">
                    <p className="text-xl font-black text-gray-900">{r.reservation_time.slice(0, 5)}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{r.customer_name}</p>
                    <p className="text-sm text-gray-500">👥 {r.party_size} personen</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor[r.status] || 'bg-gray-100 text-gray-600'}`}>
                  {statusLabel[r.status] || r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Snelle links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: `/dashboard/${slug}/tafelplan`, icon: '🗺️', label: 'Tafelplan', desc: 'Zie je zaal live' },
          { href: `/dashboard/${slug}/gasten`, icon: '👤', label: 'Gasten CRM', desc: 'Ken je klanten' },
          { href: `/dashboard/${slug}/no-show`, icon: '🛡️', label: 'No-show', desc: 'Bescherm je zaak' },
          { href: `/dashboard/${slug}/online-boeking`, icon: '📱', label: 'Instellingen', desc: 'Pas alles aan' },
        ].map(l => (
          <Link key={l.href} href={l.href} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-3xl block mb-2">{l.icon}</span>
            <p className="font-bold text-gray-900">{l.label}</p>
            <p className="text-gray-500 text-sm">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
