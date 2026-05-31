import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fileExtFromMime } from '@/lib/utils/images'
import { parseTags } from '@/lib/utils/prompts'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'ログインが必要です。' }, { status: 401 })
  try {
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: '画像ファイルが必要です。' }, { status: 400 })
    const ext = fileExtFromMime(file.type)
    const path = `${userData.user.id}/uploaded/${crypto.randomUUID()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const upload = await supabase.storage.from('images').upload(path, buffer, { contentType: file.type, upsert: false })
    if (upload.error) throw upload.error
    const { data: publicUrl } = supabase.storage.from('images').getPublicUrl(path)
    const { data: image, error } = await supabase.from('images').insert({
      user_id: userData.user.id,
      project_id: (form.get('projectId') as string) || null,
      title: (form.get('title') as string) || file.name,
      image_url: publicUrl.publicUrl,
      thumbnail_url: publicUrl.publicUrl,
      source_type: 'uploaded',
      prompt_ja: 'ユーザーアップロード画像',
      purpose: (form.get('purpose') as string) || '下絵',
      tags: parseTags((form.get('tags') as string) || ''),
    }).select('*').single()
    if (error) throw error
    return NextResponse.json({ image })
  } catch (error) {
    console.error('upload-image failed', error)
    return NextResponse.json({ error: 'アップロード保存に失敗しました。' }, { status: 500 })
  }
}
