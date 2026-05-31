import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateImage } from '@/lib/services/openaiImageService'
import type { GenerateFormPayload } from '@/lib/types'
import { aspectRatioToOpenAiSize } from '@/lib/utils/images'
import { buildImagePrompt, buildJapanesePromptSummary, parseTags } from '@/lib/utils/prompts'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'ログインが必要です。' }, { status: 401 })

  try {
    const body = (await request.json()) as GenerateFormPayload
    const promptEn = buildImagePrompt(body)
    const promptJa = buildJapanesePromptSummary(body)
    const size = aspectRatioToOpenAiSize(body.aspectRatio)
    const buffer = await generateImage({ prompt: promptEn, size, user: userData.user.id })
    const path = `${userData.user.id}/generated/${crypto.randomUUID()}.png`
    const upload = await supabase.storage.from('images').upload(path, buffer, { contentType: 'image/png', upsert: false })
    if (upload.error) throw upload.error
    const { data: publicUrl } = supabase.storage.from('images').getPublicUrl(path)
    const [width, height] = size.split('x').map(Number)
    const { data: image, error } = await supabase.from('images').insert({
      user_id: userData.user.id,
      project_id: body.projectId || null,
      title: body.title || `${body.purpose} - ${body.outputType}`,
      image_url: publicUrl.publicUrl,
      thumbnail_url: publicUrl.publicUrl,
      source_type: 'generated',
      prompt_ja: promptJa,
      prompt_en: promptEn,
      purpose: body.purpose,
      output_type: body.outputType,
      style_preset: body.stylePreset || null,
      tags: parseTags(body.tags),
      width,
      height,
    }).select('*').single()
    if (error) throw error
    return NextResponse.json({ image })
  } catch (error) {
    console.error('generate-image failed', error)
    return NextResponse.json({ error: '画像生成または保存に失敗しました。設定とログを確認してください。' }, { status: 500 })
  }
}
