import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { canAdmin, canReview } from '@/lib/supabase-admin'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ role: null })
  }

  const email = user.email
  if (canAdmin(email)) {
    return NextResponse.json({ role: 'admin' })
  }
  if (canReview(email)) {
    return NextResponse.json({ role: 'reviewer' })
  }
  return NextResponse.json({ role: null })
}
