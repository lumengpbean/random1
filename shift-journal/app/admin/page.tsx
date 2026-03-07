'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { textToHtml, extractUrl } from '@/lib/format'
import type { Article, Review } from '@/lib/types'
import s from '@/styles/Admin.module.css'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [articles, setArticles] = useState<Article[]>([])
  const [reviewMap, setReviewMap] = useState<Record<string, Review[]>>({})
  const [showAll, setShowAll] = useState(false)
  const [editing, setEditing] = useState<Article | null>(null)
  const [editFields, setEditFields] = useState({
    title: '', author: '', tags: '', tag_color: 'brown', excerpt: '', content: '',
  })
  const [previewMode, setPreviewMode] = useState(false)

  const supabase = createClient()

  const fetchArticles = useCallback(async () => {
    let query = supabase.from('articles').select('*')
    if (!showAll) query = query.neq('status', 'approved')
    const { data } = await query.order('created_at', { ascending: false })
    const arts = (data as Article[]) || []
    setArticles(arts)

    if (arts.length > 0) {
      const ids = arts.map((a) => a.id)
      const { data: reviews } = await supabase.from('reviews').select('*').in('article_id', ids)
      const map: Record<string, Review[]> = {}
      ;(reviews as Review[] || []).forEach((r) => {
        if (!map[r.article_id]) map[r.article_id] = []
        map[r.article_id].push(r)
      })
      setReviewMap(map)
    }
  }, [showAll, supabase])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setAuthed(true)
        fetchArticles()
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (authed) fetchArticles()
  }, [showAll]) // eslint-disable-line react-hooks/exhaustive-deps

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { alert('权限验证失败: ' + error.message); return }
    setAuthed(true)
    fetchArticles()
  }

  async function signOut() {
    await supabase.auth.signOut()
    setAuthed(false)
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
    const { error } = await supabase.from('articles').update({
      ...editFields,
      content: textToHtml(editFields.content),
      status: 'approved',
    }).eq('id', editing.id)
    if (error) { alert('发布失败: ' + error.message); return }
    alert('发布成功！文章已上线。')
    setEditing(null)
    fetchArticles()
  }

  async function saveAsDraft() {
    if (!editing) return
    const { error } = await supabase.from('articles').update({
      ...editFields,
      content: textToHtml(editFields.content),
      status: 'pending',
    }).eq('id', editing.id)
    if (error) { alert('保存失败: ' + error.message); return }
    alert('已保存为草稿。')
  }

  async function rejectArticle(id?: string) {
    const targetId = id || editing?.id
    if (!targetId) return
    const { error } = await supabase.from('articles').update({ status: 'rejected' }).eq('id', targetId)
    if (error) { alert('操作失败: ' + error.message); return }
    if (id) { fetchArticles() }
    else { alert('已驳回。'); setEditing(null); fetchArticles() }
  }

  async function deleteArticle(id: string) {
    if (!confirm('确定要永久删除这篇稿件吗？此操作不可撤销。')) return
    const { error } = await supabase.from('articles').delete().eq('id', id)
    if (error) { alert('删除失败: ' + error.message); return }
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

  if (!authed) {
    return (
      <div className={s.page}>
        <div className={s.container}>
          <div className={s.loginBox}>
            <h2>审核员登录</h2>
            <input className={s.input} type="email" placeholder="审核员邮箱" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className={s.input} type="password" placeholder="密码" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className={`${s.btn} ${s.btnPrimary}`} style={{ width: '100%' }} onClick={signIn}>进入系统</button>
          </div>
        </div>
      </div>
    )
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
              <label className={s.label}>标签（如：散文、论文、随笔）</label>
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

          <label className={s.label}>摘要（显示在文库卡片上）</label>
          <textarea className={s.input} rows={2} value={editFields.excerpt} onChange={(e) => setEditFields({ ...editFields, excerpt: e.target.value })} style={{ fontFamily: "'Segoe UI',sans-serif" }} />

          <label className={s.label}>原稿文件</label>
          <div style={{ margin: '6px 0' }}>
            {fileUrl ? (
              <a className={s.fileLink} href={fileUrl} target="_blank" rel="noopener noreferrer">&#128194; 查看原稿文件</a>
            ) : (
              <span style={{ color: '#999' }}>无文件链接</span>
            )}
          </div>

          <label className={s.label}>正文内容</label>
          <div className={s.tabBar}>
            <div className={`${s.tab} ${!previewMode ? s.tabActive : ''}`} onClick={() => setPreviewMode(false)}>编辑</div>
            <div className={`${s.tab} ${previewMode ? s.tabActive : ''}`} onClick={() => setPreviewMode(true)}>预览</div>
          </div>

          {!previewMode ? (
            <textarea className={s.textarea} rows={20} value={editFields.content} onChange={(e) => setEditFields({ ...editFields, content: e.target.value })} />
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
        <div className={s.topBar}>
          <h2>{showAll ? '全部稿件' : '待审核稿件池'}</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className={`${s.btn} ${s.btnEdit}`} style={{ fontSize: '0.8rem', padding: '6px 14px' }} onClick={() => setShowAll(!showAll)}>
              {showAll ? '仅待审核' : '显示全部'}
            </button>
            <button className={s.signOutBtn} onClick={signOut}>退出登录</button>
          </div>
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
                      作者: {item.author} | {item.type === 'paper' ? '📄 论文' : '📝 非论文'} | 时间: {new Date(item.created_at).toLocaleString()}
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
      </div>
    </div>
  )
}
