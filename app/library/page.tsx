import AppShell from '@/components/ai-kobo/AppShell'
import EmptyState from '@/components/ai-kobo/EmptyState'
import ImageCard from '@/components/ai-kobo/ImageCard'
import { createClient } from '@/lib/supabase/server'
import type { AppImage } from '@/lib/types'

export default async function LibraryPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  let images: AppImage[] = []
  if (userData.user) {
    let query = supabase.from('images').select('*').eq('user_id', userData.user.id).order('created_at', { ascending: false })
    if (params.favorite === 'true') query = query.eq('favorite', true)
    if (params.source) query = query.eq('source_type', params.source)
    if (params.q) query = query.or(`title.ilike.%${params.q}%,prompt_ja.ilike.%${params.q}%,purpose.ilike.%${params.q}%`)
    const { data } = await query
    images = (data ?? []) as AppImage[]
  }

  return (
    <AppShell user={userData.user}>
      <div className="mb-6"><h1 className="text-3xl font-black">ライブラリ</h1><p className="mt-2 text-stone-500 dark:text-stone-400">生成・アップロード・修正した画像を見返して再利用できます。</p></div>
      <form className="mb-6 grid gap-3 rounded-3xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 sm:grid-cols-4">
        <input name="q" defaultValue={params.q} className="input sm:col-span-2" placeholder="検索（タイトル・用途・メモ）" />
        <select name="source" defaultValue={params.source || ''} className="input"><option value="">すべて</option><option value="generated">generated</option><option value="uploaded">uploaded</option><option value="edited">edited</option></select>
        <select name="favorite" defaultValue={params.favorite || ''} className="input"><option value="">お気に入り指定なし</option><option value="true">お気に入りのみ</option></select>
        <button className="rounded-2xl bg-stone-950 px-4 py-3 font-bold text-white dark:bg-white dark:text-stone-950">絞り込み</button>
      </form>
      {images.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{images.map((image) => <ImageCard key={image.id} image={image} />)}</div> : <EmptyState title="条件に合う画像がありません" body="生成・アップロード後にカード形式で表示されます。" />}
    </AppShell>
  )
}
