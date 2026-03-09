import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
const REVIEWER_EMAILS = (process.env.REVIEWER_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

// --- Global rate limiter (in-memory, per-IP) ---
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 10_000  // 10 seconds
const RATE_LIMIT_MAX = 30         // max 30 requests per 10 seconds per IP

function isGlobalRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return false
  }

  record.count++
  if (record.count > RATE_LIMIT_MAX) return true
  return false
}

// Clean up stale entries every 60 seconds to prevent memory leak
let lastCleanup = Date.now()
function cleanupRateLimit() {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  for (const [ip, record] of rateLimitMap) {
    if (now > record.resetTime) rateLimitMap.delete(ip)
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // --- Rate limit all /api/ routes ---
  if (path.startsWith('/api/')) {
    cleanupRateLimit()
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    if (isGlobalRateLimited(ip)) {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试。' },
        { status: 429 }
      )
    }

    // Block requests with no user agent (likely bots/scripts)
    const ua = request.headers.get('user-agent') || ''
    if (!ua || ua.length < 10) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
  }

  const response = NextResponse.next()

  // --- Tell Cloudflare CDN not to cache dynamic pages ---
  response.headers.set('CDN-Cache-Control', 'no-store')

  // --- Security headers ---
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // --- Auth checks only for protected routes (skip for /api/submit, /api/auth) ---
  const needsAuth = path.startsWith('/admin') || path.startsWith('/review')
    || path.startsWith('/api/admin') || path.startsWith('/api/review')

  if (needsAuth) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const email = user?.email?.toLowerCase() || ''

    // Not logged in -> redirect to login
    if (!user) {
      if (path.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(loginUrl)
    }

    // /admin — only admin emails
    if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
      if (!ADMIN_EMAILS.includes(email)) {
        if (path.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        return NextResponse.json({ error: '无权访问 / Admin access denied' }, { status: 403 })
      }
    }

    // /review — admin emails + reviewer emails
    if (path.startsWith('/review') || path.startsWith('/api/review')) {
      const allReviewers = [...ADMIN_EMAILS, ...REVIEWER_EMAILS]
      if (!allReviewers.includes(email)) {
        if (path.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        return NextResponse.json({ error: '无权访问 / Review access denied' }, { status: 403 })
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
