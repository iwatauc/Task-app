import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.redirect(new URL('/login', request.url), { status: 303 })
  const form = await request.formData()
  await supabase.from('prompt_presets').insert({ user_id: userData.user.id, name: form.get('name'), category: form.get('category'), prompt_ja: form.get('promptJa'), prompt_en: form.get('promptJa'), negative_notes: form.get('negativeNotes') })
  return NextResponse.redirect(new URL('/presets', request.url), { status: 303 })
}
