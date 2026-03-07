'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { Article } from '@/lib/types'
import Header from '@/components/Header'
import ArticleCard from '@/components/ArticleCard'
import Footer from '@/components/Footer'
import s from '@/styles/ArticleCard.module.css'

export default function LibraryPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('articles')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setArticles(data as Article[])
      })
  }, [])

  const filtered = articles.filter((a) => {
    if (!query) return true
    const text = `${a.title} ${a.author} ${a.tags || ''} ${a.excerpt || ''}`.toLowerCase()
    return text.includes(query.toLowerCase())
  })

  return (
    <>
      <Header compact />
      <section className={s.section}>
        <div className={s.sectionHeader}>
          <h2 className={s.sectionTitle}>&#128218; 文库 · 全部文章</h2>
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
          {filtered.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className={s.noResults}>没有找到匹配的文章</p>
        )}
      </section>
      <Footer />
    </>
  )
}
