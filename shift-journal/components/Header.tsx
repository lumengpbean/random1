'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import s from '@/styles/Header.module.css'

// 在这里添加了 '公告栏'
const NAV_ITEMS = [
  { href: '/', label: '首页 · 当前卷' },
  { href: '/library', label: '文库' },
  { href: '/submit', label: '投稿／转换' },
  { href: '/notices', label: '公告栏' },
]

export default function Header({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname()

  // 如果是紧凑模式（通常用于文章详情页），不显示导航栏
  if (compact) {
    return (
      <>
        <Link href="/" className={s.backHome}>&larr; 返回首页</Link>
        <header className={`${s.header} ${s.headerCompact}`}>
          <div className={s.inner}>
            <div className={s.left}>
              <h1 className={`${s.title} ${s.titleSmall}`}>
                Shift <span className={`${s.iconShift} ${s.iconShiftSmall}`}>&#8629;</span> 刊见
              </h1>
            </div>
            <div className={s.right}>
              <p className={s.issn}>&#9679; SHIFT 3008 · 2026 创刊号</p>
            </div>
          </div>
        </header>
      </>
    )
  }

  // 正常模式：显示完整 Header 和 导航栏
  return (
    <>
      <header className={s.header}>
        <div className={s.inner}>
          <div className={s.left}>
            <p className={s.subtitle}>* 新叙事 · 开源刊见 · 知识与表达共同体</p>
            <h1 className={s.title}>
              Shift <span className={s.iconShift}>&#8629;</span> 刊见
            </h1>
          </div>
          <div className={s.right}>
            <p className={s.issn}>&#9679; SHIFT 3008 · 2026 创刊号</p>
            <p className={s.motto}> 在这里，观点不必服从旧秩序</p>
          </div>
        </div>
      </header>
      <nav className={s.nav}>
        <ul className={s.navList}>
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${s.navLink} ${pathname === item.href ? s.navLinkActive : ''}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}