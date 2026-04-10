export interface GuidelinePack {
  id: string
  label: string
  description: string
  rules: string
}

import amazonRecruiter from './amazon-recruiter'
import studentForum from './student-forum'

export const GUIDELINE_REGISTRY: Record<string, GuidelinePack> = {
  'amazon-recruiter': amazonRecruiter,
  'student-forum': studentForum,
}

export function resolveGuidelines(ids: string[]): string {
  if (ids.length === 0) return ''
  const packs = ids
    .map((id) => GUIDELINE_REGISTRY[id])
    .filter(Boolean)
  if (packs.length === 0) return ''
  return '\n\n' + packs.map((p) => p.rules).join('\n\n')
}
