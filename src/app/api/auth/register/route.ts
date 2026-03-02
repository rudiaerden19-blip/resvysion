import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { email, password, restaurantName, slug, phone } = await req.json()

  if (!email || !password || !restaurantName || !slug) {
    return NextResponse.json({ error: 'Alle velden zijn verplicht' }, { status: 400 })
  }

  // Check slug uniek
  const { data: existingSlug } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existingSlug) {
    return NextResponse.json({ error: 'Deze restaurantnaam is al in gebruik, kies een andere URL' }, { status: 400 })
  }

  // Check email uniek
  const { data: existingEmail } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('email', email.toLowerCase())
    .single()

  if (existingEmail) {
    return NextResponse.json({ error: 'Dit e-mailadres is al geregistreerd' }, { status: 400 })
  }

  // Maak Supabase auth user aan — direct bevestigd, geen email-verificatie nodig
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { slug, restaurant_name: restaurantName },
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || 'Kon account niet aanmaken' }, { status: 500 })
  }

  // Maak tenant record aan
  const { error: tenantError } = await supabaseAdmin.from('tenants').insert({
    id: authData.user.id,
    email: email.toLowerCase(),
    restaurant_name: restaurantName,
    slug,
    phone: phone || null,
    plan: 'trial',
    subscription_status: 'trial',
  })

  if (tenantError) {
    // Verwijder de auth user als tenant aanmaken mislukt
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: 'Kon restaurant niet aanmaken: ' + tenantError.message }, { status: 500 })
  }

  // Maak standaard booking settings aan
  await supabaseAdmin.from('booking_settings').insert({
    tenant_id: authData.user.id,
    is_online: false,
    available_days: [1, 2, 3, 4, 5, 6],
    time_slots: ['12:00', '12:30', '13:00', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'],
    max_party_size: 12,
    min_advance_hours: 2,
    max_advance_days: 60,
  })

  // Log in om de sessie te krijgen
  const { data: loginData, error: loginError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: email.toLowerCase(),
  })

  // Geef user data terug — client logt direct in via /api/auth/login
  return NextResponse.json({
    success: true,
    slug,
    userId: authData.user.id,
  })
}
