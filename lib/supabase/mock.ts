type EmptyResult = { data: null; error: null }
type EmptyListResult = { data: never[]; error: null }

function emptyQuery() {
  const query = {
    select: () => query,
    eq: () => query,
    or: () => query,
    order: () => query,
    limit: () => Promise.resolve({ data: [], error: null } satisfies EmptyListResult),
    single: () => Promise.resolve({ data: null, error: null } satisfies EmptyResult),
    insert: () => query,
    update: () => query,
    delete: () => query,
    then: (resolve: (value: EmptyListResult) => unknown) => resolve({ data: [], error: null }),
  }
  return query
}

export function createMockSupabaseClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signOut: async () => ({ error: null }),
      exchangeCodeForSession: async () => ({ data: { session: null }, error: null }),
      signInWithOtp: async () => ({ data: null, error: { message: 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' } }),
    },
    from: () => emptyQuery(),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: { message: 'Supabase is not configured.' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  }
}
