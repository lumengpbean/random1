import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
const REVIEWER_EMAILS = (process.env.REVIEWER_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

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
  const path = request.nextUrl.pathname
  const email = user?.email?.toLowerCase() || ''

  // Not logged in -> redirect to login
  if (path.startsWith('/admin') || path.startsWith('/review') || path.startsWith('/api/admin') || path.startsWith('/api/review')) {
    if (!user) {
      if (path.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(loginUrl)
    }
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

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/review/:path*', '/api/admin/:path*', '/api/review/:path*'],
}
