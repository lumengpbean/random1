import { NextResponse } from 'next/server'
import { createAdminClient, canReview } from '@/lib/supabase-admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getAuthUser() {
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
  return user
}

// GET /api/review/articles — fetch pending/reviewed articles for reviewers
export async function GET() {
  const user = await getAuthUser()
  if (!user || !canReview(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: articles, error } = await admin
    .from('articles')
    .select('*')
    .in('status', ['pending', 'reviewed'])
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = (articles || []).map(a => a.id)
  let reviews: unknown[] = []
  if (ids.length > 0) {
    const { data: revData } = await admin.from('reviews').select('*').in('article_id', ids)
    reviews = revData || []
  }

  return NextResponse.json({ articles: articles || [], reviews, userId: user.id })
}
