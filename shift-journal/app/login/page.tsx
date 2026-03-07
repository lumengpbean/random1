'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter, useSearchParams } from 'next/navigation'
import s from '@/styles/Admin.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  async function handleLogin() {
    setError('')
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('登录失败: ' + authError.message)
      return
    }
    const redirect = searchParams.get('redirect') || '/review'
    router.push(redirect)
  }

  return (
    <div className={s.page}>
      <div className={s.container}>
        <div className={s.loginBox}>
          <h2>SHIFT 团队登录</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
            仅限授权审稿员 / 编辑登录
          </p>
          {error && <p style={{ color: '#c62828', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{error}</p>}
          <input
            className={s.input}
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <input
            className={s.input}
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button
            className={`${s.btn} ${s.btnPrimary}`}
            style={{ width: '100%' }}
            onClick={handleLogin}
          >
            登录
          </button>
        </div>
      </div>
    </div>
  )
}
