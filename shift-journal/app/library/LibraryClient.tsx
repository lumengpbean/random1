'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { Article } from '@/lib/types'
import Header from '@/components/Header'
import ArticleCard from '@/components/ArticleCard'
import Footer from '@/components/Footer'
import s from '@/styles/ArticleCard.module.css'

type SortKey = 'newest' | 'oldest' | 'popular'
type FilterKey = 'all' | 'paper' | 'essay' | 'practical'

const FILTER_LABELS: Record<FilterKey, string> = {
  all: '全部',
  paper: '论文',
  essay: '随笔',
  practical: '实用',
}

const SORT_LABELS: Record<SortKey, string> = {
  newest: '最新',
  oldest: '最早',
  popular: '最热',
}

export default function LibraryPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')
  const [filter, setFilter] = useState<FilterKey>('all')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('articles')
      .select('id, title, author, tags, excerpt, type, like_count, view_count, created_at, published_at, status, file_url, keywords')
      .eq('status', 'approved')
      .order('published_at', { ascending: false, nullsFirst: false })
      .then(({ data }) => {
        if (data) setArticles(data as Article[])
        setLoading(false)
      })
  }, [])

  const filtered = articles.filter((a) => {
    const matchSearch = !query ||
      `${a.title} ${a.author} ${a.tags || ''} ${a.excerpt || ''}`.toLowerCase().includes(query.toLowerCase())
    const matchFilter = filter === 'all' || a.type === filter
    return matchSearch && matchFilter
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
        </div>
        <div className={s.filterBar}>
          {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => (
            <button
              key={key}
              className={`${s.filterBtn} ${filter === key ? s.filterBtnActive : ''}`}
              onClick={() => setFilter(key)}
            >
              {FILTER_LABELS[key]}
            </button>
          ))}
        </div>
        <div className={s.searchBar}>
          <input
            type="text"
            className={s.searchInput}
            placeholder="搜索文章标题、作者、关键词..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
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
        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>加载中...</p>
        ) : (
          <>
            <div className={s.cards}>
              {sorted.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
            {sorted.length === 0 && (
              <p className={s.noResults}>没有找到匹配的文章</p>
            )}
          </>
        )}
      </section>
      <Footer />
    </>
  )
}
