import type { Metadata } from 'next'
import { Noto_Serif_SC, Playfair_Display } from 'next/font/google'
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
  title: 'Shift 刊见 — She Holds In Fist the Truth.',
  description: '开源期刊 · 女性主义知识共同体 · 由女性书写，为未来署名',
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
      </body>
    </html>
  )
}
