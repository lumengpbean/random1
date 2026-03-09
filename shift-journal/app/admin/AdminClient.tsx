'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { textToHtml, extractUrl } from '@/lib/format'
import type { Article, Review } from '@/lib/types'
import s from '@/styles/Admin.module.css'

type Notice = {
  id: string
  label: string
  content: string
  created_at: string
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'articles' | 'notices'>('articles')

  // --- 稿件管理 state ---
  const [articles, setArticles] = useState<Article[]>([])
  const [reviewMap, setReviewMap] = useState<Record<string, Review[]>>({})
  const [showAll, setShowAll] = useState(false)
  const [editing, setEditing] = useState<Article | null>(null)
  const [editFields, setEditFields] = useState({
    title: '', author: '', tags: '', tag_color: 'brown', excerpt: '', content: '',
  })
  const [previewMode, setPreviewMode] = useState(false)

  // --- 公告管理 state ---
  const [notices, setNotices] = useState<Notice[]>([])
  const [noticeLabel, setNoticeLabel] = useState('NOTICE')
  const [noticeContent, setNoticeContent] = useState('')
  const [noticeSubmitting, setNoticeSubmitting] = useState(false)

  const fetchNotices = useCallback(async () => {
    const res = await fetch('/api/admin/notices')
    if (!res.ok) return
    const data = await res.json()
    setNotices(data.notices || [])
  }, [])

  useEffect(() => {
    if (activeTab === 'notices') fetchNotices()
  }, [activeTab, fetchNotices])

  async function submitNotice() {
    if (!noticeContent.trim()) return
    setNoticeSubmitting(true)
    try {
      const res = await fetch('/api/admin/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: noticeLabel, content: noticeContent }),
      })
      if (!res.ok) { alert('发布失败: ' + (await res.json()).error); return }
      setNoticeContent('')
      fetchNotices()
    } finally {
      setNoticeSubmitting(false)
    }
  }

  async function deleteNotice(id: string) {
    if (!confirm('确定要删除这条公告吗？')) return
    const res = await fetch('/api/admin/notices', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) { alert('删除失败'); return }
    fetchNotices()
  }

  const fetchArticles = useCallback(async () => {
    const res = await fetch(`/api/admin/articles?showAll=${showAll}`)
    if (!res.ok) return
    const data = await res.json()
    setArticles(data.articles || [])
    const map: Record<string, Review[]> = {}
    ;(data.reviews as Review[] || []).forEach((r: Review) => {
      if (!map[r.article_id]) map[r.article_id] = []
      map[r.article_id].push(r)
    })
    setReviewMap(map)
  }, [showAll])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  async function signOut() {
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  function openEditor(art: Article) {
    setEditing(art)
    setEditFields({
      title: art.title || '',
      author: art.author || '',
      tags: art.tags || '',
      tag_color: art.tag_color || 'brown',
      excerpt: art.excerpt || '',
      content: art.content || '',
    })
    setPreviewMode(false)
  }

  async function publishArticle() {
    if (!editing) return
    const res = await fetch('/api/admin/articles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editing.id, action: 'publish', fields: editFields }),
    })
    if (!res.ok) { alert('发布失败: ' + (await res.json()).error); return }
    alert('发布成功！文章已上线。')
    setEditing(null)
    fetchArticles()
  }

  async function saveAsDraft() {
    if (!editing) return
    const keepStatus = editing.status === 'approved' ? 'approved' : 'pending'
    const res = await fetch('/api/admin/articles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editing.id, action: 'save', fields: { ...editFields, status: keepStatus } }),
    })
    if (!res.ok) { alert('保存失败: ' + (await res.json()).error); return }
    alert(keepStatus === 'approved' ? '已保存更新。' : '已保存为草稿。')
    fetchArticles()
  }

  async function rejectArticle(id?: string) {
    const targetId = id || editing?.id
    if (!targetId) return
    const res = await fetch('/api/admin/articles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: targetId, action: 'reject' }),
    })
    if (!res.ok) { alert('操作失败: ' + (await res.json()).error); return }
    if (!id) { alert('已驳回。'); setEditing(null) }
    fetchArticles()
  }

  async function deleteArticle(id: string) {
    if (!confirm('确定要永久删除这篇稿件吗？此操作不可撤销。')) return
    const res = await fetch('/api/admin/articles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) { alert('删除失败: ' + (await res.json()).error); return }
    if (editing?.id === id) setEditing(null)
    fetchArticles()
  }

  function statusBadge(status: string) {
    const cls = status === 'pending' ? s.statusPending
      : status === 'reviewed' ? s.statusReviewed
      : status === 'rejected' ? s.statusRejected
      : s.statusApproved
    return <span className={`${s.statusBadge} ${cls}`}>{status}</span>
  }

  if (editing) {
    const fileUrl = extractUrl(editing.file_url)
    return (
      <div className={s.page}>
        <div className={s.container}>
          <div className={s.topBar} style={{ marginBottom: 16 }}>
            <h2>编辑: {editing.title}</h2>
            <button className={`${s.btn} ${s.btnBack}`} onClick={() => setEditing(null)}>返回列表</button>
          </div>

          <label className={s.label}>标题</label>
          <input className={s.input} value={editFields.title} onChange={(e) => setEditFields({ ...editFields, title: e.target.value })} />

          <label className={s.label}>作者</label>
          <input className={s.input} value={editFields.author} onChange={(e) => setEditFields({ ...editFields, author: e.target.value })} />

          <div className={s.gridRow}>
            <div>
              <label className={s.label}>标签</label>
              <input className={s.input} value={editFields.tags} onChange={(e) => setEditFields({ ...editFields, tags: e.target.value })} placeholder="散文" />
            </div>
            <div>
              <label className={s.label}>标签颜色</label>
              <select className={s.input} value={editFields.tag_color} onChange={(e) => setEditFields({ ...editFields, tag_color: e.target.value })}>
                <option value="brown">棕色 (默认)</option>
                <option value="red">紫红</option>
                <option value="rose">玫瑰</option>
              </select>
            </div>
          </div>

          <label className={s.label}>摘要</label>
          <textarea className={s.input} rows={2} value={editFields.excerpt} onChange={(e) => setEditFields({ ...editFields, excerpt: e.target.value })} style={{ fontFamily: "'Segoe UI',sans-serif" }} />

          <label className={s.label}>原稿文件</label>
          <div style={{ margin: '6px 0' }}>
            {fileUrl ? (
              <>
                <a className={s.fileLink} href={fileUrl} target="_blank" rel="noopener noreferrer">&#128194; 查看原稿文件</a>
                {editing.file_url && editing.file_url.includes('提取码') && (
                  <span style={{ marginLeft: 10, color: '#666', fontSize: '0.9rem' }}>
                    {editing.file_url.match(/（提取码.*?）/)?.[0]}
                  </span>
                )}
              </>
            ) : (
              <span style={{ color: '#999' }}>无文件链接</span>
            )}
          </div>

          <label className={s.label}>正文内容</label>
          <div style={{ background: '#f9f6f1', border: '1px solid var(--color-border)', borderRadius: 6, padding: '10px 14px', marginBottom: 8, fontSize: '0.85rem', color: '#555' }}>
            <strong>排版格式说明：</strong><br />
            <code># 标题</code> → 大标题&nbsp;&nbsp;|&nbsp;&nbsp;
            <code>**粗体**</code> → <strong>粗体</strong>&nbsp;&nbsp;|&nbsp;&nbsp;
            <code>&gt; 引用</code> → 引用块&nbsp;&nbsp;|&nbsp;&nbsp;
            <code>---</code> → 分割线&nbsp;&nbsp;|&nbsp;&nbsp;
            空行分段
          </div>
          <div className={s.tabBar}>
            <div className={`${s.tab} ${!previewMode ? s.tabActive : ''}`} onClick={() => setPreviewMode(false)}>编辑</div>
            <div className={`${s.tab} ${previewMode ? s.tabActive : ''}`} onClick={() => setPreviewMode(true)}>预览</div>
          </div>

          {!previewMode ? (
            <textarea className={s.textarea} rows={20} value={editFields.content} onChange={(e) => setEditFields({ ...editFields, content: e.target.value })} placeholder={"# 第一部分标题\n\n正文内容...\n\n**重点内容**会加粗显示\n\n> 这是一段引用\n\n---\n\n# 第二部分标题\n\n更多正文..."} />
          ) : (
            <div className={s.editorPreview} dangerouslySetInnerHTML={{ __html: textToHtml(editFields.content) }} />
          )}

          <div className={s.editorActions}>
            <button className={`${s.btn} ${s.btnApprove}`} onClick={publishArticle}>保存并发布</button>
            <button className={`${s.btn} ${s.btnSave}`} onClick={saveAsDraft}>仅保存（不发布）</button>
            <button className={`${s.btn} ${s.btnReject}`} onClick={() => rejectArticle()}>驳回</button>
            <button className={`${s.btn} ${s.btnDelete}`} onClick={() => deleteArticle(editing.id)}>永久删除</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <div className={s.container}>
        <div className={s.topBar} style={{ marginBottom: 20 }}>
          <div className={s.tabBar} style={{ margin: 0 }}>
            <div className={`${s.tab} ${activeTab === 'articles' ? s.tabActive : ''}`} onClick={() => setActiveTab('articles')}>稿件管理</div>
            <div className={`${s.tab} ${activeTab === 'notices' ? s.tabActive : ''}`} onClick={() => setActiveTab('notices')}>公告管理</div>
          </div>
          <button className={s.signOutBtn} onClick={signOut}>退出登录</button>
        </div>

        {activeTab === 'articles' && (
          <>
            <div className={s.topBar} style={{ marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>{showAll ? '全部稿件' : '待审核稿件池'}</h2>
              <button className={`${s.btn} ${s.btnEdit}`} style={{ fontSize: '0.8rem', padding: '6px 14px' }} onClick={() => setShowAll(!showAll)}>
                {showAll ? '仅待审核' : '显示全部'}
              </button>
            </div>

            {articles.length === 0 ? (
              <p style={{ color: '#666', padding: '20px 0' }}>当前没有待处理的稿件。</p>
            ) : (
              articles.map((item) => {
                const reviews = reviewMap[item.id] || []
                const approveCount = reviews.filter((r) => r.vote === 'approve').length
                const rejectCount = reviews.filter((r) => r.vote === 'reject').length

                return (
                  <div key={item.id} className={s.articleItem}>
                    <div className={s.articleItemTop}>
                      <div className={s.articleInfo}>
                        <h4>{item.title} {statusBadge(item.status)}</h4>
                        <p>
                          作者: {item.author} | {item.type === 'paper' ? '论文' : '非论文'} | 时间: {new Date(item.created_at).toLocaleString()}
                          {reviews.length > 0 && (
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>
                              {' '}| 投票: <span style={{ color: '#27ae60' }}>{approveCount} 赞成</span> / <span style={{ color: '#e74c3c' }}>{rejectCount} 反对</span>
                            </span>
                          )}
                        </p>
                        {item.file_url && (
                          <a className={s.fileLink} href={extractUrl(item.file_url)} target="_blank" rel="noopener noreferrer">&#128194; 查看原稿文件</a>
                        )}
                      </div>
                      <div className={s.btnGroup}>
                        <button className={`${s.btn} ${s.btnEdit}`} onClick={() => openEditor(item)}>编辑发布</button>
                        <button className={`${s.btn} ${s.btnReject}`} onClick={() => rejectArticle(item.id)}>驳回</button>
                        <button className={`${s.btn} ${s.btnDelete}`} onClick={() => deleteArticle(item.id)}>删除</button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </>
        )}

        {activeTab === 'notices' && (
          <>
            <h2 style={{ margin: '0 0 16px' }}>发布新公告</h2>
            <label className={s.label}>标签类型</label>
            <select className={s.input} value={noticeLabel} onChange={e => setNoticeLabel(e.target.value)}>
              <option value="NOTICE">NOTICE</option>
              <option value="IMPORTANT">IMPORTANT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
            </select>

            <label className={s.label}>公告内容</label>
            <textarea
              className={s.textarea}
              rows={6}
              value={noticeContent}
              onChange={e => setNoticeContent(e.target.value)}
              placeholder="在这里输入公告正文，支持换行..."
            />

            <div className={s.editorActions}>
              <button
                className={`${s.btn} ${s.btnApprove}`}
                onClick={submitNotice}
                disabled={noticeSubmitting || !noticeContent.trim()}
              >
                {noticeSubmitting ? '发布中...' : '发布公告'}
              </button>
            </div>

            <hr style={{ margin: '32px 0', border: 'none', borderTop: '1px solid #eee' }} />
            <h2 style={{ margin: '0 0 16px' }}>已发布公告</h2>

            {notices.length === 0 ? (
              <p style={{ color: '#666' }}>暂无公告。</p>
            ) : (
              notices.map(n => (
                <div key={n.id} className={s.articleItem}>
                  <div className={s.articleItemTop}>
                    <div className={s.articleInfo}>
                      <h4 style={{ margin: '0 0 6px' }}>
                        <span style={{ background: '#f0e6f6', color: '#6d3f79', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700, letterSpacing: 2, marginRight: 8 }}>
                          {n.label}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#999', fontWeight: 400 }}>
                          {new Date(n.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </h4>
                      <p style={{ whiteSpace: 'pre-wrap', color: '#555', lineHeight: 1.7 }}>{n.content}</p>
                    </div>
                    <div className={s.btnGroup}>
                      <button className={`${s.btn} ${s.btnDelete}`} onClick={() => deleteNotice(n.id)}>删除</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}
