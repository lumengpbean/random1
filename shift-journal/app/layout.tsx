import type { Metadata } from 'next'
import { Noto_Serif_SC, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const notoSerifSC = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Shift 刊见 — Sheer Honesty In Form and Thought',
  description: '新叙事 · 开源刊见 · 知识与表达共同体 · 在这里，观点不必服从旧秩序',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={`${notoSerifSC.variable} ${playfairDisplay.variable}`}>
      <body style={{ fontFamily: 'var(--font-serif)' }}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
