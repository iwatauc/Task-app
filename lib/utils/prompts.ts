import type { GenerateFormPayload } from '@/lib/types'

const purposeHints: Record<string, string> = {
  下絵: 'rough drawing guide for artists',
  構図参考: 'composition reference',
  ポーズ参考: 'pose reference with clear body structure',
  線画参考: 'clean line-art oriented reference',
  色ラフ: 'simple color rough',
  背景ラフ: 'background rough concept',
  衣装案: 'costume design reference',
}

export function buildImagePrompt(input: GenerateFormPayload) {
  const purpose = purposeHints[input.purpose] ?? input.purpose
  const avoid = input.avoid?.trim() || 'extra text, watermark, logo, over-rendered details, confusing fingers, broken anatomy'

  return [
    `Create an image for an illustrator to use as ${purpose}, not as a final polished artwork.`,
    `Character: ${input.character || 'not specified'}.`,
    `Pose: ${input.pose || 'clear readable pose'}.`,
    `Composition: ${input.composition || 'simple readable composition with clear silhouette and center of gravity'}.`,
    `Output type: ${input.outputType || 'rough sketch reference'}.`,
    input.stylePreset ? `General style direction: ${input.stylePreset}. Avoid imitating a living artist or a specific copyrighted work.` : 'General style: neutral modern illustration reference, not imitating any specific artist.',
    'Prioritize readable construction lines, silhouette, perspective, gesture, limb placement, hand and finger clarity, clothing flow, and reusable reference value.',
    'Keep backgrounds simple unless the request is specifically about background. Do not add unnecessary decorations.',
    `Avoid: ${avoid}.`,
  ].join('\n')
}

export function buildJapanesePromptSummary(input: GenerateFormPayload) {
  return [
    `目的: ${input.purpose}`,
    `キャラ説明: ${input.character}`,
    `ポーズ: ${input.pose}`,
    `構図: ${input.composition}`,
    `出力タイプ: ${input.outputType}`,
    `避けたいこと: ${input.avoid}`,
    `画面比率: ${input.aspectRatio}`,
    input.stylePreset ? `プリセット: ${input.stylePreset}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildEditPrompt(instructionJa: string, purpose?: string | null) {
  return [
    'Edit only the masked red-painted area of the input image as much as possible while preserving the unmasked area, composition, pose, camera angle, and overall rough-reference purpose.',
    `Artist reference purpose: ${purpose || 'rough drawing / illustration reference'}.`,
    `Requested change: ${instructionJa}`,
    'Make the result useful as a drawing under-sketch, composition reference, pose reference, line-art reference, or color rough. Improve anatomy, hands, fingers, face, perspective, clothing flow, silhouette, and readability when relevant.',
    'Do not add text, watermark, logo, or unnecessary decorative elements. Do not imitate a specific living artist or copyrighted work.',
  ].join('\n')
}

export function parseTags(value: string) {
  return value
    .split(/[、,\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
}
