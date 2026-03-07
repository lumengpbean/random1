'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { textToHtml, extractUrl } from '@/lib/format'
import type { Article, Review } from '@/lib/types'
import type { User } from '@supabase/supabase-js'
import s from '@/styles/Admin.module.css'

const REQUIRED_APPROVALS = 4

export default function ReviewPage() {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [articles, setArticles] = useState<Article[]>([])
  const [reviewMap, setReviewMap] = useState<Record<string, Review[]>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<Article | null>(null)
  const [editFields, setEditFields] = useState({
    title: '', author: '', tags: '', tag_color: 'brown', excerpt: '', content: '',
  })
  const [previewMode, setPreviewMode] = useState(false)

  const supabase = createClient()

  const loadArticles = useCallback(async () => {
    const { data: arts } = await supabase
      .from('articles')
      .select('*')
      .in('status', ['pending', 'reviewed'])
      .order('created_at', { ascending: false })

    const list = (arts as Article[]) || []
    setArticles(list)

    if (list.length > 0) {
      const ids = list.map((a) => a.id)
      const { data: reviews } = await supabase.from('reviews').select('*').in('article_id', ids)
      const map: Record<string, Review[]> = {}
      ;(reviews as Review[] || []).forEach((r) => {
        if (!map[r.article_id]) map[r.article_id] = []
        map[r.article_id].push(r)
      })
      setReviewMap(map)
    }
  }, [supabase])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) { setUser(u); loadArticles() }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { alert('登录失败: ' + error.message); return }
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    loadArticles()
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  async function castVote(articleId: string, vote: 'approve' | 'reject') {
    if (!user) return
    const comment = comments[articleId] || null

    const { error } = await supabase.from('reviews').insert({
      article_id: articleId,
      reviewer_id: user.id,
      vote,
      comment,
    })

    if (error) {
      if (error.message.includes('unique') || error.message.includes('duplicate')) {
        alert('你已经对这篇稿件投过票了。')
      } else {
        alert('投票失败: ' + error.message)
      }
      return
    }

    if (vote === 'approve') {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('article_id', articleId)
        .eq('vote', 'approve')

      if (reviews && reviews.length >= REQUIRED_APPROVALS) {
        await supabase.from('articles').update({ status: 'reviewed' }).eq('id', articleId)
        alert(`投票成功！该稿件已达到 ${REQUIRED_APPROVALS} 票赞成，现在可以编辑发布了。`)
      } else {
        const remaining = REQUIRED_APPROVALS - (reviews?.length || 0)
        alert(`投票成功！还需 ${remaining} 票赞成。`)
      }
    } else {
      alert('投票成功（反对）。')
    }

    loadArticles()
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
    loadArticles()
  }

  async function saveAsDraft() {
    if (!editing) return
    const { error } = await supabase.from('articles').update({
      ...editFields,
      content: textToHtml(editFields.content),
      status: 'reviewed',
    }).eq('id', editing.id)
    if (error) { alert('保存失败: ' + error.message); return }
    alert('已保存，稿件仍为"已通过"状态，尚未发布。')
  }

  if (!user) {
    return (
      <div className={s.page}>
        <div className={s.container}>
          <div className={s.loginBox}>
            <h2>审稿员登录</h2>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>登录后可对待审稿件进行投票</p>
            <input className={s.input} type="email" placeholder="审稿员邮箱" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className={s.input} type="password" placeholder="密码" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className={`${s.btn} ${s.btnPrimary}`} style={{ width: '100%' }} onClick={signIn}>登录</button>
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
              <label className={s.label}>标签</label>
              <input className={s.input} value={editFields.tags} onChange={(e) => setEditFields({ ...editFields, tags: e.target.value })} />
            </div>
            <div>
              <label className={s.label}>标签颜色</label>
              <select className={s.input} value={editFields.tag_color} onChange={(e) => setEditFields({ ...editFields, tag_color: e.target.value })}>
                <option value="brown">棕色</option>
                <option value="red">紫红</option>
                <option value="rose">玫瑰</option>
              </select>
            </div>
          </div>

          <label className={s.label}>摘要</label>
          <textarea className={s.input} rows={2} value={editFields.excerpt} onChange={(e) => setEditFields({ ...editFields, excerpt: e.target.value })} />

          <label className={s.label}>原稿文件</label>
          <div style={{ margin: '6px 0' }}>
            {fileUrl ? <a className={s.fileLink} href={fileUrl} target="_blank" rel="noopener noreferrer">&#128194; 查看原稿文件</a> : <span style={{ color: '#999' }}>无文件链接</span>}
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
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <div className={s.container}>
        <div className={s.topBar}>
          <h2>待审稿件</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>{user.email}</span>
            <button className={s.signOutBtn} onClick={signOut}>退出登录</button>
          </div>
        </div>

        <div className={s.thresholdInfo}>
          投票规则：需要 <strong>{REQUIRED_APPROVALS}</strong> 票赞成，通过后可进入编辑排版并发布。每人仅可投票一次。
        </div>

        {articles.length === 0 ? (
          <p style={{ color: '#666' }}>当前没有待审稿件。</p>
        ) : (
          articles.map((item) => {
            const reviews = reviewMap[item.id] || []
            const approveCount = reviews.filter((r) => r.vote === 'approve').length
            const rejectCount = reviews.filter((r) => r.vote === 'reject').length
            const myVote = reviews.find((r) => r.reviewer_id === user.id)

            const dots = []
            for (let i = 0; i < approveCount; i++) dots.push(<span key={`a${i}`} className={`${s.voteDot} ${s.voteDotApprove}`} title="赞成" />)
            for (let i = 0; i < rejectCount; i++) dots.push(<span key={`r${i}`} className={`${s.voteDot} ${s.voteDotReject}`} title="反对" />)
            const remaining = REQUIRED_APPROVALS - approveCount
            for (let i = 0; i < Math.max(0, remaining); i++) dots.push(<span key={`e${i}`} className={`${s.voteDot} ${s.voteDotEmpty}`} title="待投票" />)

            let actionHtml
            if (item.status === 'reviewed') {
              actionHtml = (
                <div style={{ textAlign: 'center' }}>
                  <span className={s.votedBadge} style={{ display: 'block', marginBottom: 8 }}>已通过审核</span>
                  <button className={`${s.btn} ${s.btnEdit}`} onClick={() => openEditor(item)}>编辑发布</button>
                </div>
              )
            } else if (myVote) {
              actionHtml = <span className={s.votedBadge}>{myVote.vote === 'approve' ? '已投：赞成' : '已投：反对'}</span>
            } else {
              actionHtml = (
                <div>
                  <textarea
                    className={s.input}
                    rows={2}
                    placeholder="审稿意见（选填）"
                    value={comments[item.id] || ''}
                    onChange={(e) => setComments({ ...comments, [item.id]: e.target.value })}
                    style={{ fontSize: '0.85rem', padding: 8 }}
                  />
                  <div className={s.btnGroup} style={{ marginTop: 6 }}>
                    <button className={`${s.btn} ${s.btnApprove}`} onClick={() => castVote(item.id, 'approve')}>赞成发布</button>
                    <button className={`${s.btn} ${s.btnReject}`} onClick={() => castVote(item.id, 'reject')}>反对发布</button>
                  </div>
                </div>
              )
            }

            return (
              <div key={item.id} className={s.articleItem}>
                <div className={s.articleItemTop}>
                  <div className={s.articleInfo}>
                    <h4>
                      {item.title}
                      {' '}<span className={`${s.statusBadge} ${item.status === 'reviewed' ? s.statusReviewed : s.statusPending}`}>
                        {item.status === 'reviewed' ? '已通过' : '待审核'}
                      </span>
                    </h4>
                    <p>
                      作者: {item.author} | {item.type === 'paper' ? '论文' : '非论文'} | {new Date(item.created_at).toLocaleDateString()}
                    </p>
                    {item.excerpt && <p style={{ marginTop: 6, color: '#444' }}>{item.excerpt}</p>}
                    {item.file_url && (
                      <a className={s.fileLink} href={extractUrl(item.file_url)} target="_blank" rel="noopener noreferrer">查看原稿文件</a>
                    )}
                    <div className={s.voteInfo}>
                      <div className={s.voteBar}>{dots}</div>
                      <span style={{ color: 'var(--color-success)' }}>赞成 {approveCount}</span> / <span style={{ color: 'var(--color-danger)' }}>反对 {rejectCount}</span> (需 {REQUIRED_APPROVALS} 票赞成)
                    </div>
                    {reviews.length > 0 && (
                      <div className={s.reviewDetail}>
                        <strong>审稿意见：</strong>
                        {reviews.map((r) => (
                          <p key={r.id}>
                            <span style={{ color: r.vote === 'approve' ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                              [{r.vote === 'approve' ? '赞成' : '反对'}]
                            </span>{' '}
                            {r.comment || <em style={{ color: '#aaa' }}>无评语</em>}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ flexShrink: 0 }}>{actionHtml}</div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
