import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from '@/lib/env'
import { createMockSupabaseClient } from '@/lib/supabase/mock'

export async function createClient() {
  if (!isSupabaseConfigured) {
    return createMockSupabaseClient() as ReturnType<typeof createServerClient>
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components cannot always write cookies. Route handlers can.
        }
      },
    },
  })
}
