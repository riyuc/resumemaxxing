export interface ContactInfo {
  name: string
  phone: string
  email: string
  linkedin: string
  github: string
  portfolio: string
}

export interface EducationEntry {
  id: string
  school: string
  location: string
  degree: string
  dates: string
  coursework: string
  rawText: string
}

export interface ExperienceEntry {
  id: string
  company: string
  location: string
  role: string
  dates: string
  bullets: string[]
  rawText: string
}

export interface ProjectEntry {
  id: string
  name: string
  techStack: string
  dates: string
  bullets: string[]
  rawText: string
}

export interface SkillsEntry {
  id: string
  category: string
  technologies: string
}

export interface ProfileData {
  contact: ContactInfo
  education: EducationEntry[]
  experience: ExperienceEntry[]
  projects: ProjectEntry[]
  skills: SkillsEntry[]
}

export type SectionType = 'education' | 'experience' | 'projects' | 'skills'
