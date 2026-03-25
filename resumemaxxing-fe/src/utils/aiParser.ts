import { ProfileDataApiSchema } from '@/schemas/profile'
import type { ProfileData } from '@/schemas/profile'

const BE_URL = import.meta.env.VITE_BE_URL ?? 'http://localhost:3000'

/**
 * Send raw resume text (LaTeX, PDF text, plain text) to the BE,
 * which runs it through Claude to extract structured ProfileData.
 * Returns a fully hydrated ProfileData with generated IDs and empty rawText fields.
 */
export async function parseResumeWithAI(text: string): Promise<ProfileData> {
  const res = await fetch(`${BE_URL}/parse-resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  if (!res.ok) throw new Error(`Parse failed: ${res.status} ${res.statusText}`)

  const raw = ProfileDataApiSchema.parse(await res.json())

  return {
    contact: raw.contact,
    education:  raw.education.map(e  => ({ ...e,  id: crypto.randomUUID(), rawText: '' })),
    experience: raw.experience.map(e => ({ ...e,  id: crypto.randomUUID(), rawText: '' })),
    projects:   raw.projects.map(e   => ({ ...e,  id: crypto.randomUUID(), rawText: '' })),
    skills:     raw.skills.map(e     => ({ ...e,  id: crypto.randomUUID() })),
  }
}
