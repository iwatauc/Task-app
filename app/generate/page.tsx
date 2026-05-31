import AppShell from '@/components/ai-kobo/AppShell'
import GenerateForm from '@/components/ai-kobo/GenerateForm'
import { createClient } from '@/lib/supabase/server'
import type { Project, PromptPreset } from '@/lib/types'

export default async function GeneratePage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const [presetsResult, projectsResult] = userData.user
    ? await Promise.all([
        supabase.from('prompt_presets').select('*').eq('user_id', userData.user.id).order('created_at', { ascending: false }),
        supabase.from('projects').select('*').eq('user_id', userData.user.id).order('updated_at', { ascending: false }),
      ])
    : [{ data: [] as PromptPreset[] }, { data: [] as Project[] }]

  return (
    <AppShell user={userData.user}>
      <div className="mb-6"><h1 className="text-3xl font-black">画像を生成する</h1><p className="mt-2 text-stone-500 dark:text-stone-400">まずは分かる範囲だけ入力して、作画の土台になる参考画像を作ります。</p></div>
      <GenerateForm presets={(presetsResult.data ?? []) as PromptPreset[]} projects={(projectsResult.data ?? []) as Project[]} isLoggedIn={!!userData.user} />
    </AppShell>
  )
}
