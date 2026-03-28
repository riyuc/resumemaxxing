import { z } from 'zod'
import { ProfileDataSchema } from '@/schemas/profile'

// ─── free block ───────────────────────────────────────────────────────────────

export const FreeBlockSchema = z.object({
  id: z.string(),
  type: z.enum(['note', 'link', 'image']),
  x: z.number(),
  y: z.number(),
  content: z.string().optional(),
  url: z.string().optional(),
  linkTitle: z.string().optional(),
  linkDesc: z.string().optional(),
  src: z.string().optional(),
  caption: z.string().optional(),
})

// ─── section position ─────────────────────────────────────────────────────────

const PositionSchema = z.object({ x: z.number(), y: z.number() })

const SectionTypeSchema = z.enum([
  'education',
  'experience',
  'projects',
  'skills',
  'research',
  'leadership',
  'volunteering',
  'certifications',
  'awards',
])

// ─── versioned backup ─────────────────────────────────────────────────────────
// Adding a version field lets us detect + migrate old backups gracefully.
// v1 → current shape. Bump version whenever the schema has a breaking change.

export const CanvasBackupV1Schema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  profile: ProfileDataSchema,
  sections: z.array(SectionTypeSchema),
  positions: z.record(SectionTypeSchema, PositionSchema),
  blocks: z.array(FreeBlockSchema).default([]),
})

// Union for forwards-compatible parsing (add new versions here as z.union members)
export const CanvasBackupSchema = CanvasBackupV1Schema

export type CanvasBackup = z.infer<typeof CanvasBackupSchema>
export type FreeBlockSchema_ = z.infer<typeof FreeBlockSchema>
