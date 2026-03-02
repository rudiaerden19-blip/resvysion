'use client'

import { useState, useEffect, useCallback, useMemo, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface Reservation {
  id: string
  tenant_slug: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  reservation_date: string
  reservation_time: string
  party_size: number
  notes?: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  created_at: string
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '⏳ Wacht op bevestiging' },
  confirmed: { bg: 'bg-green-100',  text: 'text-green-700',  label: '✓ Bevestigd' },
  cancelled: { bg: 'bg-red-100',    text: 'text-red-700',    label: '❌ Geannuleerd' },
  completed: { bg: 'bg-gray-100',   text: 'text-gray-700',   label: '✔️ Voltooid' },
  no_show:   { bg: 'bg-purple-100', text: 'text-purple-700', label: '👻 No-show' },
}

export default function ReserveringenPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'upcoming' | 'today' | 'all'>('upcoming')
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [rejectingReservation, setRejectingReservation] = useState<Reservation | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [onlineEnabled, setOnlineEnabled] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState({ customer_name: '', customer_phone: '', customer_email: '', party_size: 2, reservation_date: '', reservation_time: '12:00', notes: '' })
  const [addLoading, setAddLoading] = useState(false)

  useEffect(() => {
    supabase.from('booking_settings').select('online_booking_enabled').eq('tenant_slug', slug).single()
      .then(({ data }) => { if (data) setOnlineEnabled(data.online_booking_enabled !== false) })
  }, [slug])

  const toggleOnline = async () => {
    setSavingSettings(true)
    await supabase.from('booking_settings').upsert({ tenant_slug: slug, online_booking_enabled: !onlineEnabled }, { onConflict: 'tenant_slug' })
    setOnlineEnabled(p => !p)
    setSavingSettings(false)
  }

  const loadReservations = useCallback(async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    let query = supabase.from('reservations').select('*').eq('tenant_slug', slug)
      .order('reservation_date', { ascending: true }).order('reservation_time', { ascending: true })

    if (filter === 'upcoming') query = query.gte('reservation_date', today).not('status', 'in', '("cancelled","completed","no_show")')
    else if (filter === 'today') query = query.eq('reservation_date', today)

    const { data } = await query
    setReservations(data || [])
    setLoading(false)
  }, [slug, filter])

  useEffect(() => { loadReservations() }, [loadReservations])

  // Real-time
  useEffect(() => {
    const channel = supabase.channel('reservations-realtime').on('postgres_changes', {
      event: '*', schema: 'public', table: 'reservations', filter: `tenant_slug=eq.${slug}`,
    }, () => loadReservations()).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [slug, loadReservations])

  const updateStatus = async (id: string, newStatus: string, reason?: string) => {
    setUpdatingId(id)
    const reservation = reservations.find(r => r.id === id)
    const { error } = await supabase.from('reservations').update({ status: newStatus }).eq('id', id)
    if (!error) {
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus as Reservation['status'] } : r))
      if (reservation?.customer_email && (newStatus === 'confirmed' || newStatus === 'cancelled')) {
        fetch('/api/send-reservation-email', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reservationId: id, status: newStatus, customerEmail: reservation.customer_email,
            customerName: reservation.customer_name, customerPhone: reservation.customer_phone,
            reservationDate: reservation.reservation_date, reservationTime: reservation.reservation_time,
            partySize: reservation.party_size, tenantSlug: slug, rejectionReason: reason || '',
          }),
        }).catch(() => {})
      }
    }
    setUpdatingId(null)
  }

  const handleReject = async () => {
    if (!rejectingReservation || !rejectionReason.trim()) return
    await updateStatus(rejectingReservation.id, 'cancelled', rejectionReason)
    setRejectingReservation(null)
    setRejectionReason('')
  }

  const deleteReservation = async (id: string) => {
    if (!confirm('Reservatie verwijderen?')) return
    await supabase.from('reservations').delete().eq('id', id)
    setReservations(prev => prev.filter(r => r.id !== id))
    setSelectedReservation(null)
  }

  const addReservation = async () => {
    if (!addForm.customer_name || !addForm.customer_phone || !addForm.reservation_date) return
    setAddLoading(true)
    await supabase.from('reservations').insert({
      tenant_slug: slug, ...addForm, status: 'confirmed', source: 'admin',
      time_from: addForm.reservation_time, reservation_time: addForm.reservation_time,
    })
    setShowAddForm(false)
    setAddForm({ customer_name: '', customer_phone: '', customer_email: '', party_size: 2, reservation_date: '', reservation_time: '12:00', notes: '' })
    setAddLoading(false)
    loadReservations()
  }

  const formatDate = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    if (dateString === today) return 'Vandaag'
    if (dateString === tomorrow) return 'Morgen'
    return new Date(dateString + 'T12:00').toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const isPast = (date: string, time: string) => new Date(`${date}T${time}`) < new Date()

  const pendingCount = reservations.filter(r => r.status === 'pending').length
  const todayCount = reservations.filter(r => r.reservation_date === new Date().toISOString().split('T')[0]).length

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Online aan/uit */}
      <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900">Online reservaties</h2>
          <p className="text-gray-500 text-sm">{onlineEnabled ? 'Klanten kunnen online reserveren' : 'Online formulier is uitgeschakeld'}</p>
        </div>
        <button onClick={toggleOnline} disabled={savingSettings}
          className={`relative w-12 h-7 rounded-full transition-colors ${onlineEnabled ? 'bg-green-500' : 'bg-gray-300'} ${savingSettings ? 'opacity-50' : ''}`}>
          <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${onlineEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservaties</h1>
          <p className="text-gray-500 text-sm">
            {pendingCount > 0 && <span className="text-yellow-600 font-medium">{pendingCount} wacht op bevestiging</span>}
            {pendingCount > 0 && todayCount > 0 && ' • '}
            {todayCount > 0 && <span className="text-blue-600 font-medium">{todayCount} vandaag</span>}
            {pendingCount === 0 && todayCount === 0 && 'Beheer je reservaties'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadReservations} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl" title="Vernieuwen">🔄</button>
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(['upcoming', 'today', 'all'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${filter === f ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                {f === 'upcoming' ? 'Aankomend' : f === 'today' ? 'Vandaag' : 'Alles'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAddForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700">
            + Reservatie
          </button>
        </div>
      </div>

      {/* Melding wachtende reservaties */}
      {pendingCount > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-center gap-4">
          <span className="text-3xl">📅</span>
          <div>
            <p className="font-bold text-yellow-800">{pendingCount} nieuwe {pendingCount > 1 ? 'reservaties' : 'reservatie'}</p>
            <p className="text-yellow-700 text-sm">Bevestig of weiger zo snel mogelijk</p>
          </div>
        </div>
      )}

      {/* Lijst */}
      <div className="space-y-4">
        <AnimatePresence>
          {reservations.map((reservation, index) => {
            const config = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.pending
            const isToday = reservation.reservation_date === new Date().toISOString().split('T')[0]
            return (
              <motion.div key={reservation.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }} transition={{ delay: index * 0.03 }}
                className={`bg-white rounded-2xl p-6 shadow-sm ${reservation.status === 'pending' ? 'ring-2 ring-yellow-400' : ''} ${reservation.status === 'no_show' ? 'ring-2 ring-purple-300 opacity-75' : ''} ${isToday ? 'border-l-4 border-blue-500' : ''}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className={`text-center p-4 rounded-xl ${isToday ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <p className={`text-2xl font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>{reservation.reservation_time.slice(0, 5)}</p>
                      <p className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>{formatDate(reservation.reservation_date)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">{reservation.customer_name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>{config.label}</span>
                      </div>
                      <p className="text-gray-600">📞 {reservation.customer_phone}</p>
                      {reservation.customer_email && <p className="text-gray-500 text-sm">✉️ {reservation.customer_email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">{reservation.party_size}</p>
                      <p className="text-sm text-gray-500">personen</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {reservation.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(reservation.id, 'confirmed')} disabled={updatingId === reservation.id} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-sm disabled:opacity-50">✓ Bevestigen</button>
                          <button onClick={() => setRejectingReservation(reservation)} disabled={updatingId === reservation.id} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-sm disabled:opacity-50">✕ Weigeren</button>
                        </>
                      )}
                      {reservation.status === 'confirmed' && (
                        <>
                          <button onClick={() => updateStatus(reservation.id, 'completed')} disabled={updatingId === reservation.id} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium text-sm disabled:opacity-50">✔️ Voltooid</button>
                          {isPast(reservation.reservation_date, reservation.reservation_time) && (
                            <button onClick={() => updateStatus(reservation.id, 'no_show')} disabled={updatingId === reservation.id} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium text-sm disabled:opacity-50">👻 No-show</button>
                          )}
                        </>
                      )}
                      {(reservation.status === 'completed' || reservation.status === 'cancelled' || reservation.status === 'no_show') && (
                        <button onClick={() => deleteReservation(reservation.id)} className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium text-sm">🗑️ Verwijderen</button>
                      )}
                      <button onClick={() => setSelectedReservation(reservation)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm text-gray-700">📋 Details</button>
                    </div>
                  </div>
                </div>
                {reservation.notes && <div className="mt-4 p-3 bg-gray-50 rounded-xl"><p className="text-sm text-gray-600">💬 {reservation.notes}</p></div>}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {reservations.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
          <span className="text-6xl mb-4 block">📅</span>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Geen reservaties</h3>
          <p className="text-gray-500">{filter === 'upcoming' ? 'Geen aankomende reservaties' : filter === 'today' ? 'Geen reservaties vandaag' : 'Nog geen reservaties'}</p>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedReservation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedReservation(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
              <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Details</h2>
                  <p className="text-gray-500">{formatDate(selectedReservation.reservation_date)} om {selectedReservation.reservation_time.slice(0, 5)}</p>
                </div>
                <button onClick={() => setSelectedReservation(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-blue-600">{selectedReservation.party_size}</p>
                    <p className="text-blue-600 text-sm">personen</p>
                  </div>
                  <div className={`rounded-xl p-4 text-center ${STATUS_CONFIG[selectedReservation.status]?.bg}`}>
                    <p className={`text-lg font-bold ${STATUS_CONFIG[selectedReservation.status]?.text}`}>{STATUS_CONFIG[selectedReservation.status]?.label}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">Klant</p>
                  <p className="font-bold text-gray-900 text-lg">{selectedReservation.customer_name}</p>
                  <p className="text-gray-600">📞 {selectedReservation.customer_phone}</p>
                  {selectedReservation.customer_email && <p className="text-gray-600">✉️ {selectedReservation.customer_email}</p>}
                </div>
                {selectedReservation.notes && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-blue-600 mb-1">Notities</p>
                    <p className="text-gray-900">{selectedReservation.notes}</p>
                  </div>
                )}
                <div className="text-sm text-gray-500">Aangemeld: {new Date(selectedReservation.created_at).toLocaleString('nl-BE')}</div>
              </div>
              <div className="p-6 border-t bg-gray-50 flex gap-3">
                <button onClick={() => setSelectedReservation(null)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-100 font-medium">Sluiten</button>
                <button onClick={() => deleteReservation(selectedReservation.id)} className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium">🗑️ Verwijderen</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weigeren Modal */}
      <AnimatePresence>
        {rejectingReservation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRejectingReservation(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
              <div className="p-6 border-b bg-red-50">
                <h2 className="text-xl font-bold text-red-700">Reservatie weigeren</h2>
                <p className="text-red-600 text-sm mt-1">{rejectingReservation.customer_name} — {rejectingReservation.reservation_date}</p>
              </div>
              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Reden <span className="text-red-500">*</span></label>
                <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                  placeholder="bv. Volledig geboekt, gesloten die dag..." rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 resize-none" />
                <p className="text-gray-500 text-sm mt-2">De reden wordt per e-mail doorgestuurd naar de klant.</p>
              </div>
              <div className="p-6 border-t bg-gray-50 flex gap-3">
                <button onClick={() => { setRejectingReservation(null); setRejectionReason('') }} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-100 font-medium">Annuleren</button>
                <button onClick={handleReject} disabled={!rejectionReason.trim()} className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-xl font-medium">✕ Bevestig weigering</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nieuwe reservatie toevoegen */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">+ Nieuwe reservatie</h3>
            <div className="space-y-3">
              <input placeholder="Naam *" value={addForm.customer_name} onChange={e => setAddForm(p => ({...p, customer_name: e.target.value}))} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500" />
              <input placeholder="Telefoon *" value={addForm.customer_phone} onChange={e => setAddForm(p => ({...p, customer_phone: e.target.value}))} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500" />
              <input placeholder="Email" type="email" value={addForm.customer_email} onChange={e => setAddForm(p => ({...p, customer_email: e.target.value}))} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500" />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={addForm.reservation_date} onChange={e => setAddForm(p => ({...p, reservation_date: e.target.value}))} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500" />
                <input type="time" value={addForm.reservation_time} onChange={e => setAddForm(p => ({...p, reservation_time: e.target.value}))} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setAddForm(p => ({...p, party_size: Math.max(1, p.party_size - 1)}))} className="w-10 h-10 bg-gray-100 rounded-xl font-bold">−</button>
                <span className="text-2xl font-bold w-8 text-center">{addForm.party_size}</span>
                <button onClick={() => setAddForm(p => ({...p, party_size: p.party_size + 1}))} className="w-10 h-10 bg-gray-100 rounded-xl font-bold">+</button>
                <span className="text-gray-500 text-sm">personen</span>
              </div>
              <textarea placeholder="Notities..." value={addForm.notes} onChange={e => setAddForm(p => ({...p, notes: e.target.value}))} rows={2} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 resize-none" />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddForm(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700">Annuleren</button>
                <button onClick={addReservation} disabled={addLoading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-60">{addLoading ? '⏳ Opslaan...' : '✓ Opslaan'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
