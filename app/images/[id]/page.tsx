import Link from 'next/link'
import { notFound } from 'next/navigation'
import dayjs from 'dayjs'
import AppShell from '@/components/ai-kobo/AppShell'
import FavoriteButton from '@/components/ai-kobo/FavoriteButton'
import ImageCard from '@/components/ai-kobo/ImageCard'
import { createClient } from '@/lib/supabase/server'
import type { AppImage, EditRequest, Project } from '@/lib/types'

export default async function ImageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return <AppShell user={null}><div className="rounded-3xl bg-white p-8 dark:bg-stone-900">ログインすると画像詳細を表示できます。</div></AppShell>
  }
  const { data: image } = await supabase.from('images').select('*').eq('id', id).eq('user_id', userData.user.id).single()
  if (!image) notFound()
  const [childrenResult, editsResult, projectsResult] = await Promise.all([
    supabase.from('images').select('*').eq('parent_image_id', id).eq('user_id', userData.user.id).order('created_at', { ascending: false }),
    supabase.from('edit_requests').select('*').eq('image_id', id).eq('user_id', userData.user.id).order('created_at', { ascending: false }),
    supabase.from('projects').select('*').eq('user_id', userData.user.id).order('updated_at', { ascending: false }),
  ])
  const appImage = image as AppImage

  return (
    <AppShell user={userData.user}>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-stone-200 bg-white p-3 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={appImage.image_url} alt={appImage.title || '下絵'} className="mx-auto max-h-[75vh] rounded-2xl object-contain" />
        </div>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
            <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-black">{appImage.title || '無題の下絵'}</h1><FavoriteButton imageId={appImage.id} initialFavorite={appImage.favorite} /></div>
            <p className="mt-2 text-sm text-stone-500">{dayjs(appImage.created_at).format('YYYY/MM/DD HH:mm')} / {appImage.source_type}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm"><span className="rounded-full bg-red-50 px-3 py-1 text-red-700 dark:bg-red-950 dark:text-red-200">{appImage.purpose || '用途未設定'}</span><span className="rounded-full bg-stone-100 px-3 py-1 dark:bg-stone-800">{appImage.output_type || 'タイプ未設定'}</span>{appImage.tags?.map((tag) => <span key={tag} className="rounded-full bg-stone-100 px-3 py-1 dark:bg-stone-800">#{tag}</span>)}</div>
            <div className="mt-5 flex flex-wrap gap-2"><Link href={`/images/${appImage.id}/edit`} className="rounded-full bg-red-500 px-5 py-3 font-black text-white">この画像を修正する</Link><Link href={`/generate?parent=${appImage.id}`} className="rounded-full border border-stone-300 px-5 py-3 font-bold dark:border-stone-700">再生成の参考にする</Link></div>
          </div>
          <form action="/api/link-project" method="post" className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
            <input type="hidden" name="imageId" value={appImage.id} />
            <label className="grid gap-2 text-sm font-bold">プロジェクトに紐付ける<select name="projectId" defaultValue={appImage.project_id || ''} className="input"><option value="">未設定</option>{((projectsResult.data ?? []) as Project[]).map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
            <button className="mt-3 rounded-full bg-stone-950 px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-stone-950">保存</button>
          </form>
        </aside>
      </div>
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"><h2 className="text-xl font-black">日本語入力・メモ</h2><pre className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-700 dark:text-stone-300">{appImage.prompt_ja || 'メモなし'}</pre></div>
        <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"><h2 className="text-xl font-black">整形後プロンプト</h2><pre className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-700 dark:text-stone-300">{appImage.prompt_en || 'なし'}</pre></div>
      </section>
      <section className="mt-6"><h2 className="mb-3 text-2xl font-black">バージョン履歴</h2>{childrenResult.data?.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{(childrenResult.data as AppImage[]).map((child) => <ImageCard key={child.id} image={child} />)}</div> : <p className="rounded-3xl bg-white p-5 text-stone-500 dark:bg-stone-900">まだ修正版はありません。</p>}</section>
      <section className="mt-6"><h2 className="mb-3 text-2xl font-black">修正指示履歴</h2><div className="space-y-3">{((editsResult.data ?? []) as EditRequest[]).map((edit) => <div key={edit.id} className="rounded-3xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"><p className="font-bold">{edit.instruction}</p><p className="mt-1 text-xs text-stone-500">{dayjs(edit.created_at).format('YYYY/MM/DD HH:mm')}</p></div>)}</div></section>
    </AppShell>
  )
}
