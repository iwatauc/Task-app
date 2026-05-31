import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { imageId, favorite } = await request.json()
  const { error } = await supabase.from('images').update({ favorite, updated_at: new Date().toISOString() }).eq('id', imageId).eq('user_id', userData.user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
