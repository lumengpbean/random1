import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { verifyTurnstile } from '@/lib/turnstile'

// Rate limiting: track submissions by IP
const recentSubmissions = new Map<string, number[]>()
const MAX_SUBMISSIONS_PER_HOUR = 5

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const hourAgo = now - 60 * 60 * 1000
  const times = (recentSubmissions.get(ip) || []).filter(t => t > hourAgo)
  recentSubmissions.set(ip, times)
  return times.length >= MAX_SUBMISSIONS_PER_HOUR
}

function recordSubmission(ip: string) {
  const times = recentSubmissions.get(ip) || []
  times.push(Date.now())
  recentSubmissions.set(ip, times)
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

  // Rate limit check
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: '提交过于频繁，请稍后再试。' }, { status: 429 })
  }

  const body = await req.json()
  const { title, author, excerpt, tags, file_url, type, honeypot, timestamp, turnstileToken } = body

  // Turnstile CAPTCHA verification
  if (turnstileToken) {
    const valid = await verifyTurnstile(turnstileToken)
    if (!valid) {
      return NextResponse.json({ error: '人机验证失败，请刷新页面重试。' }, { status: 400 })
    }
  } else if (process.env.TURNSTILE_SECRET_KEY) {
    // If Turnstile is configured but no token provided, reject
    return NextResponse.json({ error: '请完成人机验证。' }, { status: 400 })
  }

  // Honeypot check — bots fill hidden fields
  if (honeypot) {
    return NextResponse.json({ error: '提交失败' }, { status: 400 })
  }

  // Time check — form submitted too fast (< 3 seconds)
  if (timestamp && Date.now() - timestamp < 3000) {
    return NextResponse.json({ error: '提交过快，请重试。' }, { status: 400 })
  }

  // Validate required fields
  if (!title || !author) {
    return NextResponse.json({ error: '标题和作者为必填项。' }, { status: 400 })
  }

  // Sanitize: limit field lengths
  if (title.length > 500 || author.length > 200) {
    return NextResponse.json({ error: '输入内容过长。' }, { status: 400 })
  }

  // Validate file URL — only allow doc/pdf links or trusted cloud storage
  if (file_url) {
    const url = file_url.trim().split(/\s/)[0] // extract URL before passcode
    const allowed = /\.(pdf|doc|docx)(\?|$)/i.test(url) ||
      /drive\.google\.com/i.test(url) ||
      /pan\.baidu\.com/i.test(url) ||
      /docs\.google\.com/i.test(url) ||
      /dropbox\.com/i.test(url) ||
      /onedrive\.live\.com/i.test(url) ||
      /supabase\.co\/storage/i.test(url) // our own storage
    if (!allowed) {
      return NextResponse.json({ error: '仅支持 PDF/DOC/DOCX 文件链接或云存储分享链接。' }, { status: 400 })
    }
  }

  // Duplicate check
  const admin = createAdminClient()
  const { count } = await admin
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('title', title.trim())

  if (count !== null && count >= 3) {
    return NextResponse.json({ error: '该标题已重复投稿超过 3 次。' }, { status: 400 })
  }

  // Insert article
  const { error } = await admin.from('articles').insert({
    title: title.trim(),
    author: author.trim(),
    excerpt: excerpt?.trim() || null,
    tags: tags?.trim() || null,
    file_url: file_url?.trim() || null,
    type: type || 'essay',
    status: 'pending',
  })

  if (error) {
    return NextResponse.json({ error: '提交失败: ' + error.message }, { status: 500 })
  }

  recordSubmission(ip)
  return NextResponse.json({ success: true })
}
