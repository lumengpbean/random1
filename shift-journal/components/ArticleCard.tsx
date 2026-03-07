import Link from 'next/link'
import type { Article } from '@/lib/types'
import s from '@/styles/ArticleCard.module.css'

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <Link href={`/article/${article.id}`} className={s.cardLink}>
      <article className={s.card}>
        <div className={s.tags}>
          <span className={s.tag}>{article.tags || '文章'}</span>
        </div>
        <h3 className={s.cardTitle}>{article.title}</h3>
        <p className={s.cardAuthor}>&#9998; {article.author}</p>
        <p className={s.cardExcerpt}>{article.excerpt || ''}</p>
        <div className={s.cardMeta} />
      </article>
    </Link>
  )
}
