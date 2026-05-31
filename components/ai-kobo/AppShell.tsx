import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import SignOutButton from '@/components/ai-kobo/SignOutButton'

const nav = [
  { href: '/', label: 'ホーム' },
  { href: '/generate', label: '生成' },
  { href: '/library', label: 'ライブラリ' },
  { href: '/presets', label: 'プリセット' },
  { href: '/projects', label: '作品管理' },
]

export default function AppShell({ children, user }: { children: React.ReactNode; user: User | null }) {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-stone-50">
      <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-white/85 backdrop-blur dark:border-stone-800 dark:bg-stone-950/85">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-2xl bg-red-500 text-lg font-black text-white">下</span>
            <span>
              <span className="block text-lg font-black tracking-tight">AI下絵工房</span>
              <span className="block text-xs text-stone-500 dark:text-stone-400">描くための下絵・参考資料づくり</span>
            </span>
          </Link>
          <nav className="flex gap-2 overflow-x-auto text-sm">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full px-3 py-2 font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-950 dark:text-stone-300 dark:hover:bg-stone-900 dark:hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            {user ? <><span className="hidden max-w-40 truncate sm:block">{user.email ?? 'ログイン中'}</span><SignOutButton /></> : <Link className="rounded-full bg-stone-950 px-3 py-2 font-semibold text-white dark:bg-white dark:text-stone-950" href="/login">ログイン</Link>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  )
}
