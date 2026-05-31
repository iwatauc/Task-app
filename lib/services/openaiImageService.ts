import { openaiApiKey, openaiImageModel } from '@/lib/env'

type GenerateArgs = { prompt: string; size: string; user?: string }
type EditArgs = { prompt: string; image: Blob; mask: Blob; size?: string; user?: string }

type ImageResponse = { data?: Array<{ b64_json?: string; url?: string }> }

async function requestOpenAiImage(path: string, form: FormData): Promise<Buffer> {
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const response = await fetch(`https://api.openai.com/v1/images/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiApiKey}` },
    body: form,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`OpenAI image API error: ${response.status} ${message}`)
  }

  const json = (await response.json()) as ImageResponse
  const first = json.data?.[0]
  if (first?.b64_json) return Buffer.from(first.b64_json, 'base64')
  if (first?.url) {
    const imageResponse = await fetch(first.url)
    if (!imageResponse.ok) throw new Error('Failed to download generated image URL')
    return Buffer.from(await imageResponse.arrayBuffer())
  }
  throw new Error('OpenAI image API returned no image data')
}

export async function generateImage({ prompt, size, user }: GenerateArgs) {
  const form = new FormData()
  form.set('model', openaiImageModel)
  form.set('prompt', prompt)
  form.set('n', '1')
  form.set('size', size)
  form.set('quality', 'medium')
  form.set('output_format', 'png')
  if (user) form.set('user', user)
  return requestOpenAiImage('generations', form)
}

export async function editImage({ prompt, image, mask, size = '1024x1024', user }: EditArgs) {
  const form = new FormData()
  form.set('model', openaiImageModel)
  form.set('prompt', prompt)
  form.set('image', image, 'source.png')
  form.set('mask', mask, 'mask.png')
  form.set('n', '1')
  form.set('size', size)
  form.set('quality', 'medium')
  form.set('output_format', 'png')
  if (user) form.set('user', user)
  return requestOpenAiImage('edits', form)
}
