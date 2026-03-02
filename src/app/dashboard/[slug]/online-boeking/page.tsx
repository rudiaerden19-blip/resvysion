'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'

const DAYS = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DEFAULT_TIME_SLOTS = ['11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30']

interface BookingSettings {
  online_booking_enabled: boolean
  max_reservations_per_slot: number
  max_party_size: number
  min_advance_hours: number
  max_advance_days: number
  available_time_slots: string[]
  booking_days: string[]
  reservation_duration_minutes: number
  auto_confirm: boolean
  require_phone: boolean
  require_email: boolean
}

const DEFAULTS: BookingSettings = {
  online_booking_enabled: true, max_reservations_per_slot: 5, max_party_size: 10,
  min_advance_hours: 2, max_advance_days: 60, available_time_slots: DEFAULT_TIME_SLOTS,
  booking_days: DAY_KEYS, reservation_duration_minutes: 120, auto_confirm: true,
  require_phone: true, require_email: false,
}

export default function OnlineBoekingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [settings, setSettings] = useState<BookingSettings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newSlot, setNewSlot] = useState('')

  useEffect(() => {
    supabase.from('booking_settings').select('*').eq('tenant_slug', slug).single()
      .then(({ data }) => {
        if (data) {
          setSettings({
            online_booking_enabled: data.online_booking_enabled ?? DEFAULTS.online_booking_enabled,
            max_reservations_per_slot: data.max_reservations_per_slot ?? DEFAULTS.max_reservations_per_slot,
            max_party_size: data.max_party_size ?? DEFAULTS.max_party_size,
            min_advance_hours: data.min_advance_hours ?? DEFAULTS.min_advance_hours,
            max_advance_days: data.max_advance_days ?? DEFAULTS.max_advance_days,
            available_time_slots: data.available_time_slots ?? DEFAULTS.available_time_slots,
            booking_days: data.booking_days ?? DEFAULTS.booking_days,
            reservation_duration_minutes: data.reservation_duration_minutes ?? DEFAULTS.reservation_duration_minutes,
            auto_confirm: data.auto_confirm ?? DEFAULTS.auto_confirm,
            require_phone: data.require_phone ?? DEFAULTS.require_phone,
            require_email: data.require_email ?? DEFAULTS.require_email,
          })
        }
        setLoading(false)
      })
  }, [slug])

  const save = async () => {
    setSaving(true)
    await supabase.from('booking_settings').upsert({ tenant_slug: slug, ...settings }, { onConflict: 'tenant_slug' })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  const toggleDay = (day: string) => setSettings(p => ({ ...p, booking_days: p.booking_days.includes(day) ? p.booking_days.filter(d => d !== day) : [...p.booking_days, day] }))
  const toggleSlot = (slot: string) => setSettings(p => ({ ...p, available_time_slots: p.available_time_slots.includes(slot) ? p.available_time_slots.filter(s => s !== slot) : [...p.available_time_slots, slot].sort() }))
  const addCustomSlot = () => { if (!newSlot || settings.available_time_slots.includes(newSlot)) return; setSettings(p => ({ ...p, available_time_slots: [...p.available_time_slots, newSlot].sort() })); setNewSlot('') }

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📱 Online Boeking</h1>
        <p className="text-gray-500 text-sm">Stel in hoe klanten online kunnen reserveren</p>
      </div>

      {/* Hoofdschakelaar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Online reservaties inschakelen</h2>
            <p className="text-gray-500 text-sm mt-1">{settings.online_booking_enabled ? 'Klanten kunnen nu online reserveren' : 'Online reservaties zijn uitgeschakeld'}</p>
          </div>
          <button onClick={() => setSettings(p => ({ ...p, online_booking_enabled: !p.online_booking_enabled }))} className={`relative w-14 h-8 rounded-full transition-colors ${settings.online_booking_enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
            <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.online_booking_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {settings.online_booking_enabled && (
        <>
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-gray-900">🪑 Capaciteit & limieten</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Max. reservaties per tijdslot', key: 'max_reservations_per_slot', min: 1, max: 50 },
                { label: 'Max. personen per reservatie', key: 'max_party_size', min: 1, max: 50 },
                { label: 'Min. uren op voorhand', key: 'min_advance_hours', min: 0, max: 72 },
                { label: 'Max. dagen op voorhand', key: 'max_advance_days', min: 1, max: 365 },
              ].map(({ label, key, min, max }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                  <input type="number" min={min} max={max} value={settings[key as keyof BookingSettings] as number} onChange={e => setSettings(p => ({ ...p, [key]: Number(e.target.value) }))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-blue-500" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reservatieduur</label>
                <select value={settings.reservation_duration_minutes} onChange={e => setSettings(p => ({ ...p, reservation_duration_minutes: Number(e.target.value) }))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-blue-500">
                  <option value={60}>1 uur</option><option value={90}>1,5 uur</option><option value={120}>2 uur</option><option value={150}>2,5 uur</option><option value={180}>3 uur</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📅 Beschikbare dagen</h2>
            <div className="grid grid-cols-4 gap-2">
              {DAYS.map((day, i) => {
                const key = DAY_KEYS[i]; const active = settings.booking_days.includes(key)
                return <button key={key} onClick={() => toggleDay(key)} className={`py-3 rounded-xl text-sm font-bold border-2 transition-colors ${active ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>{day.slice(0, 2)}</button>
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1">🕐 Beschikbare tijdsloten</h2>
            <p className="text-gray-500 text-sm mb-4">Klik om een tijdslot in/uit te schakelen</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {DEFAULT_TIME_SLOTS.map(slot => {
                const active = settings.available_time_slots.includes(slot)
                return <button key={slot} onClick={() => toggleSlot(slot)} className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-colors ${active ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>{slot}</button>
              })}
            </div>
            <div className="flex gap-2">
              <input type="time" value={newSlot} onChange={e => setNewSlot(e.target.value)} className="border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500" />
              <button onClick={addCustomSlot} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium">+ Eigen tijdslot</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">⚙️ Opties</h2>
            {[
              { key: 'auto_confirm', label: 'Automatisch bevestigen', desc: 'Reservaties worden direct bevestigd zonder jouw goedkeuring' },
              { key: 'require_phone', label: 'Telefoonnummer verplicht', desc: 'Klant moet een telefoonnummer opgeven' },
              { key: 'require_email', label: 'E-mail verplicht', desc: 'Klant moet een e-mailadres opgeven' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div><p className="font-medium text-gray-900">{label}</p><p className="text-sm text-gray-500">{desc}</p></div>
                <button onClick={() => setSettings(p => ({ ...p, [key]: !p[key as keyof BookingSettings] }))} className={`relative w-12 h-7 rounded-full transition-colors ${settings[key as keyof BookingSettings] ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings[key as keyof BookingSettings] ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex justify-end pb-8">
        <button onClick={save} disabled={saving} className={`px-8 py-4 rounded-2xl font-bold text-white text-lg transition-colors ${saved ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'} disabled:opacity-50`}>
          {saving ? '⏳ Opslaan...' : saved ? '✅ Opgeslagen!' : '💾 Opslaan'}
        </button>
      </div>
    </div>
  )
}
