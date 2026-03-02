import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { status, customerEmail, customerName, customerPhone, reservationDate, reservationTime, partySize, tenantSlug, rejectionReason } = body

    if (!customerEmail || !customerName || !status) {
      return NextResponse.json({ error: 'Ontbrekende gegevens' }, { status: 400 })
    }

    // Haal restaurantgegevens op
    const { data: tenant } = await supabaseAdmin.from('tenants').select('restaurant_name, address, city, postal_code, phone').eq('slug', tenantSlug).single()
    const businessName = tenant?.restaurant_name || 'Ons restaurant'
    const fullAddress = [tenant?.address, `${tenant?.postal_code || ''} ${tenant?.city || ''}`.trim()].filter(Boolean).join(', ')

    const dateObj = new Date(reservationDate)
    const formattedDate = dateObj.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const formattedTime = reservationTime?.slice(0, 5) || ''

    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.eu', port: 465, secure: true,
      auth: { user: process.env.ZOHO_EMAIL, pass: process.env.ZOHO_PASSWORD },
    })

    let subject = '', headerColor = '', headerIcon = '', mainMessage = '', additionalInfo = ''

    if (status === 'confirmed') {
      subject = `Reservering bevestigd — ${businessName}`
      headerColor = '#22C55E'; headerIcon = '✓'
      mainMessage = `Goed nieuws! Je reservering bij ${businessName} is bevestigd.`
      additionalInfo = `<p style="color:#22C55E;font-weight:bold;font-size:18px;text-align:center;margin:20px 0;">We verwachten je op ${formattedDate} om ${formattedTime}!</p>`
    } else if (status === 'cancelled') {
      subject = `Reservering geannuleerd — ${businessName}`
      headerColor = '#EF4444'; headerIcon = '✕'
      mainMessage = `Helaas moeten we je reservering bij ${businessName} annuleren.`
      additionalInfo = rejectionReason ? `<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:16px;margin:20px 0;"><p style="color:#991B1B;font-weight:600;margin:0 0 8px;">Reden:</p><p style="color:#7F1D1D;margin:0;">${rejectionReason}</p></div>` : ''
    } else {
      subject = `Reservering ontvangen — ${businessName}`
      headerColor = '#F97316'; headerIcon = '📅'
      mainMessage = `Bedankt voor je reservering bij ${businessName}!`
      additionalInfo = `<div style="background:#FFF7ED;border:1px solid #FDBA74;border-radius:12px;padding:16px;margin:20px 0;text-align:center;"><p style="color:#C2410C;font-weight:600;margin:0;">⏳ We bevestigen je reservering zo snel mogelijk.</p></div>`
    }

    await transporter.sendMail({
      from: `"${businessName}" <${process.env.ZOHO_EMAIL}>`,
      to: customerEmail,
      subject,
      html: `<!DOCTYPE html><html><body style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
        <div style="max-width:500px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
          <div style="background:${headerColor};padding:30px;text-align:center;">
            <div style="font-size:40px;margin-bottom:12px;">${headerIcon}</div>
            <h1 style="color:white;margin:0;font-size:22px;">${status === 'confirmed' ? 'Reservering Bevestigd!' : status === 'cancelled' ? 'Reservering Geannuleerd' : 'Reservering Ontvangen'}</h1>
          </div>
          <div style="padding:30px;">
            <p style="color:#333;font-size:16px;">Beste ${customerName},</p>
            <p style="color:#555;font-size:16px;">${mainMessage}</p>
            <div style="background:#f8f9fa;border-radius:12px;padding:20px;margin:20px 0;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;color:#888;width:100px;">Datum:</td><td style="padding:8px 0;color:#333;font-weight:600;">${formattedDate}</td></tr>
                <tr><td style="padding:8px 0;color:#888;">Tijd:</td><td style="padding:8px 0;color:#333;font-weight:600;">${formattedTime}</td></tr>
                <tr><td style="padding:8px 0;color:#888;">Personen:</td><td style="padding:8px 0;color:#333;font-weight:600;">${partySize}</td></tr>
                <tr><td style="padding:8px 0;color:#888;">Naam:</td><td style="padding:8px 0;color:#333;font-weight:600;">${customerName}</td></tr>
                <tr><td style="padding:8px 0;color:#888;">Telefoon:</td><td style="padding:8px 0;color:#333;font-weight:600;">${customerPhone}</td></tr>
              </table>
            </div>
            ${additionalInfo}
            ${fullAddress || tenant?.phone ? `<div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:20px;margin:20px 0;">
              <p style="margin:0 0 8px;color:#333;font-weight:600;font-size:16px;">${businessName}</p>
              ${fullAddress ? `<p style="margin:0 0 8px;color:#555;">${fullAddress}</p>` : ''}
              ${tenant?.phone ? `<p style="margin:0;color:#555;">📞 <a href="tel:${tenant.phone}" style="color:#1E40AF;">${tenant.phone}</a></p>` : ''}
            </div>` : ''}
            <p style="color:#888;font-size:14px;text-align:center;margin-top:30px;">Met vriendelijke groet,<br><strong>${businessName}</strong></p>
          </div>
          <div style="background:#f8f9fa;padding:20px;text-align:center;border-top:1px solid #eee;">
            <p style="color:#aaa;font-size:12px;margin:0;">Automatisch verzonden via ResVysion</p>
          </div>
        </div></body></html>`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json({ error: 'Kon email niet verzenden' }, { status: 500 })
  }
}
