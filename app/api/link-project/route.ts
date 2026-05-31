import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.redirect(new URL('/login', request.url), { status: 303 })
  const form = await request.formData()
  const imageId = String(form.get('imageId'))
  const projectId = String(form.get('projectId') || '') || null
  await supabase.from('images').update({ project_id: projectId, updated_at: new Date().toISOString() }).eq('id', imageId).eq('user_id', userData.user.id)
  return NextResponse.redirect(new URL(`/images/${imageId}`, request.url), { status: 303 })
}
