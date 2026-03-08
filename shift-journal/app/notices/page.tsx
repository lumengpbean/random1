import { createStaticClient } from '@/lib/supabase-static'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import s from '@/styles/Notices.module.css' // 引入刚才新建的样式
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '公告 | Shift 刊见',
  description: 'Shift 网站公告、征稿启事与动态更新',
}

export const revalidate = 60

type Notice = {
  id: string
  title: string // 虽然样式主要显示 LABEL，但我们保留 title 字段备用
  label: string // 例如 "NOTICE", "UPDATE"
  content: string
  created_at: string
}

export default async function NoticesPage() {
  const supabase = createStaticClient()
  let notices: Notice[] = []

  // 1. 尝试从数据库获取
  if (supabase) {
    const { data } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) notices = data as Notice[]
  }

  // 2. 如果数据库没数据，或者为了展示特定公告，我们把那段文字加进去
  // 注意：我们将这条最新的手动置顶
  const specialNotice: Notice = {
    id: 'scam-warning-2026-03-08',
    title: '紧急警示',
    label: 'IMPORTANT',
    created_at: '2026-03-08T00:00:00Z',
    content: `【紧急警示】
亲爱的姊妹们，外网出现冒充我们团队的诈骗账号，请立即注意！
官方渠道：仅限小红书，共三个官号 @SHIFT刊见（建设中）、@转换键开发日志、@转换键 好好刊。
我们从未进行任何形式的收款或捐赠募集，如遇陌生账号以我们名义要求转账或收款，请直接忽略并举报。信息安全无小事，请帮忙扩散，保护好自己和身边的姊妹。`
  }

  // 合并数据（如果数据库里没有这条，就手动加上）
  if (!notices.find(n => n.id === specialNotice.id)) {
    notices = [specialNotice, ...notices]
  }

  return (
    <>
      <Header />
      
      <main className={s.container}>
        <h2 className={s.pageTitle}>Editorial Notices</h2>

        {notices.map((notice) => (
          <article key={notice.id} className={s.card}>
            <div className={s.header}>
              <span className={s.label}>{notice.label || 'NOTICE'}</span>
            </div>
            
            {/* 使用 pre-wrap 保留你文本中的换行格式 */}
            <div className={s.content}>
              {notice.content}
            </div>
            
            <div className={s.date}>
              {new Date(notice.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </article>
        ))}

        {notices.length === 0 && (
          <p style={{ textAlign: 'center', color: '#b1a7b3', fontStyle: 'italic', marginTop: '100px' }}>
            No notices at this time.
          </p>
        )}
      </main>

      <Footer />
    </>
  )
}