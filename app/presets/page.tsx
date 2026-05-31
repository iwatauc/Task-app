import AppShell from '@/components/ai-kobo/AppShell'
import { createClient } from '@/lib/supabase/server'
import type { PromptPreset } from '@/lib/types'

const categories = ['構図', 'ポーズ', '線画', '背景', '色紙向け', 'キャラ', '表情']

export default async function PresetsPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const { data } = userData.user
    ? await supabase.from('prompt_presets').select('*').eq('user_id', userData.user.id).order('created_at', { ascending: false })
    : { data: [] }
  const presets = (data ?? []) as PromptPreset[]

  return (
    <AppShell user={userData.user}>
      <div className="mb-6">
        <h1 className="text-3xl font-black">プロンプトプリセット</h1>
        <p className="mt-2 text-stone-500 dark:text-stone-400">生成画面から呼び出せる、よく使う指定を保存します。</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <form action="/api/save-preset" method="post" className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <div className="grid gap-4">
            <input name="name" required className="input" placeholder="名前（例: 全身ポーズ確認）" />
            <select name="category" className="input">{categories.map((category) => <option key={category}>{category}</option>)}</select>
            <textarea name="promptJa" required className="input min-h-28" placeholder="日本語プリセット" />
            <textarea name="negativeNotes" className="input min-h-20" placeholder="避けたいこと" />
          </div>
          <button disabled={!userData.user} className="mt-5 w-full rounded-2xl bg-red-500 px-5 py-3 font-black text-white disabled:opacity-50">保存</button>
        </form>
        <div className="grid gap-3">
          {presets.map((preset) => (
            <article key={preset.id} className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
              <p className="text-xs font-bold text-red-600">{preset.category}</p>
              <h2 className="mt-1 text-xl font-black">{preset.name}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-stone-600 dark:text-stone-300">{preset.prompt_ja}</p>
              {preset.negative_notes && <p className="mt-2 text-sm text-stone-500">避けたいこと: {preset.negative_notes}</p>}
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
