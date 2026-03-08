import Link from 'next/link'
import type { Article } from '@/lib/types'
import s from '@/styles/ArticleCard.module.css'

export default function ArticleCard({ article }: { article: Article }) {
  // 格式化日期，如果有的话
  const dateStr = article.created_at 
    ? new Date(article.created_at).toLocaleDateString('zh-CN') 
    : ''

  return (
    <Link href={`/article/${article.id}`} className={s.cardLink}>
      <article className={s.card}>
        <div className={s.tags}>
          {/* 默认显示标签或类型 */}
          <span className={s.tag}>{article.tags || article.type || '文章'}</span>
        </div>
        
        <h3 className={s.cardTitle} title={article.title}>
          {article.title}
        </h3>
        
        <p className={s.cardAuthor}>&#9998; {article.author}</p>
        
        <p className={s.cardExcerpt}>
          {article.excerpt || '暂无摘要'}
        </p>
        
        {/* 底部 Meta 区域，会自动推到最底部 */}
        <div className={s.cardMeta}>
           <span>阅读更多 &rarr;</span>
           <span>{dateStr}</span>
        </div>
      </article>
    </Link>
  )
}