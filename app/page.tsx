import { createClient } from '@/lib/supabase/server'
import AIInfoApp from '@/components/AIInfoApp'

export default async function HomePage() {
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  let userEmail = ''

  if (hasSupabaseConfig) {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    userEmail = data.user?.email ?? ''
  }

  return <AIInfoApp userEmail={userEmail} />
}
