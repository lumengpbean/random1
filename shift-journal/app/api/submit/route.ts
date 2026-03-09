import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { verifyTurnstile } from '@/lib/turnstile'
import Busboy from 'busboy'
import { PDFDocument } from 'pdf-lib';

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

  const contentType = req.headers.get('content-type') || ''
  if (!contentType.includes('multipart/form-data')) {
    console.error('Bad content-type:', contentType)
    return NextResponse.json({ error: '请求格式错误，请刷新页面后重试。' }, { status: 400 })
  }

  // 解析 multipart/form-data
  const busboy = Busboy({ headers: { 'content-type': contentType } })

  const fields: Record<string, string> = {}
  let fileBuffer: Buffer<ArrayBuffer> | null = null
  let fileName = ''
  let fileMimeType = ''

  await new Promise((resolve, reject) => {
    busboy.on('field', (name, val) => {
      fields[name] = val
    })

    busboy.on('file', (name, file, info) => {
      const { filename, mimeType } = info
      fileName = filename
      fileMimeType = mimeType

      const chunks: Buffer[] = []
      file.on('data', (data) => chunks.push(data))
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks)
      })
    })

    busboy.on('finish', resolve)
    busboy.on('error', reject)

    const reader = req.body?.getReader()
    if (reader) {
      ; (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            busboy.write(value)
          }
          busboy.end()
        } catch (err) {
          reject(err)
        }
      })()
    } else {
      busboy.end(req.body)
    }
  })

  const { title, author, abstract, keywords, type, honeypot, timestamp, turnstileToken } = fields

  // Turnstile CAPTCHA verification
  if (turnstileToken) {
    const valid = await verifyTurnstile(turnstileToken)
    if (!valid) {
      return NextResponse.json({ error: '人机验证失败，请刷新页面重试。' }, { status: 400 })
    }
  } else if (process.env.TURNSTILE_SECRET_KEY) {
    return NextResponse.json({ error: '请完成人机验证。' }, { status: 400 })
  }

  // Honeypot check
  if (honeypot) {
    return NextResponse.json({ error: '提交失败' }, { status: 400 })
  }

  // Time check
  if (timestamp && Date.now() - Number(timestamp) < 3000) {
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

  if (!fileBuffer) {
    return NextResponse.json({ error: '文件不能为空' }, { status: 400 })
  }

  let finalFileBuffer: Buffer = fileBuffer as Buffer
  if (fileMimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
    try {
      const pdfDoc = await PDFDocument.load(finalFileBuffer)
      pdfDoc.setTitle('')
      pdfDoc.setAuthor('')
      pdfDoc.setSubject('')
      pdfDoc.setKeywords([])
      pdfDoc.setProducer('')
      pdfDoc.setCreator('')
      finalFileBuffer = Buffer.from(await pdfDoc.save())
    } catch (err) {
      console.error('PDF 清理失败', err)
    }
  }

  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storageFileName = `${Date.now()}_${safeFileName}`

  const admin = createAdminClient()

  const { error: uploadError } = await admin.storage
    .from('papers')
    .upload(storageFileName, finalFileBuffer, {
      contentType: fileMimeType,
      upsert: false,
    })

  if (uploadError) {
    console.error('Upload error', uploadError)
    return NextResponse.json({ error: '文件上传失败' }, { status: 500 })
  }

  const { data: urlData } = admin.storage.from('papers').getPublicUrl(storageFileName)
  const fileUrl = urlData.publicUrl

  const { count } = await admin
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('title', title.trim())

  if (count !== null && count >= 3) {
    await admin.storage.from('papers').remove([storageFileName])
    return NextResponse.json({ error: '该标题已重复投稿超过 3 次。' }, { status: 400 })
  }

  const { error: dbError } = await admin.from('articles').insert({
    title: title.trim(),
    author: author.trim(),
    excerpt: abstract?.trim() || null,
    keywords: type === 'paper' ? (keywords?.trim() || null) : null,
    file_url: fileUrl,
    type: type || 'essay',
    status: 'pending',
  })

  if (dbError) {
    await admin.storage.from('papers').remove([storageFileName])
    return NextResponse.json({ error: '提交失败: ' + dbError.message }, { status: 500 })
  }

  recordSubmission(ip)
  return NextResponse.json({ success: true })
}