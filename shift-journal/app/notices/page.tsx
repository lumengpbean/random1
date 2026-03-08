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
    id: 'restore-2025-03-08',
    title: '网站恢复公告',
    label: 'IMPORTANT',
    created_at: '2025-03-08T00:00:00Z',
    content: `亲爱的创作者们：

过去48小时，技术组几乎没合眼——面对网站攻击与账号被举报，我们完成了漏洞排查、架构迭代与数据恢复，让网站比以前更稳、更强地重回正轨。

网站已完全恢复正常运营。所谓”闭站”“停运”均为误传，Shift从未离开，也不会离开。

感谢过去24小时涌入的每一位老朋友和新面孔——你们的每次点击，都是我们坚持的理由。

提醒：感谢各位创作者的积极投稿！为缓解审核压力、提高刊发效率，邮箱收稿渠道将逐步关闭，请大家移步至网站端投稿。由于目前邮箱稿件较多，不能及时回复，请各位创作者不要担心，工作人员会在5到7个工作日内给予回复。投稿规范将逐步上线，更多反馈请关注官方账号及即将上线的社群。20篇精选文章持续更新中，更多内容、活动与社群运营也将陆续启动。

Shift还在，我们还在。
感谢每一位来稿的创作者，我们与你们同在。

祝所有女性朋友节日快乐，愿你们永远自由、勇敢、发光。

— Shift全体工作人员`
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