import Link from 'next/link'
import AppShell from '@/components/ai-kobo/AppShell'
import EmptyState from '@/components/ai-kobo/EmptyState'
import ImageCard from '@/components/ai-kobo/ImageCard'
import { createClient } from '@/lib/supabase/server'
import type { AppImage } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const { data: images } = userData.user
    ? await supabase.from('images').select('*').eq('user_id', userData.user.id).order('created_at', { ascending: false }).limit(6)
    : { data: [] as AppImage[] }

  return (
    <AppShell user={userData.user}>
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] bg-gradient-to-br from-red-500 to-orange-500 p-7 text-white shadow-lg sm:p-10">
          <p className="font-bold opacity-90">AI画像を完成品にしない。描くための参考を作る。</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">AI下絵工房</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 opacity-95">日本語でイメージを入れて、下絵・構図参考・ポーズ参考・線画参考・色ラフを生成。赤ペイントで直したい範囲を指定し、修正版まで履歴として保存できます。</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/generate" className="rounded-full bg-white px-5 py-3 font-black text-red-600">画像を生成する</Link>
            <Link href="/library" className="rounded-full border border-white/60 px-5 py-3 font-bold text-white">ライブラリを見る</Link>
          </div>
        </div>
        <div className="grid gap-3">
          {[['/generate', '生成', '目的・キャラ・ポーズ・構図だけで開始'], ['/presets', 'プロンプトプリセット', 'よく使う指定を保存'], ['/projects', '作品管理', '作品ごとに資料をまとめる']].map(([href, title, body]) => (
            <Link key={href} href={href} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md dark:border-stone-800 dark:bg-stone-900">
              <h2 className="text-xl font-black">{title}</h2>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{body}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-black">最近の履歴</h2><Link href="/library" className="text-sm font-bold text-red-600">すべて見る</Link></div>
        {images && images.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{(images as AppImage[]).map((image) => <ImageCard key={image.id} image={image} />)}</div> : <EmptyState title="まだ画像がありません" body="生成またはアップロードすると、ここに最近の履歴が表示されます。" />}
      </section>
    </AppShell>
  )
}
