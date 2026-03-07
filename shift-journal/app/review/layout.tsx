import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '审稿投票 — Shift 刊见',
  robots: { index: false, follow: false },
}

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
