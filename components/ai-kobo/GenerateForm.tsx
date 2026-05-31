'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import type { Project, PromptPreset } from '@/lib/types'

const purposes = ['下絵', '構図参考', 'ポーズ参考', '線画参考', '色ラフ', '背景ラフ', '衣装案']
const outputTypes = ['構図ラフ', 'ポーズラフ', '線画寄り', 'グレースケール', 'カラーラフ', '色紙向け']
const ratios = ['1:1', '4:3', '3:4', '16:9', '9:16'] as const

export default function GenerateForm({ presets, projects, isLoggedIn }: { presets: PromptPreset[]; projects: Project[]; isLoggedIn: boolean }) {
  const router = useRouter()
  const [status, setStatus] = useState('')
  const [uploadStatus, setUploadStatus] = useState('')
  const [form, setForm] = useState({
    purpose: '下絵',
    character: '',
    pose: '',
    composition: '',
    outputType: '構図ラフ',
    avoid: '文字、ロゴ、過度な装飾、破綻した手指',
    aspectRatio: '1:1',
    tags: '',
    title: '',
    stylePreset: '',
    projectId: '',
  })

  const selectedPreset = useMemo(() => presets.find((preset) => preset.id === form.stylePreset), [form.stylePreset, presets])

  function setField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setStatus('画像を生成しています。少し時間がかかります…')
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, stylePreset: selectedPreset?.prompt_ja || form.stylePreset }),
    })
    const json = await response.json()
    if (!response.ok) {
      setStatus(json.error || '生成に失敗しました')
      return
    }
    setStatus('保存しました。詳細へ移動します…')
    router.push(`/images/${json.image.id}`)
    router.refresh()
  }

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setUploadStatus('アップロード中…')
    const response = await fetch('/api/upload-image', { method: 'POST', body: data })
    const json = await response.json()
    if (!response.ok) {
      setUploadStatus(json.error || 'アップロードに失敗しました')
      return
    }
    router.push(`/images/${json.image.id}`)
    router.refresh()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <form onSubmit={submit} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-7">
        {!isLoggedIn && <p className="mb-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">UIは確認できますが、生成・保存にはログインが必要です。</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold">目的<select value={form.purpose} onChange={(e) => setField('purpose', e.target.value)} className="input">{purposes.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-bold">出力タイプ<select value={form.outputType} onChange={(e) => setField('outputType', e.target.value)} className="input">{outputTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-bold sm:col-span-2">キャラ説明<textarea required value={form.character} onChange={(e) => setField('character', e.target.value)} className="input min-h-24" placeholder="例: 10代の魔法使い、短髪、ケープ、元気な雰囲気" /></label>
          <label className="grid gap-2 text-sm font-bold">ポーズ<textarea value={form.pose} onChange={(e) => setField('pose', e.target.value)} className="input min-h-20" placeholder="例: 片手を前に出して杖を構える" /></label>
          <label className="grid gap-2 text-sm font-bold">構図<textarea value={form.composition} onChange={(e) => setField('composition', e.target.value)} className="input min-h-20" placeholder="例: あおり気味、全身、余白あり" /></label>
          <label className="grid gap-2 text-sm font-bold">画面比率<select value={form.aspectRatio} onChange={(e) => setField('aspectRatio', e.target.value)} className="input">{ratios.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-bold">作品<select value={form.projectId} onChange={(e) => setField('projectId', e.target.value)} className="input"><option value="">未設定</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
        </div>
        <details className="mt-5 rounded-2xl bg-stone-50 p-4 dark:bg-stone-950">
          <summary className="cursor-pointer font-bold">詳細設定・タグ</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">タイトル<input value={form.title} onChange={(e) => setField('title', e.target.value)} className="input" placeholder="例: 魔法使いの構図ラフ" /></label>
            <label className="grid gap-2 text-sm font-bold">プリセット<select value={form.stylePreset} onChange={(e) => setField('stylePreset', e.target.value)} className="input"><option value="">未選択</option>{presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.category}: {preset.name}</option>)}</select></label>
            <label className="grid gap-2 text-sm font-bold sm:col-span-2">避けたいこと<textarea value={form.avoid} onChange={(e) => setField('avoid', e.target.value)} className="input min-h-20" /></label>
            <label className="grid gap-2 text-sm font-bold sm:col-span-2">タグ<input value={form.tags} onChange={(e) => setField('tags', e.target.value)} className="input" placeholder="ポーズ, 手, 背景ラフ" /></label>
          </div>
        </details>
        <button disabled={!isLoggedIn || !!status.includes('生成しています')} className="mt-6 w-full rounded-2xl bg-red-500 px-5 py-4 font-black text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50">画像を生成して保存</button>
        {status && <p className="mt-3 text-sm text-stone-600 dark:text-stone-300">{status}</p>}
      </form>

      <form onSubmit={upload} className="h-fit rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-7">
        <h2 className="text-xl font-black">自分の画像をアップロード</h2>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">ラフや写真資料も履歴に入れて、赤ペイント修正へ進めます。</p>
        <div className="mt-5 grid gap-4">
          <input type="file" name="file" accept="image/png,image/jpeg,image/webp" required className="input" />
          <input name="title" className="input" placeholder="タイトル" />
          <select name="purpose" className="input">{purposes.map((item) => <option key={item}>{item}</option>)}</select>
          <input name="tags" className="input" placeholder="タグ（カンマ区切り）" />
          <select name="projectId" className="input"><option value="">作品未設定</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select>
        </div>
        <button disabled={!isLoggedIn} className="mt-5 w-full rounded-2xl bg-stone-950 px-5 py-3 font-bold text-white disabled:opacity-50 dark:bg-white dark:text-stone-950">アップロードして保存</button>
        {uploadStatus && <p className="mt-3 text-sm text-stone-600 dark:text-stone-300">{uploadStatus}</p>}
      </form>
    </div>
  )
}
