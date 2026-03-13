import type { ProfileData } from '@/types/profile'

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json()

  // Claude returns the shape without id / rawText — add them here
  return {
    contact: {
      name:      data.contact?.name      ?? '',
      phone:     data.contact?.phone     ?? '',
      email:     data.contact?.email     ?? '',
      linkedin:  data.contact?.linkedin  ?? '',
      github:    data.contact?.github    ?? '',
      portfolio: data.contact?.portfolio ?? '',
    },
    education: (data.education ?? []).map((e: any) => ({
      id: crypto.randomUUID(), rawText: '',
      school:     e.school     ?? '',
      location:   e.location   ?? '',
      degree:     e.degree     ?? '',
      dates:      e.dates      ?? '',
      coursework: e.coursework ?? '',
    })),
    experience: (data.experience ?? []).map((e: any) => ({
      id: crypto.randomUUID(), rawText: '',
      company:  e.company  ?? '',
      location: e.location ?? '',
      role:     e.role     ?? '',
      dates:    e.dates    ?? '',
      bullets:  Array.isArray(e.bullets) ? e.bullets : [],
    })),
    projects: (data.projects ?? []).map((e: any) => ({
      id: crypto.randomUUID(), rawText: '',
      name:      e.name      ?? '',
      techStack: e.techStack ?? '',
      dates:     e.dates     ?? '',
      bullets:   Array.isArray(e.bullets) ? e.bullets : [],
    })),
    skills: (data.skills ?? []).map((e: any) => ({
      id: crypto.randomUUID(),
      category:     e.category     ?? '',
      technologies: e.technologies ?? '',
    })),
  }
}
