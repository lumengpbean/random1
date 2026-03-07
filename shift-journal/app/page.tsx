import { createStaticClient } from '@/lib/supabase-static'
import type { Article } from '@/lib/types'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import ArticleCard from '@/components/ArticleCard'
import Footer from '@/components/Footer'
import s from '@/styles/ArticleCard.module.css'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = createStaticClient()

  const { data: articles } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(6)

  const displayArticles = (articles as Article[]) || []

  return (
    <>
      <Header />
      <Hero />
      <section className={s.section}>
        <div className={s.sectionHeader}>
          <h2 className={s.sectionTitle}>&#128209; 最新首发 · Shift 转换</h2>
          <Link href="/library" className={s.browseAll}>&#9633; 浏览全刊目录</Link>
        </div>
        <div className={s.cards}>
          {displayArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
          {displayArticles.length === 0 && (
            <p style={{ color: 'var(--color-text-light)', gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
              暂无已发布文章
            </p>
          )}
        </div>
      </section>
      <Footer />
    </>
  )
}
