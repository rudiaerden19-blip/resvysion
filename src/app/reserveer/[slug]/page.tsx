'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'

interface TenantInfo { restaurant_name: string; address?: string; city?: string; phone?: string; primary_color?: string }

type Step = 'datetime' | 'info' | 'confirm' | 'done'

export default function ReserveerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [timeSlots, setTimeSlots] = useState<string[]>(['11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30'])
  const [maxPartySize, setMaxPartySize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('datetime')
  const [submitting, setSubmitting] = useState(false)
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([])
  const [maxPerSlot, setMaxPerSlot] = useState(5)

  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('2')
  const [partySize, setPartySize] = useState(2)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [reservationId, setReservationId] = useState('')

  const todayStr = new Date().toISOString().split('T')[0]
  const color = tenant?.primary_color || '#3B82F6'

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: bs }] = await Promise.all([
        supabase.from('tenants').select('restaurant_name, address, city, phone, primary_color').eq('slug', slug).single(),
        supabase.from('booking_settings').select('available_time_slots, max_party_size, max_reservations_per_slot').eq('tenant_slug', slug).single()
      ])
      if (t) setTenant(t)
      if (bs) {
        if (bs.available_time_slots) setTimeSlots(bs.available_time_slots)
        if (bs.max_party_size) setMaxPartySize(bs.max_party_size)
        if (bs.max_reservations_per_slot) setMaxPerSlot(bs.max_reservations_per_slot)
      }
      setLoading(false)
    }
    load()
  }, [slug])

  // Check bezette slots op geselecteerde datum
  useEffect(() => {
    if (!date) return
    async function checkAvailability() {
      const { data } = await supabase.from('reservations').select('reservation_time').eq('tenant_slug', slug).eq('reservation_date', date).in('status', ['confirmed', 'pending'])
      if (!data) return
      const slotCounts: Record<string, number> = {}
      for (const r of data) { slotCounts[r.reservation_time] = (slotCounts[r.reservation_time] || 0) + 1 }
      setUnavailableSlots(Object.entries(slotCounts).filter(([, count]) => count >= maxPerSlot).map(([slot]) => slot))
    }
    checkAvailability()
  }, [date, slug, maxPerSlot])

  function calcTimeTo(from: string, hours: string): string {
    if (!from) return ''
    const [h, m] = from.split(':').map(Number)
    const total = h * 60 + m + Number(hours) * 60
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
  }

  function validateStep2() {
    const e: Record<string, boolean> = {}
    if (!firstName.trim()) e.firstName = true
    if (!lastName.trim()) e.lastName = true
    if (!phone.trim()) e.phone = true
    setErrors(e); return Object.keys(e).length === 0
  }

  async function submit() {
    if (!validateStep2()) return
    setSubmitting(true)
    try {
      const timeTo = calcTimeTo(time, duration)
      const res = await fetch('/api/online-reservatie', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug: slug, customer_name: `${firstName.trim()} ${lastName.trim()}`, customer_phone: phone.trim(), customer_email: email.trim(), party_size: partySize, reservation_date: date, reservation_time: time, time_from: time, time_to: timeTo, notes: notes.trim() || null, status: 'confirmed' }),
      })
      const data = await res.json()
      if (data.id) { setReservationId(data.id); setStep('done') }
    } catch (e) { console.error(e) }
    setSubmitting(false)
  }

  const formatDate = (d: string) => d ? new Date(d + 'T12:00').toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: color, borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ backgroundColor: color }} className="text-white py-8 px-4 text-center">
        <h1 className="text-3xl font-black mb-1">{tenant?.restaurant_name || slug}</h1>
        <p className="text-white/80 text-lg">Tafel reserveren</p>
        {tenant?.address && <p className="text-white/60 text-sm mt-1">{tenant.address}{tenant.city ? `, ${tenant.city}` : ''}</p>}
      </div>

      {/* Stappen */}
      <div className="flex items-center justify-center gap-2 py-4 px-4">
        {['datetime', 'info', 'confirm'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step === s || (step === 'done' || ['datetime','info','confirm'].indexOf(step) > i) ? 'text-white' : 'bg-gray-200 text-gray-500'}`}
              style={{ backgroundColor: step === s || step === 'done' || ['datetime','info','confirm'].indexOf(step) > i ? color : undefined }}>
              {i + 1}
            </div>
            {i < 2 && <div className="w-8 h-0.5 bg-gray-200" />}
          </div>
        ))}
      </div>

      <div className="max-w-lg mx-auto px-4 pb-12">
        {step === 'datetime' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Wanneer wilt u reserveren?</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Datum <span className="text-red-500">*</span></label>
              <input type="date" min={todayStr} value={date} onChange={e => { setDate(e.target.value); setTime('') }} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500" />
            </div>
            {date && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tijdstip <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map(t => {
                    const isUnavailable = unavailableSlots.includes(t + ':00') || unavailableSlots.includes(t)
                    return (
                      <button key={t} onClick={() => !isUnavailable && setTime(t)} disabled={isUnavailable}
                        className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors relative ${isUnavailable ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50' : time === t ? 'text-white border-transparent' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                        style={{ backgroundColor: time === t && !isUnavailable ? color : undefined }}>
                        {t}
                        {isUnavailable && <span className="absolute inset-0 flex items-center justify-center text-gray-300 text-lg">✕</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Duur verblijf</label>
              <div className="flex gap-2">
                {['1','1.5','2','2.5','3'].map(d => (
                  <button key={d} onClick={() => setDuration(d)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${duration === d ? 'text-white border-transparent' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`} style={{ backgroundColor: duration === d ? color : undefined }}>{d}u</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Aantal personen <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-4">
                <button onClick={() => setPartySize(p => Math.max(1, p - 1))} className="w-12 h-12 rounded-xl border-2 border-gray-200 text-xl font-bold hover:bg-gray-50">−</button>
                <span className="text-3xl font-black text-gray-900 w-12 text-center">{partySize}</span>
                <button onClick={() => setPartySize(p => Math.min(maxPartySize, p + 1))} className="w-12 h-12 rounded-xl border-2 border-gray-200 text-xl font-bold hover:bg-gray-50">+</button>
                <span className="text-sm text-gray-400">personen (max {maxPartySize})</span>
              </div>
            </div>
            <button onClick={() => date && time && partySize >= 1 && setStep('info')} disabled={!date || !time} className="w-full py-4 rounded-2xl font-black text-white text-lg disabled:opacity-40" style={{ backgroundColor: color }}>Volgende →</button>
          </div>
        )}

        {step === 'info' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Uw gegevens</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Voornaam <span className="text-red-500">*</span></label>
                <input value={firstName} onChange={e => { setFirstName(e.target.value); setErrors(p => ({ ...p, firstName: false })) }} placeholder="Voornaam" className={`w-full border-2 rounded-xl px-3 py-2.5 focus:outline-none ${errors.firstName ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`} />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">Verplicht</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Achternaam <span className="text-red-500">*</span></label>
                <input value={lastName} onChange={e => { setLastName(e.target.value); setErrors(p => ({ ...p, lastName: false })) }} placeholder="Achternaam" className={`w-full border-2 rounded-xl px-3 py-2.5 focus:outline-none ${errors.lastName ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`} />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">Verplicht</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Telefoon <span className="text-red-500">*</span></label>
              <input value={phone} onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: false })) }} placeholder="+32 4xx xx xx xx" type="tel" className={`w-full border-2 rounded-xl px-3 py-2.5 focus:outline-none ${errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`} />
              {errors.phone && <p className="text-red-500 text-xs mt-1">Verplicht</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(voor bevestiging)</span></label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="naam@email.com" type="email" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Notities <span className="text-gray-400 font-normal">(allergieën, speciale wensen...)</span></label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('datetime')} className="flex-1 py-3 border-2 border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50">← Terug</button>
              <button onClick={() => validateStep2() && setStep('confirm')} className="flex-1 py-3 rounded-2xl font-bold text-white" style={{ backgroundColor: color }}>Controleren →</button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Controleer uw reservatie</h2>
            <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
              {[
                { icon: '📅', label: 'Datum', value: formatDate(date) },
                { icon: '🕐', label: 'Uur', value: `${time} → ${calcTimeTo(time, duration)}` },
                { icon: '👥', label: 'Personen', value: `${partySize} ${partySize === 1 ? 'persoon' : 'personen'}` },
                { icon: '👤', label: 'Naam', value: `${firstName} ${lastName}` },
                { icon: '📱', label: 'Telefoon', value: phone },
                ...(email ? [{ icon: '📧', label: 'Email', value: email }] : []),
                ...(notes ? [{ icon: '📝', label: 'Notitie', value: notes }] : []),
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div><p className="text-xs text-gray-400">{item.label}</p><p className="font-bold text-gray-900">{item.value}</p></div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('info')} className="flex-1 py-3 border-2 border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50">← Terug</button>
              <button onClick={submit} disabled={submitting} className="flex-1 py-3 rounded-2xl font-black text-white disabled:opacity-60" style={{ backgroundColor: color }}>
                {submitting ? '⏳ Bezig...' : '✅ Bevestig reservatie'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: `${color}20` }}>
              <span className="text-5xl">🎉</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Reservatie bevestigd!</h2>
            <p className="text-gray-500 mb-6">
              Bedankt {firstName}! Uw tafel bij <strong>{tenant?.restaurant_name}</strong> is gereserveerd voor <strong>{formatDate(date)}</strong> om <strong>{time}</strong>.
            </p>
            {email && (
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <p className="text-blue-700 text-sm font-medium">📧 Een bevestigingsmail werd verstuurd naar <strong>{email}</strong></p>
              </div>
            )}
            {tenant?.phone && <p className="text-gray-400 text-sm">Annuleren? Bel <a href={`tel:${tenant.phone}`} className="font-bold text-gray-700">{tenant.phone}</a></p>}
            <button onClick={() => { setStep('datetime'); setDate(''); setTime(''); setFirstName(''); setLastName(''); setPhone(''); setEmail(''); setNotes('') }} className="mt-6 px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50">Nieuwe reservatie maken</button>
          </div>
        )}
      </div>
    </div>
  )
}
