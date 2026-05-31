export type SourceType = 'generated' | 'uploaded' | 'edited'

export type Project = {
  id: string
  user_id: string
  title: string
  description: string | null
  created_at: string
  updated_at: string
}

export type AppImage = {
  id: string
  user_id: string
  project_id: string | null
  parent_image_id: string | null
  title: string | null
  image_url: string
  thumbnail_url: string | null
  source_type: SourceType
  prompt_ja: string | null
  prompt_en: string | null
  purpose: string | null
  output_type: string | null
  style_preset: string | null
  tags: string[] | null
  favorite: boolean
  width: number | null
  height: number | null
  created_at: string
  updated_at: string
}

export type EditRequest = {
  id: string
  user_id: string
  image_id: string
  paint_overlay_url: string | null
  mask_url: string
  instruction: string
  instruction_en: string | null
  result_image_id: string | null
  created_at: string
}

export type PromptPreset = {
  id: string
  user_id: string
  name: string
  category: string
  prompt_ja: string
  prompt_en: string | null
  negative_notes: string | null
  created_at: string
  updated_at: string
}

export type GenerateFormPayload = {
  purpose: string
  character: string
  pose: string
  composition: string
  outputType: string
  avoid: string
  aspectRatio: '1:1' | '4:3' | '3:4' | '16:9' | '9:16'
  tags: string
  title: string
  stylePreset: string
  projectId?: string
}
