'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import s from '@/styles/Admin.module.css'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  async function handleLogin() {
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '登录失败')
        return
      }

      // If there's an explicit redirect (e.g. from middleware), use it
      const redirect = searchParams.get('redirect')
      if (redirect) {
        router.push(redirect)
        return
      }

      // Otherwise, route based on role
      if (data.role === 'admin') {
        router.push('/admin')
      } else if (data.role === 'reviewer') {
        router.push('/review')
      } else {
        setError('该账号没有访问权限。')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
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
        onKeyDown={(e) => e.key === 'Enter' && !loading && handleLogin()}
      />
      <input
        className={s.input}
        type="password"
        placeholder="密码"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !loading && handleLogin()}
      />
      <button
        className={`${s.btn} ${s.btnPrimary}`}
        style={{ width: '100%' }}
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? '登录中...' : '登录'}
      </button>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className={s.page}>
      <div className={s.container}>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>加载中...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
