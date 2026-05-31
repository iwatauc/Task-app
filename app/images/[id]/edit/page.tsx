import { notFound } from 'next/navigation'
import AppShell from '@/components/ai-kobo/AppShell'
import EditCanvas from '@/components/ai-kobo/EditCanvas'
import { createClient } from '@/lib/supabase/server'
import type { AppImage } from '@/lib/types'

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return <AppShell user={null}><div className="rounded-3xl bg-white p-8 dark:bg-stone-900">ログインすると編集できます。</div></AppShell>
  const { data: image } = await supabase.from('images').select('*').eq('id', id).eq('user_id', userData.user.id).single()
  if (!image) notFound()
  return <AppShell user={userData.user}><div className="mb-6"><h1 className="text-3xl font-black">赤ペイント修正</h1><p className="mt-2 text-stone-500 dark:text-stone-400">スマホでも指で塗れます。消しゴム・全消しも使えます。</p></div><EditCanvas image={image as AppImage} /></AppShell>
}
