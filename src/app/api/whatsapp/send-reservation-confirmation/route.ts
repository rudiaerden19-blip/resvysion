import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getBaseUrl(request: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  const origin = request.headers.get('origin') || request.headers.get('referer')
  if (origin) { try { return new URL(origin).origin } catch {} }
  return 'https://resvysion.vercel.app'
}

export async function POST(request: NextRequest) {
  try {
    const { reservationId, tenantSlug } = await request.json()
    if (!reservationId || !tenantSlug) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { data: res } = await supabaseAdmin.from('reservations').select('*').eq('id', reservationId).eq('tenant_slug', tenantSlug).single()
    if (!res) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })

    if (res.whatsapp_sent) return NextResponse.json({ success: true, skipped: true })

    const { data: tenant } = await supabaseAdmin.from('tenants').select('restaurant_name, phone').eq('slug', tenantSlug).single()
    const businessName = tenant?.restaurant_name || tenantSlug

    const dateObj = new Date(res.reservation_date + 'T12:00')
    const formattedDate = dateObj.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })
    const baseUrl = getBaseUrl(request)

    // Zorg voor confirmation token
    let confirmationToken = res.confirmation_token
    if (!confirmationToken) {
      const { data: updated } = await supabaseAdmin.from('reservations').update({ confirmation_token: crypto.randomUUID() }).eq('id', res.id).select('confirmation_token').single()
      confirmationToken = updated?.confirmation_token
    }

    const confirmUrl = confirmationToken ? `${baseUrl}/bevestig/${confirmationToken}?tenant=${tenantSlug}` : null
    const timeStr = `${res.time_from || res.reservation_time}${res.time_to ? ` - ${res.time_to}` : ''}`

    let emailSent = false

    if (res.customer_email) {
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.zoho.eu', port: 465, secure: true,
          auth: { user: process.env.ZOHO_EMAIL, pass: process.env.ZOHO_PASSWORD },
        })

        await transporter.sendMail({
          from: `"${businessName}" <${process.env.ZOHO_EMAIL}>`,
          to: res.customer_email,
          subject: `Bevestig uw reservatie — ${businessName}`,
          html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
<div style="max-width:480px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
  <div style="background:#3B82F6;padding:30px;text-align:center;">
    <div style="font-size:48px;margin-bottom:10px;">🍽️</div>
    <h1 style="color:white;margin:0;font-size:22px;">Reservatie aangemaakt</h1>
    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">${businessName}</p>
  </div>
  <div style="padding:30px;">
    <p style="color:#333;font-size:16px;">Beste ${res.customer_name},</p>
    <p style="color:#555;">Uw tafel is aangemaakt. Bevestig hieronder:</p>
    <div style="background:#f8f9fa;border-radius:12px;padding:20px;margin:20px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#888;width:110px;">Datum:</td><td style="padding:6px 0;color:#333;font-weight:600;">${formattedDate}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Uur:</td><td style="padding:6px 0;color:#333;font-weight:600;">${timeStr}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Personen:</td><td style="padding:6px 0;color:#333;font-weight:600;">${res.party_size}</td></tr>
        ${res.notes ? `<tr><td style="padding:6px 0;color:#888;">Notitie:</td><td style="padding:6px 0;color:#555;font-style:italic;">${res.notes}</td></tr>` : ''}
      </table>
    </div>
    ${confirmUrl ? `<div style="text-align:center;margin:30px 0;">
      <a href="${confirmUrl}" style="display:inline-block;background:#3B82F6;color:white;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:18px;font-weight:bold;">✅ Bevestig mijn reservatie</a>
    </div>
    <p style="color:#888;font-size:12px;text-align:center;">Of kopieer: ${confirmUrl}</p>` : ''}
    ${tenant?.phone ? `<p style="color:#888;font-size:13px;text-align:center;">Kan u niet komen? Bel ons dan zo snel mogelijk.<br><strong>${tenant.phone}</strong></p>` : ''}
  </div>
  <div style="background:#f8f9fa;padding:16px;text-align:center;border-top:1px solid #eee;">
    <p style="color:#aaa;font-size:12px;margin:0;">Automatisch verzonden via ResVysion</p>
  </div>
</div></body></html>`,
        })
        emailSent = true
      } catch (emailErr) {
        console.warn('Email failed:', emailErr)
      }
    }

    await supabaseAdmin.from('reservations').update({ whatsapp_sent: true, whatsapp_sent_at: new Date().toISOString() }).eq('id', reservationId)

    return NextResponse.json({ success: true, emailSent })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Fout'
    console.error('Error sending confirmation:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
