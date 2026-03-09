'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Turnstile from '@/components/Turnstile'
import a from '@/styles/Article.module.css'
import s from '@/styles/Submit.module.css'

export default function SubmitClient() {
  const [formType, setFormType] = useState<'paper' | 'essay' | 'practical'>('paper')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [essayFile, setEssayFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [honeypot, setHoneypot] = useState('')
  const [pageLoadTime] = useState(Date.now())
  const [turnstileToken, setTurnstileToken] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const essayFileRef = useRef<HTMLInputElement>(null)
  const handleTurnstileToken = useCallback((token: string) => setTurnstileToken(token), [])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      alert('请上传 PDF 格式文件')
      e.target.value = ''
      return
    }
    if (file.size > 4.5 * 1024 * 1024) {
      alert('文件大小不能超过 4.5MB')
      e.target.value = ''
      return
    }
    setSelectedFile(file)
  }

  const ALLOWED_ESSAY_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]

  function handleEssayFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_ESSAY_TYPES.includes(file.type)) {
      alert('仅支持 PDF、DOC、DOCX 格式文件')
      e.target.value = ''
      return
    }
    if (file.size > 4.5 * 1024 * 1024) {
      alert('文件大小不能超过 4.5MB')
      e.target.value = ''
      return
    }
    setEssayFile(file)
  }

  async function handlePaperSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)

    if (!selectedFile) {
      alert('请上传论文 PDF 文件')
      return
    }

    const form = e.currentTarget
    const title = (form.elements.namedItem('paper-title') as HTMLInputElement).value
    const author = (form.elements.namedItem('paper-author') as HTMLInputElement).value
    const abstract = (form.elements.namedItem('paper-abstract') as HTMLTextAreaElement).value
    const keywords = (form.elements.namedItem('paper-keywords') as HTMLInputElement).value

    setProgress(30)

    const formData = new FormData()
    formData.append('title', title)
    formData.append('author', author)
    formData.append('abstract', abstract)
    if (keywords) formData.append('keywords', keywords)
    formData.append('file', selectedFile)
    formData.append('type', 'paper')
    formData.append('honeypot', honeypot)
    formData.append('timestamp', pageLoadTime.toString())
    formData.append('turnstileToken', turnstileToken)

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        body: formData,
      })

      setProgress(null)
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || '提交失败' })
      } else {
        setMessage({ type: 'success', text: '投稿成功！我们会尽快审核。' })
        form.reset()
        setSelectedFile(null)
      }
    } catch (err: any) {
      setProgress(null)
      setMessage({ type: 'error', text: '上传失败: ' + err.message })
    }
  }

  async function handleEssaySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)

    if (!essayFile) {
      alert('请上传稿件文件PDF/DOC/DOCX）')
      return
    }

    const form = e.currentTarget
    const title = (form.elements.namedItem('essay-title') as HTMLInputElement).value
    const author = (form.elements.namedItem('essay-author') as HTMLInputElement).value
    const abstract = (form.elements.namedItem('essay-abstract') as HTMLTextAreaElement).value

    setProgress(30)

    const formData = new FormData()
    formData.append('title', title)
    formData.append('author', author)
    if (abstract) formData.append('abstract', abstract)
    formData.append('file', essayFile)
    formData.append('type', formType)
    formData.append('honeypot', honeypot)
    formData.append('timestamp', pageLoadTime.toString())
    formData.append('turnstileToken', turnstileToken)

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        body: formData,
      })

      setProgress(null)
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || '提交失败' })
      } else {
        setMessage({ type: 'success', text: '投稿成功！我们会尽快审核。' })
        form.reset()
        setEssayFile(null)
      }
    } catch (err: any) {
      setProgress(null)
      setMessage({ type: 'error', text: '上传失败: ' + err.message })
    }
  }
  return (
    <>
      <Header compact />
      <article className={a.page}>
        <h1 className={a.title}>SHIFT开放征稿啦！</h1>
        <h2>SHIFT刊见投稿须知（欢迎来稿）</h2>

        <section className={a.body}>
          <p><strong>论文推荐结构：</strong>引言 - 文献综述 - 研究方法 - 研究结果 - 讨论 - 总结</p>

          <hr className={s.divider} />

          {/* Honeypot - invisible to humans */}
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
            <label>Leave this empty</label>
            <input
              type="text"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className={s.tabs}>
            <button
              className={`${s.tab} ${formType === 'paper' ? s.tabActive : ''}`}
              onClick={() => { setFormType('paper'); setMessage(null) }}
            >
              论文投稿（PDF）
            </button>
            <button
              className={`${s.tab} ${formType === 'essay' ? s.tabActive : ''}`}
              onClick={() => { setFormType('essay'); setMessage(null) }}
            >
              随笔/散文投稿
            </button>
            <button
              className={`${s.tab} ${formType === 'practical' ? s.tabActive : ''}`}
              onClick={() => { setFormType('practical'); setMessage(null) }}
            >
              实用文体投稿
            </button>
          </div>

          {formType === 'paper' && (
            <form onSubmit={handlePaperSubmit}>
              <h4>（一）作者信息</h4>
              <div className={s.formGroup}>
                <label className={s.formLabel}>作者署名 *</label>
                <input name="paper-author" className={s.input} required />
              </div>
              <h4>（二）论文信息</h4>
              <div className={s.formGroup}>
                <label className={s.formLabel}>论文标题 *</label>
                <input name="paper-title" className={s.input} required />
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>摘要（100-200字）*</label>
                <textarea name="paper-abstract" className={s.textarea} rows={4} required />
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>关键词（3-8个，用逗号分隔）</label>
                <input name="paper-keywords" className={s.input} placeholder="女性主义, 知识生产, 学术写作" />
              </div>
              <h4>（三）上传论文 PDF *</h4>
              <div
                className={`${s.uploadArea} ${selectedFile ? s.uploadAreaHasFile : ''}`}
                onClick={() => fileRef.current?.click()}
              >
                <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>&#128196;</p>
                <p>点击上传 PDF 文件</p>
                <p className={s.uploadHint}>仅支持 PDF 格式，最大 4.5MB</p>
                {selectedFile && (
                  <p className={s.fileName}>
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
                  </p>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleFileSelect} />
              {progress !== null && (
                <div>
                  <div className={s.progressBar}>
                    <div className={s.progressFill} style={{ width: `${progress}%` }} />
                  </div>
                  <p className={s.progressText}>{progress < 50 ? '正在上传 PDF...' : '正在保存信息...'}</p>
                </div>
              )}
              <Turnstile onToken={handleTurnstileToken} />
              <button type="submit" className={s.btnSubmit}>提交论文</button>
            </form>
          )}

          {(formType === 'essay' || formType === 'practical') && (
            <form onSubmit={handleEssaySubmit}>
              <h4>（一）作者信息</h4>
              <div className={s.formGroup}>
                <label className={s.formLabel}>作者署名 *</label>
                <input name="essay-author" className={s.input} required />
              </div>
              <h4>（二）稿件信息</h4>
              <div className={s.formGroup}>
                <label className={s.formLabel}>标题 *</label>
                <input name="essay-title" className={s.input} required />
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>摘要（简短描述）</label>
                <textarea name="essay-abstract" className={s.textarea} rows={3} />
              </div>
              <h4>（三）上传稿件文件 *</h4>
              <div
                className={`${s.uploadArea} ${essayFile ? s.uploadAreaHasFile : ''}`}
                onClick={() => essayFileRef.current?.click()}
              >
                <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>&#128196;</p>
                <p>点击上传文件</p>
                <p className={s.uploadHint}>支持 PDF、DOC、DOCX 格式，最大 4.5MB</p>
                {essayFile && (
                  <p className={s.fileName}>
                    {essayFile.name} ({(essayFile.size / 1024 / 1024).toFixed(1)}MB)
                  </p>
                )}
              </div>
              <input ref={essayFileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleEssayFileSelect} />
              <Turnstile onToken={handleTurnstileToken} />
              <button type="submit" className={s.btnSubmit}>提交稿件</button>
            </form>
          )}

          {message && (
            <p className={message.type === 'success' ? s.msgSuccess : s.msgError}>
              {message.text}
            </p>
          )}
        </section>
      </article>
      <Footer />
    </>
  )
}
