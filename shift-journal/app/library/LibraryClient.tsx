'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { Article } from '@/lib/types'
import Header from '@/components/Header'
import ArticleCard from '@/components/ArticleCard'
import Footer from '@/components/Footer'
import s from '@/styles/ArticleCard.module.css'

type SortKey = 'newest' | 'oldest' | 'popular'

const SORT_LABELS: Record<SortKey, string> = {
  newest: '最新',
  oldest: '最早',
  popular: '最热',
}

export default function LibraryPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('articles')
      .select('id, title, author, tags, tag_color, excerpt, type, like_count, created_at, published_at')
      .eq('status', 'approved')
      .then(({ data }) => {
        if (data) setArticles(data as Article[])
      })
  }, [])

  const filtered = articles.filter((a) => {
    if (!query) return true
    const text = `${a.title} ${a.author} ${a.tags || ''} ${a.excerpt || ''}`.toLowerCase()
    return text.includes(query.toLowerCase())
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'newest') return new Date(b.published_at ?? b.created_at).getTime() - new Date(a.published_at ?? a.created_at).getTime()
    if (sort === 'oldest') return new Date(a.published_at ?? a.created_at).getTime() - new Date(b.published_at ?? b.created_at).getTime()
    return (b.like_count ?? 0) - (a.like_count ?? 0)
  })

  return (
    <>
      <Header compact />
      <section className={s.section}>
        <div className={s.sectionHeader}>
          <h2 className={s.sectionTitle}>&#128218; 文库 · 全部文章</h2>
          <div className={s.sortBar}>
            {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
              <button
                key={key}
                className={`${s.sortBtn} ${sort === key ? s.sortBtnActive : ''}`}
                onClick={() => setSort(key)}
              >
                {SORT_LABELS[key]}
              </button>
            ))}
          </div>
        </div>
        <div className={s.searchBar}>
          <input
            type="text"
            className={s.searchInput}
            placeholder="搜索文章标题、作者、关键词..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className={s.cards}>
          {sorted.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
        {sorted.length === 0 && (
          <p className={s.noResults}>没有找到匹配的文章</p>
        )}
      </section>
      <Footer />
    </>
  )
}
