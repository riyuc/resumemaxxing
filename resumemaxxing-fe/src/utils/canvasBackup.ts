import { CanvasBackupSchema, type CanvasBackup } from '@/schemas/canvasBackup'
import { downloadFile } from '@/utils/profileExport'
import type { ProfileData, SectionType } from '@/types/profile'
import type { FreeBlock } from '@/types/canvas'

// ─── export ───────────────────────────────────────────────────────────────────

export function buildCanvasBackup(
  profile: ProfileData,
  sections: SectionType[],
  positions: Record<SectionType, { x: number; y: number }>,
  blocks: FreeBlock[]
): CanvasBackup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile,
    sections,
    positions,
    blocks,
  }
}

export function exportCanvas(
  profile: ProfileData,
  sections: SectionType[],
  positions: Record<SectionType, { x: number; y: number }>,
  blocks: FreeBlock[]
): void {
  const backup = buildCanvasBackup(profile, sections, positions, blocks)
  const json = JSON.stringify(backup, null, 2)
  const name = profile.contact.name?.trim().replace(/\s+/g, '_') || 'canvas'
  downloadFile(json, `${name}_backup.json`, 'application/json')
}

// ─── import ───────────────────────────────────────────────────────────────────

export type ImportResult = { ok: true; data: CanvasBackup } | { ok: false; error: string }

export function importCanvas(raw: unknown): ImportResult {
  // Basic sanity check before Zod parse
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'File is not a valid JSON object.' }
  }

  const obj = raw as Record<string, unknown>

  // Version gate — gives a clear message for future versions we don't support yet
  if (obj.version !== 1) {
    return {
      ok: false,
      error: obj.version
        ? `Unsupported backup version (v${obj.version}). Please update the app.`
        : 'Missing version field — this file may be corrupted.',
    }
  }

  const result = CanvasBackupSchema.safeParse(raw)

  if (!result.success) {
    const first = result.error.issues[0]
    const path = first.path.join('.') || 'root'
    return { ok: false, error: `Invalid backup at "${path}": ${first.message}` }
  }

  return { ok: true, data: result.data }
}

// ─── file picker helper ───────────────────────────────────────────────────────

export function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        resolve(JSON.parse(e.target?.result as string))
      } catch {
        reject(new Error('File is not valid JSON.'))
      }
    }
    reader.onerror = () => reject(new Error('Could not read file.'))
    reader.readAsText(file)
  })
}
