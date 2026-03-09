import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, canAdmin } from '@/lib/supabase-admin'
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
        setAll() { },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// GET /api/admin/articles — fetch articles for admin
export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user || !canAdmin(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const showAll = req.nextUrl.searchParams.get('showAll') === 'true'

  let query = admin.from('articles').select('*')
  if (!showAll) query = query.neq('status', 'approved')
  const { data, error } = await query.order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Also fetch reviews for these articles
  const ids = (data || []).map(a => a.id)
  let reviews: unknown[] = []
  if (ids.length > 0) {
    const { data: revData } = await admin.from('reviews').select('*').in('article_id', ids)
    reviews = revData || []
  }

  return NextResponse.json({ articles: data || [], reviews })
}

// PUT /api/admin/articles — update an article (publish, save draft, reject)
export async function PUT(req: NextRequest) {
  const user = await getAuthUser()
  if (!user || !canAdmin(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { id, action, fields } = body

  if (!id) return NextResponse.json({ error: 'Missing article id' }, { status: 400 })

  const admin = createAdminClient()

  if (action === 'publish') {
    const { error, data: updated } = await admin.from('articles').update({
      ...fields,
      content: fields.content,
      status: 'approved',
      published_at: new Date().toISOString(),
    }).eq('id', id).select('title, contact_email').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (updated?.contact_email) {
      try {
        const { Resend } = await import('resend')
        await new Resend(process.env.RESEND_API_KEY).emails.send({
          from: 'SHIFT <noreply@shift-journal.org>',
          to: updated.contact_email,
          subject: '您的投稿已通过审核',
          text: `您好，\n\n您投稿的《${updated.title}》已通过审核并发布，感谢您的支持！\n\n— SHIFT 编辑组`,
        })
      } catch (err) {
        console.error('发送审核通过邮件失败', err)
      }
    }
    return NextResponse.json({ success: true })
  }

  if (action === 'save') {
    const { error } = await admin.from('articles').update({
      ...fields,
      content: fields.content,
      status: fields.status || 'pending',
    }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'reject') {
    const { error, data: updated } = await admin.from('articles').update({ status: 'rejected' }).eq('id', id).select('title, contact_email').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (updated?.contact_email) {
      try {
        const { Resend } = await import('resend')
        await new Resend(process.env.RESEND_API_KEY).emails.send({
          from: 'SHIFT <noreply@shift-journal.org>',
          to: updated.contact_email,
          subject: '您的投稿审核结果',
          text: `您好，\n\n感谢您投稿《${updated.title}》。经编辑组审核，本次稿件未能通过。感谢您的来稿！\n\n— SHIFT 编辑组`,
        })
      } catch (err) {
        console.error('发送审核拒绝邮件失败', err)
      }
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

// DELETE /api/admin/articles — delete an article
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser()
  if (!user || !canAdmin(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing article id' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('articles').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// 