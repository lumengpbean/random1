import { createStaticClient } from '@/lib/supabase-static'
import type { Article } from '@/lib/types'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ArticleContent from './ArticleContent'

type Props = { params: Promise<{ id: string }> }

export async function generateStaticParams() {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('articles')
    .select('id')
    .eq('status', 'approved')
  return (data ?? []).map((row) => ({ id: String(row.id) }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('articles')
    .select('title, excerpt')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (!data) return { title: '文章不存在 — Shift 刊见' }
  return {
    title: `${data.title} — Shift 刊见`,
    description: data.excerpt || undefined,
  }
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params
  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  const article = data as Article | null

  return (
    <>
      <Header compact />
      {error || !article ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#c62828' }}>
          文章加载失败或不存在。
        </div>
      ) : (
        <ArticleContent article={article} />
      )}
      <Footer />
    </>
  )
}
