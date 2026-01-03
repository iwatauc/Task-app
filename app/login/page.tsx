'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // すでにログイン済みなら middleware が / に飛ばすが、念のため
    supabase.auth.getUser().then(() => {})
  }, [supabase])

  const loginGoogle = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)
  }

  return (
    <main style={{ padding: 24, maxWidth: 520, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>ログイン</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        共有前提のため、Googleログインを使います。
      </p>

      <button
        onClick={loginGoogle}
        disabled={loading}
        style={{
          marginTop: 16,
          padding: '12px 14px',
          borderRadius: 10,
          border: '1px solid #ddd',
          width: '100%',
          fontWeight: 600,
        }}
      >
        {loading ? 'リダイレクト中…' : 'Googleでログイン'}
      </button>
    </main>
  )
}
