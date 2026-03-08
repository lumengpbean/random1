import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

function getIpHash(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return createHash('sha256').update(ip).digest('hex')
}

// GET: check if current IP has liked
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const ipHash = getIpHash(req)
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('article_likes')
    .select('id')
    .eq('article_id', id)
    .eq('ip_hash', ipHash)
    .single()

  return NextResponse.json({ liked: !!data })
}

// POST: toggle like
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const ipHash = getIpHash(req)
  const supabase = createAdminClient()

  // Check if already liked
  const { data: existing } = await supabase
    .from('article_likes')
    .select('id')
    .eq('article_id', id)
    .eq('ip_hash', ipHash)
    .single()

  if (existing) {
    // Unlike
    await supabase.from('article_likes').delete().eq('id', existing.id)
    await supabase.rpc('decrement_like', { aid: id })
    return NextResponse.json({ liked: false })
  } else {
    // Like
    const { error } = await supabase
      .from('article_likes')
      .insert({ article_id: id, ip_hash: ipHash })

    if (error) {
      // Unique constraint violation — concurrent duplicate
      return NextResponse.json({ liked: true })
    }

    await supabase.rpc('increment_like', { aid: id })
    return NextResponse.json({ liked: true })
  }
}
