import { createBrowserClient } from '@supabase/ssr'
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from '@/lib/env'
import { createMockSupabaseClient } from '@/lib/supabase/mock'

export function createClient() {
  if (!isSupabaseConfigured) {
    return createMockSupabaseClient() as ReturnType<typeof createBrowserClient>
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
