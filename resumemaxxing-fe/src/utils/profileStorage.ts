import type { ProfileData } from '@/types/profile'
import type { SectionType } from '@/types/profile'
import type { FreeBlock } from '@/types/canvas'
import {
  STORAGE_KEY, SECTIONS_KEY, POSITIONS_KEY, BLOCKS_KEY,
  DEFAULT_PROFILE, DEFAULT_POSITIONS, ALL_SECTION_TYPES,
} from '@/constants/profileCanvas'

export function loadProfile(): ProfileData {
  try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : DEFAULT_PROFILE }
  catch { return DEFAULT_PROFILE }
}

export function loadSections(): SectionType[] {
  try { const s = localStorage.getItem(SECTIONS_KEY); return s ? JSON.parse(s) : [] }
  catch { return [] }
}

export function loadPositions(): Record<SectionType, { x: number; y: number }> {
  try { const s = localStorage.getItem(POSITIONS_KEY); return s ? { ...DEFAULT_POSITIONS, ...JSON.parse(s) } : DEFAULT_POSITIONS }
  catch { return DEFAULT_POSITIONS }
}

export function loadFreeBlocks(): FreeBlock[] {
  try { const s = localStorage.getItem(BLOCKS_KEY); return s ? JSON.parse(s) : [] }
  catch { return [] }
}

export function sectionsFromData(data: ProfileData): SectionType[] {
  return ALL_SECTION_TYPES.filter(s => (data[s] as unknown[]).length > 0)
}
