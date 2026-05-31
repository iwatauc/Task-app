import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { editImage } from '@/lib/services/openaiImageService'
import type { AppImage } from '@/lib/types'
import { buildEditPrompt } from '@/lib/utils/prompts'

type Body = { imageId: string; instruction: string; overlayDataUrl: string; maskDataUrl: string }

function dataUrlToBuffer(dataUrl: string) {
  const [, base64] = dataUrl.split(',')
  return Buffer.from(base64, 'base64')
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'ログインが必要です。' }, { status: 401 })
  try {
    const body = (await request.json()) as Body
    const { data: source } = await supabase.from('images').select('*').eq('id', body.imageId).eq('user_id', userData.user.id).single()
    if (!source) return NextResponse.json({ error: '元画像が見つかりません。' }, { status: 404 })
    const image = source as AppImage
    const [sourceResponse] = await Promise.all([fetch(image.image_url)])
    if (!sourceResponse.ok) throw new Error('Failed to fetch source image')
    const sourceBlob = new Blob([await sourceResponse.arrayBuffer()], { type: sourceResponse.headers.get('content-type') || 'image/png' })
    const maskBuffer = dataUrlToBuffer(body.maskDataUrl)
    const overlayBuffer = dataUrlToBuffer(body.overlayDataUrl)
    const maskPath = `${userData.user.id}/masks/${crypto.randomUUID()}.png`
    const overlayPath = `${userData.user.id}/overlays/${crypto.randomUUID()}.png`
    const [maskUpload, overlayUpload] = await Promise.all([
      supabase.storage.from('masks').upload(maskPath, maskBuffer, { contentType: 'image/png', upsert: false }),
      supabase.storage.from('overlays').upload(overlayPath, overlayBuffer, { contentType: 'image/png', upsert: false }),
    ])
    if (maskUpload.error) throw maskUpload.error
    if (overlayUpload.error) throw overlayUpload.error
    const { data: maskPublic } = supabase.storage.from('masks').getPublicUrl(maskPath)
    const { data: overlayPublic } = supabase.storage.from('overlays').getPublicUrl(overlayPath)
    const instructionEn = buildEditPrompt(body.instruction, image.purpose)
    const resultBuffer = await editImage({ prompt: instructionEn, image: sourceBlob, mask: new Blob([maskBuffer], { type: 'image/png' }), size: image.width && image.height ? `${image.width}x${image.height}` : '1024x1024', user: userData.user.id })
    const resultPath = `${userData.user.id}/edited/${crypto.randomUUID()}.png`
    const resultUpload = await supabase.storage.from('images').upload(resultPath, resultBuffer, { contentType: 'image/png', upsert: false })
    if (resultUpload.error) throw resultUpload.error
    const { data: resultPublic } = supabase.storage.from('images').getPublicUrl(resultPath)
    const { data: resultImage, error: imageError } = await supabase.from('images').insert({
      user_id: userData.user.id,
      project_id: image.project_id,
      parent_image_id: image.id,
      title: `${image.title || '無題'} の修正版`,
      image_url: resultPublic.publicUrl,
      thumbnail_url: resultPublic.publicUrl,
      source_type: 'edited',
      prompt_ja: `${image.prompt_ja || ''}\n\n修正指示: ${body.instruction}`,
      prompt_en: instructionEn,
      purpose: image.purpose,
      output_type: image.output_type,
      style_preset: image.style_preset,
      tags: image.tags,
      width: image.width,
      height: image.height,
    }).select('*').single()
    if (imageError) throw imageError
    const { error: editError } = await supabase.from('edit_requests').insert({
      user_id: userData.user.id,
      image_id: image.id,
      paint_overlay_url: overlayPublic.publicUrl,
      mask_url: maskPublic.publicUrl,
      instruction: body.instruction,
      instruction_en: instructionEn,
      result_image_id: resultImage.id,
    })
    if (editError) throw editError
    return NextResponse.json({ image: resultImage })
  } catch (error) {
    console.error('edit-image failed', error)
    return NextResponse.json({ error: '画像編集または保存に失敗しました。マスク・設定・ログを確認してください。' }, { status: 500 })
  }
}
