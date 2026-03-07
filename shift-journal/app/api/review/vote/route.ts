import { NextRequest, NextResponse } from 'next/server'
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

const REQUIRED_APPROVALS = 4

// POST /api/review/vote — cast a vote
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user || !canReview(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { articleId, vote, comment } = await req.json()
  if (!articleId || !vote) {
    return NextResponse.json({ error: 'Missing articleId or vote' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Insert vote
  const { error } = await admin.from('reviews').insert({
    article_id: articleId,
    reviewer_id: user.id,
    vote,
    comment: comment || null,
  })

  if (error) {
    if (error.message.includes('unique') || error.message.includes('duplicate')) {
      return NextResponse.json({ error: 'already_voted' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Check if threshold reached
  if (vote === 'approve') {
    const { data: reviews } = await admin
      .from('reviews')
      .select('*')
      .eq('article_id', articleId)
      .eq('vote', 'approve')

    if (reviews && reviews.length >= REQUIRED_APPROVALS) {
      await admin.from('articles').update({ status: 'reviewed' }).eq('id', articleId)
      return NextResponse.json({ success: true, threshold_reached: true, count: reviews.length })
    }
    return NextResponse.json({ success: true, threshold_reached: false, count: reviews?.length || 0 })
  }

  return NextResponse.json({ success: true })
}
