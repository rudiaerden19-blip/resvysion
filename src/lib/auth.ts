export interface AuthUser {
  id: string
  email: string
  slug: string
  restaurantName: string
  plan: string
  role: 'owner' | 'superadmin'
}

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
    localStorage.removeItem('rv_access_token')
  }
}

export async function registerOwner(params: {
  email: string
  password: string
  restaurantName: string
  slug: string
  phone?: string
}): Promise<{ success?: boolean; slug?: string; error?: string }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await res.json()
  if (!res.ok) return { error: data.error }
  return { success: true, slug: data.slug }
}

export async function loginOwner(
  email: string,
  password: string
): Promise<{ success?: boolean; user?: AuthUser; error?: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) return { error: data.error }

  if (data.accessToken) {
    localStorage.setItem('rv_access_token', data.accessToken)
  }

  saveSession(data.user)
  return { success: true, user: data.user }
}
