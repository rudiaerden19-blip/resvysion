'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function InstellingenPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const [form, setForm] = useState({ restaurant_name: '', phone: '', address: '', city: '', postal_code: '', primary_color: '#3B82F6' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('tenants').select('restaurant_name, phone, address, city, postal_code, primary_color').eq('slug', slug).single()
      .then(({ data }) => { if (data) setForm({ restaurant_name: data.restaurant_name || '', phone: data.phone || '', address: data.address || '', city: data.city || '', postal_code: data.postal_code || '', primary_color: data.primary_color || '#3B82F6' }); setLoading(false) })
  }, [slug])

  const save = async () => {
    setSaving(true)
    await supabase.from('tenants').update(form).eq('slug', slug)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">⚙️ Instellingen</h1>
        <p className="text-gray-500 text-sm">Pas je restaurantgegevens aan</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Restaurantgegevens</h2>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Naam restaurant *</label>
          <input value={form.restaurant_name} onChange={e => setForm(p => ({...p, restaurant_name: e.target.value}))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Telefoonnummer</label>
          <input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} placeholder="+32 4xx xx xx xx" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Adres</label>
          <input value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))} placeholder="Straat en nummer" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Postcode</label>
            <input value={form.postal_code} onChange={e => setForm(p => ({...p, postal_code: e.target.value}))} placeholder="2000" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Gemeente</label>
            <input value={form.city} onChange={e => setForm(p => ({...p, city: e.target.value}))} placeholder="Antwerpen" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Kleur van je reservatiepagina</label>
          <div className="flex items-center gap-3">
            <input type="color" value={form.primary_color} onChange={e => setForm(p => ({...p, primary_color: e.target.value}))} className="w-16 h-12 rounded-xl border-2 border-gray-200 cursor-pointer" />
            <span className="text-gray-500 text-sm">Wordt getoond op je publieke boekingspagina</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
        <p className="font-semibold text-blue-800 mb-1">🔗 Jouw boekingslink</p>
        <p className="text-blue-600 text-sm font-mono">{typeof window !== 'undefined' ? window.location.origin : 'https://resvysion.vercel.app'}/reserveer/{slug}</p>
        <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/reserveer/${slug}`)} className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Kopieer link</button>
      </div>

      <div className="flex gap-3 pb-8">
        <button onClick={save} disabled={saving} className={`px-8 py-4 rounded-2xl font-bold text-white text-lg transition-colors ${saved ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'} disabled:opacity-50`}>
          {saving ? '⏳ Opslaan...' : saved ? '✅ Opgeslagen!' : '💾 Opslaan'}
        </button>
        <button onClick={() => { localStorage.removeItem('rv_session'); router.push('/login') }} className="px-6 py-4 border-2 border-red-200 text-red-600 rounded-2xl font-bold hover:bg-red-50">Uitloggen</button>
      </div>
    </div>
  )
}
