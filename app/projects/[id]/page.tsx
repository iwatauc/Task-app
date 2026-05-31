import { notFound } from 'next/navigation'
import AppShell from '@/components/ai-kobo/AppShell'
import ImageCard from '@/components/ai-kobo/ImageCard'
import { createClient } from '@/lib/supabase/server'
import type { AppImage, Project } from '@/lib/types'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return <AppShell user={null}><div className="rounded-3xl bg-white p-8 dark:bg-stone-900">ログインすると作品を表示できます。</div></AppShell>
  const [{ data: project }, { data: images }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).eq('user_id', userData.user.id).single(),
    supabase.from('images').select('*').eq('project_id', id).eq('user_id', userData.user.id).order('created_at', { ascending: false }),
  ])
  if (!project) notFound()
  const p = project as Project
  return <AppShell user={userData.user}><div className="mb-6"><h1 className="text-3xl font-black">{p.title}</h1><p className="mt-2 text-stone-500 dark:text-stone-400">{p.description || '説明なし'}</p></div>{images?.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{(images as AppImage[]).map((image) => <ImageCard key={image.id} image={image} />)}</div> : <p className="rounded-3xl bg-white p-6 text-stone-500 dark:bg-stone-900">まだ画像が紐づいていません。</p>}</AppShell>
}
