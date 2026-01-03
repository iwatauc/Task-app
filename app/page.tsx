import { createClient } from '@/lib/supabase/server'
import TaskApp from '@/components/TaskApp'

export default async function HomePage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  return <TaskApp userEmail={data.user?.email ?? ''} />
}
