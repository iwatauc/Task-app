'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  async function login(event: React.FormEvent) {
    event.preventDefault()
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback` } })
    setMessage(error ? error.message : 'ログインリンクをメールに送信しました。')
  }

  return (
    <main className="min-h-screen bg-stone-50 p-4 text-stone-950 dark:bg-stone-950 dark:text-stone-50">
      <div className="mx-auto mt-16 max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <h1 className="text-3xl font-black">AI下絵工房にログイン</h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">Supabase Auth のメールリンクでログインします。</p>
        <form onSubmit={login} className="mt-6 grid gap-4"><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" /><button className="rounded-2xl bg-red-500 px-5 py-3 font-black text-white">ログインリンクを送る</button></form>
        {message && <p className="mt-4 text-sm text-stone-600 dark:text-stone-300">{message}</p>}
      </div>
    </main>
  )
}
