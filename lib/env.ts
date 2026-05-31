const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const rawSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(rawSupabaseUrl && rawSupabaseAnonKey)
export const supabaseUrl = rawSupabaseUrl || 'https://example.supabase.co'
export const supabaseAnonKey = rawSupabaseAnonKey || 'missing-anon-key'
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
export const openaiApiKey = process.env.OPENAI_API_KEY || ''
export const openaiImageModel = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1.5'
export const isOpenAiConfigured = Boolean(openaiApiKey)
