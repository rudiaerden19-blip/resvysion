import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const SUPERADMIN_EMAIL = 'rudi@vysionhoreca.be'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Vul e-mail en wachtwoord in' }, { status: 400 })
  }

  // Superadmin check
  if (email.toLowerCase() === SUPERADMIN_EMAIL && password === process.env.SUPERADMIN_PASS) {
    return NextResponse.json({
      success: true,
      user: {
        id: 'superadmin',
        email,
        slug: 'superadmin',
        restaurantName: 'ResVysion Admin',
        plan: 'pro',
        role: 'superadmin',
      },
    })
  }

  // Normale login via Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase(),
    password,
  })

  if (error) {
    if (error.message.includes('Email not confirmed')) {
      return NextResponse.json({ error: 'E-mail nog niet bevestigd. Controleer je inbox.' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Onjuist e-mailadres of wachtwoord' }, { status: 401 })
  }

  // Haal tenant op
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('slug, restaurant_name, plan, subscription_status')
    .eq('id', data.user.id)
    .single()

  if (tenantError || !tenant) {
    return NextResponse.json({ error: 'Geen restaurant gevonden voor dit account' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email,
      slug: tenant.slug,
      restaurantName: tenant.restaurant_name,
      plan: tenant.plan,
      role: 'owner',
    },
    // Stuur Supabase access token mee voor toekomstige requests
    accessToken: data.session?.access_token,
    refreshToken: data.session?.refresh_token,
  })
}
