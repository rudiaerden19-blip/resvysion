import { supabase, supabaseAdmin } from './supabase'

export interface AuthUser {
  id: string
  email: string
  slug: string
  restaurantName: string
  plan: string
  role: 'owner' | 'superadmin'
}

// Sla session op in localStorage
export function saveSession(user: AuthUser) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('rv_session', JSON.stringify(user))
  }
}

export function getSession(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const s = localStorage.getItem('rv_session')
    return s ? JSON.parse(s) : null
  } catch {
    return null
  }
}

export function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('rv_session')
  }
}

// Wachtwoord hashen (simpel via Supabase auth)
export async function registerOwner(params: {
  email: string
  password: string
  restaurantName: string
  slug: string
  phone?: string
}) {
  // 1. Check of slug al bestaat
  const { data: existing } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', params.slug)
    .single()

  if (existing) return { error: 'Deze restaurantnaam is al in gebruik' }

  // 2. Check of email al bestaat
  const { data: existingEmail } = await supabase
    .from('tenants')
    .select('id')
    .eq('email', params.email.toLowerCase())
    .single()

  if (existingEmail) return { error: 'Dit email adres is al geregistreerd' }

  // 3. Maak tenant aan (wachtwoord wordt opgeslagen via Supabase Auth)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: params.email.toLowerCase(),
    password: params.password,
    options: {
      data: { slug: params.slug, restaurant_name: params.restaurantName }
    }
  })

  if (authError) return { error: authError.message }

  // 4. Maak tenant record aan
  const { error: tenantError } = await supabase
    .from('tenants')
    .insert({
      id: authData.user?.id,
      email: params.email.toLowerCase(),
      restaurant_name: params.restaurantName,
      slug: params.slug,
      phone: params.phone || null,
      plan: 'trial',
      subscription_status: 'trial',
    })

  if (tenantError) return { error: 'Kon restaurant niet aanmaken: ' + tenantError.message }

  return { success: true, slug: params.slug }
}

export async function loginOwner(email: string, password: string) {
  // Superadmin check
  if (email === 'rudi@vysionhoreca.be' && password === process.env.NEXT_PUBLIC_SUPERADMIN_PASS) {
    const user: AuthUser = { id: 'superadmin', email, slug: 'superadmin', restaurantName: 'ResVysion Admin', plan: 'pro', role: 'superadmin' }
    saveSession(user)
    return { success: true, user }
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email: email.toLowerCase(), password })
  if (error) return { error: 'Onjuist email of wachtwoord' }

  // Haal tenant op
  const { data: tenant } = await supabase
    .from('tenants')
    .select('slug, restaurant_name, plan, subscription_status')
    .eq('email', email.toLowerCase())
    .single()

  if (!tenant) return { error: 'Geen restaurant gevonden voor dit account' }

  const user: AuthUser = {
    id: data.user.id,
    email,
    slug: tenant.slug,
    restaurantName: tenant.restaurant_name,
    plan: tenant.plan,
    role: 'owner'
  }
  saveSession(user)
  return { success: true, user }
}
