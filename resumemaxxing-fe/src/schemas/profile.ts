import { z } from 'zod'

// ─── entry schemas (as returned by the API — no id/rawText) ───────────────────

export const ContactSchema = z.object({
  name: z.string().default(''),
  phone: z.string().default(''),
  email: z.string().default(''),
  linkedin: z.string().default(''),
  github: z.string().default(''),
  portfolio: z.string().default(''),
})

export const EducationEntryApiSchema = z.object({
  school: z.string().default(''),
  location: z.string().default(''),
  degree: z.string().default(''),
  dates: z.string().default(''),
  coursework: z.string().default(''),
})

export const ExperienceEntryApiSchema = z.object({
  company: z.string().default(''),
  location: z.string().default(''),
  role: z.string().default(''),
  dates: z.string().default(''),
  bullets: z.array(z.string()).default([]),
})

export const ProjectEntryApiSchema = z.object({
  name: z.string().default(''),
  techStack: z.string().default(''),
  dates: z.string().default(''),
  bullets: z.array(z.string()).default([]),
})

export const SkillsEntryApiSchema = z.object({
  category: z.string().default(''),
  technologies: z.string().default(''),
})

// API response shape (no client-only fields)
export const ProfileDataApiSchema = z.object({
  contact: ContactSchema,
  education: z.array(EducationEntryApiSchema).default([]),
  experience: z.array(ExperienceEntryApiSchema).default([]),
  projects: z.array(ProjectEntryApiSchema).default([]),
  skills: z.array(SkillsEntryApiSchema).default([]),
})

// ─── full client schemas (with id + rawText) ──────────────────────────────────

export const EducationEntrySchema = EducationEntryApiSchema.extend({
  id: z.string(),
  rawText: z.string().default(''),
})

export const ExperienceEntrySchema = ExperienceEntryApiSchema.extend({
  id: z.string(),
  rawText: z.string().default(''),
})

export const ProjectEntrySchema = ProjectEntryApiSchema.extend({
  id: z.string(),
  rawText: z.string().default(''),
})

export const SkillsEntrySchema = SkillsEntryApiSchema.extend({
  id: z.string(),
})

// research / leadership / volunteering share ExperienceEntry shape

export const CertificationEntrySchema = z.object({
  id: z.string(),
  title: z.string().default(''),
  issuer: z.string().default(''),
  date: z.string().default(''),
  rawText: z.string().default(''),
})

export const AwardEntrySchema = z.object({
  id: z.string(),
  title: z.string().default(''),
  issuer: z.string().default(''),
  date: z.string().default(''),
  description: z.string().default(''),
})

export const ProfileDataSchema = z.object({
  contact: ContactSchema,
  education: z.array(EducationEntrySchema).default([]),
  experience: z.array(ExperienceEntrySchema).default([]),
  projects: z.array(ProjectEntrySchema).default([]),
  skills: z.array(SkillsEntrySchema).default([]),
  research: z.array(ExperienceEntrySchema).default([]),
  leadership: z.array(ExperienceEntrySchema).default([]),
  volunteering: z.array(ExperienceEntrySchema).default([]),
  certifications: z.array(CertificationEntrySchema).default([]),
  awards: z.array(AwardEntrySchema).default([]),
})

// ─── inferred types ───────────────────────────────────────────────────────────

export type ContactInfo = z.infer<typeof ContactSchema>
export type EducationEntry = z.infer<typeof EducationEntrySchema>
export type ExperienceEntry = z.infer<typeof ExperienceEntrySchema>
export type ProjectEntry = z.infer<typeof ProjectEntrySchema>
export type SkillsEntry = z.infer<typeof SkillsEntrySchema>
export type CertificationEntry = z.infer<typeof CertificationEntrySchema>
export type AwardEntry = z.infer<typeof AwardEntrySchema>
export type ProfileData = z.infer<typeof ProfileDataSchema>
export type ProfileDataApi = z.infer<typeof ProfileDataApiSchema>
