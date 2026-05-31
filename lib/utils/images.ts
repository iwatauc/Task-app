export function aspectRatioToOpenAiSize(aspectRatio: string) {
  if (aspectRatio === '16:9' || aspectRatio === '4:3') return '1536x1024'
  if (aspectRatio === '9:16' || aspectRatio === '3:4') return '1024x1536'
  return '1024x1024'
}

export function dataUrlToBlob(dataUrl: string) {
  const [meta, base64] = dataUrl.split(',')
  const mime = meta.match(/data:(.*);base64/)?.[1] ?? 'image/png'
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
  return new Blob([bytes], { type: mime })
}

export function fileExtFromMime(mime: string) {
  if (mime.includes('jpeg')) return 'jpg'
  if (mime.includes('webp')) return 'webp'
  return 'png'
}
