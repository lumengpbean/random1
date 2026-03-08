'use client'

import { useState, useEffect } from 'react'
import type { Article } from '@/lib/types'
import { extractUrl } from '@/lib/format'
import s from '@/styles/Article.module.css'
import cs from '@/styles/ArticleCard.module.css'

export default function ArticleContent({ article }: { article: Article }) {
  const isPaper = article.type === 'paper'
  const fileUrl = extractUrl(article.file_url)

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(article.like_count)
  const [likeLoading, setLikeLoading] = useState(false)

  useEffect(() => {
    // Record view
    fetch(`/api/article/${article.id}/view`, { method: 'POST' })

    // Check if already liked
    fetch(`/api/article/${article.id}/like`)
      .then(r => r.json())
      .then(d => setLiked(d.liked))
  }, [article.id])

  async function toggleLike() {
    if (likeLoading) return
    setLikeLoading(true)
    try {
      const res = await fetch(`/api/article/${article.id}/like`, { method: 'POST' })
      const data = await res.json()
      setLiked(data.liked)
      setLikeCount(c => data.liked ? c + 1 : c - 1)
    } finally {
      setLikeLoading(false)
    }
  }

  return (
    <article className={s.page}>
      <div className={s.metaTop}>
        {article.tags && <span className={cs.tag}>{article.tags}</span>}
        {isPaper && <span className={s.typeBadge}>论文</span>}
      </div>

      <h1 className={s.title}>{article.title}</h1>

      <div className={s.info}>
        <p className={s.authors}>&#9998; {article.author}</p>
        <div className={s.stats}>
          <span className={s.statItem}>&#128065; {article.view_count}</span>
          <button
            className={`${s.likeBtn} ${liked ? s.likeBtnActive : ''}`}
            onClick={toggleLike}
            disabled={likeLoading}
            aria-label="点赞"
          >
            &#10084; {likeCount}
          </button>
        </div>
      </div>

      {isPaper && article.excerpt && (
        <div className={s.abstract}>
          <strong>摘要：</strong>{article.excerpt}
        </div>
      )}

      {isPaper && article.tags && (
        <div className={s.keywords}>
          <strong>关键词：</strong>
          {article.tags.split(/[,，]/).map((k, i) => (
            <span key={i} className={s.keyword}>{k.trim()}</span>
          ))}
        </div>
      )}

      {article.content && (
        <div
          className={s.body}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      )}

      {fileUrl && (isPaper || fileUrl.toLowerCase().endsWith('.pdf')) && (
        <div>
          <iframe className={s.pdfViewer} src={fileUrl} />
          <a className={s.pdfDownload} href={fileUrl} target="_blank" rel="noopener noreferrer">
            下载 PDF 原文
          </a>
        </div>
      )}

      {fileUrl && !isPaper && !fileUrl.toLowerCase().endsWith('.pdf') && (
        <p style={{ marginTop: '1.5rem' }}>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
            &#128194; 查看原稿文件
          </a>
        </p>
      )}

      <p className={s.end}>—— 完 ——</p>
    </article>
  )
}
