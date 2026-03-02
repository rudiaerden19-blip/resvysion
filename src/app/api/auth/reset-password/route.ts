import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'E-mailadres is verplicht' }, { status: 400 })
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/nieuw-wachtwoord`,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Altijd succes teruggeven — ook als email niet bestaat (security)
  return NextResponse.json({ success: true })
}
