import { ProfileDataApiSchema } from '@/schemas/profile'
import type { ProfileData, ProfileDataApi } from '@/schemas/profile'

const BE_URL = import.meta.env.VITE_BE_URL ?? 'http://localhost:3000'

function toApiProfile(p: ProfileData): ProfileDataApi {
  return {
    contact: p.contact,
    education: p.education.map(({ id: _id, rawText: _rt, ...rest }) => rest),
    experience: p.experience.map(({ id: _id, rawText: _rt, ...rest }) => rest),
    projects: p.projects.map(({ id: _id, rawText: _rt, ...rest }) => rest),
    skills: p.skills.map(({ id: _id, ...rest }) => rest),
  }
}

function hydrateApiProfile(raw: ProfileDataApi): ProfileData {
  return {
    contact: raw.contact,
    education: raw.education.map((e) => ({ ...e, id: crypto.randomUUID(), rawText: '' })),
    experience: raw.experience.map((e) => ({ ...e, id: crypto.randomUUID(), rawText: '' })),
    projects: raw.projects.map((e) => ({ ...e, id: crypto.randomUUID(), rawText: '' })),
    skills: raw.skills.map((e) => ({ ...e, id: crypto.randomUUID() })),
    research: [],
    leadership: [],
    volunteering: [],
    certifications: [],
    awards: [],
  }
}

/**
 * Send raw resume text (LaTeX, PDF text, plain text) to the BE,
 * which runs it through Claude to extract structured ProfileData.
 * Returns a fully hydrated ProfileData with generated IDs and empty rawText fields.
 */
export async function parseResumeWithAI(text: string): Promise<ProfileData> {
  const res = await fetch(`${BE_URL}/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  if (!res.ok) throw new Error(`Parse failed: ${res.status} ${res.statusText}`)

  const raw = ProfileDataApiSchema.parse(await res.json())
  return hydrateApiProfile(raw)
}

/**
 * Send full career profile + job description to the BE.
 * Claude selects, curates, and rewrites entries targeted to the JD.
 * Returns a fully hydrated ProfileData ready for preview.
 */
export async function generateResumeWithAI(
  profile: ProfileData,
  jobDescription: string,
  guidelineIds: string[] = []
): Promise<ProfileData> {
  const res = await fetch(`${BE_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile: toApiProfile(profile), jobDescription, guidelineIds }),
  })

  if (!res.ok) throw new Error(`Generate failed: ${res.status} ${res.statusText}`)

  const raw = ProfileDataApiSchema.parse(await res.json())
  return hydrateApiProfile(raw)
}

export { toApiProfile }
