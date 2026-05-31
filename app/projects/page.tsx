import Link from 'next/link'
import dayjs from 'dayjs'
import AppShell from '@/components/ai-kobo/AppShell'
import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/lib/types'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const { data } = userData.user
    ? await supabase.from('projects').select('*').eq('user_id', userData.user.id).order('updated_at', { ascending: false })
    : { data: [] }
  const projects = (data ?? []) as Project[]

  return (
    <AppShell user={userData.user}>
      <div className="mb-6">
        <h1 className="text-3xl font-black">作品管理</h1>
        <p className="mt-2 text-stone-500 dark:text-stone-400">漫画・イラスト・色紙など、作品ごとに参考画像をまとめます。</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <form action="/api/create-project" method="post" className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <div className="grid gap-4">
            <input name="title" required className="input" placeholder="作品タイトル" />
            <textarea name="description" className="input min-h-28" placeholder="説明・メモ" />
          </div>
          <button disabled={!userData.user} className="mt-5 w-full rounded-2xl bg-red-500 px-5 py-3 font-black text-white disabled:opacity-50">作品を作成</button>
        </form>
        <div className="grid gap-3">
          {projects.map((project) => (
            <Link href={`/projects/${project.id}`} key={project.id} className="rounded-3xl border border-stone-200 bg-white p-5 hover:shadow-md dark:border-stone-800 dark:bg-stone-900">
              <h2 className="text-xl font-black">{project.title}</h2>
              <p className="mt-2 text-sm text-stone-500">{project.description || '説明なし'}</p>
              <p className="mt-3 text-xs text-stone-500">更新: {dayjs(project.updated_at).format('YYYY/MM/DD HH:mm')}</p>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
