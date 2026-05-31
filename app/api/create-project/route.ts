import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.redirect(new URL('/login', request.url), { status: 303 })
  const form = await request.formData()
  await supabase.from('projects').insert({ user_id: userData.user.id, title: form.get('title'), description: form.get('description') })
  return NextResponse.redirect(new URL('/projects', request.url), { status: 303 })
}
