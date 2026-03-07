import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { canAdmin, canReview } from '@/lib/supabase-admin'

// Rate limiting: track failed attempts by IP
const failedAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil: number }>()

const MAX_ATTEMPTS = 5          // max failures before lockout
const LOCKOUT_MINUTES = 15      // lockout duration
const WINDOW_MINUTES = 10       // reset counter after this many minutes of no attempts

function checkRateLimit(ip: string): { blocked: boolean; remainingMinutes?: number } {
  const now = Date.now()
  const record = failedAttempts.get(ip)

  if (!record) return { blocked: false }

  // Currently locked out
  if (record.lockedUntil > now) {
    const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000)
    return { blocked: true, remainingMinutes }
  }

  // Reset if window has passed since last attempt
  if (now - record.lastAttempt > WINDOW_MINUTES * 60 * 1000) {
    failedAttempts.delete(ip)
    return { blocked: false }
  }

  return { blocked: false }
}

function recordFailure(ip: string) {
  const now = Date.now()
  const record = failedAttempts.get(ip) || { count: 0, lastAttempt: 0, lockedUntil: 0 }

  // Reset if window passed
  if (now - record.lastAttempt > WINDOW_MINUTES * 60 * 1000) {
    record.count = 0
  }

  record.count++
  record.lastAttempt = now

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MINUTES * 60 * 1000
  }

  failedAttempts.set(ip, record)
}

function clearFailures(ip: string) {
  failedAttempts.delete(ip)
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

  // Check if IP is locked out
  const rateCheck = checkRateLimit(ip)
  if (rateCheck.blocked) {
    return NextResponse.json(
      { error: `登录失败次数过多，请 ${rateCheck.remainingMinutes} 分钟后再试。` },
      { status: 429 }
    )
  }

  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: '请输入邮箱和密码。' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as never)
          })
        },
      },
    }
  )

  const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

  if (authError) {
    recordFailure(ip)
    const record = failedAttempts.get(ip)
    const remaining = MAX_ATTEMPTS - (record?.count || 0)

    if (remaining <= 0) {
      return NextResponse.json(
        { error: `登录失败次数过多，账号已锁定 ${LOCKOUT_MINUTES} 分钟。` },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: `登录失败: ${authError.message}（还可尝试 ${remaining} 次）` },
      { status: 401 }
    )
  }

  // Login succeeded — clear failures
  clearFailures(ip)

  // Determine role
  const { data: { user } } = await supabase.auth.getUser()
  const userEmail = user?.email

  let role: string | null = null
  if (canAdmin(userEmail)) {
    role = 'admin'
  } else if (canReview(userEmail)) {
    role = 'reviewer'
  }

  return NextResponse.json({ success: true, role })
}
