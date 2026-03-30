import {
  GraduationCap,
  Briefcase,
  Code2,
  Wrench,
  FlaskConical,
  Users,
  Heart,
  BadgeCheck,
  Trophy,
  StickyNote,
  Link2,
  ImageIcon,
} from 'lucide-react'
import React from 'react'
import type { SectionType } from '@/types/profile'
import type { FreeBlockType } from '@/types/canvas'
import type { ProfileData } from '@/types/profile'

export const STORAGE_KEY = 'agentic-resume-profile'
export const SECTIONS_KEY = 'agentic-resume-sections'
export const POSITIONS_KEY = 'agentic-resume-positions'
export const BLOCKS_KEY = 'agentic-resume-blocks'

export const SECTION_META: Record<
  SectionType,
  {
    label: string
    icon: React.ReactNode
    placeholder: string
    description: string
    color: string
  }
> = {
  education: {
    label: 'EDUCATION',
    icon: React.createElement(GraduationCap, { size: 13 }),
    color: '#6ea8d0',
    description: 'Degrees, diplomas, coursework',
    placeholder: 'e.g. studied CS here, took AI/OS courses, 3.8 GPA...',
  },
  experience: {
    label: 'EXPERIENCE',
    icon: React.createElement(Briefcase, { size: 13 }),
    color: '#7ec8a0',
    description: 'Jobs, internships, co-ops',
    placeholder: 'e.g. worked on payments infra, improved success rates...',
  },
  projects: {
    label: 'PROJECTS',
    icon: React.createElement(Code2, { size: 13 }),
    color: '#c89a6e',
    description: 'Side projects, hackathons, open source',
    placeholder: 'e.g. built a RAG pipeline for X, demoed at hackathon...',
  },
  skills: {
    label: 'SKILLS',
    icon: React.createElement(Wrench, { size: 13 }),
    color: '#a07ec8',
    description: 'Languages, tools, frameworks',
    placeholder: '',
  },
  research: {
    label: 'RESEARCH',
    icon: React.createElement(FlaskConical, { size: 13 }),
    color: '#6ec8c8',
    description: 'Academic or industry research',
    placeholder: 'e.g. NLP for low-resource languages, published at ACL...',
  },
  leadership: {
    label: 'LEADERSHIP',
    icon: React.createElement(Users, { size: 13 }),
    color: '#d08080',
    description: 'Clubs, orgs, student government',
    placeholder: 'e.g. VP of the AI club, organized weekly workshops...',
  },
  volunteering: {
    label: 'VOLUNTEERING',
    icon: React.createElement(Heart, { size: 13 }),
    color: '#d06ea8',
    description: 'Community work, non-profits',
    placeholder: 'e.g. tutored underprivileged students every Saturday...',
  },
  certifications: {
    label: 'CERTIFICATIONS',
    icon: React.createElement(BadgeCheck, { size: 13 }),
    color: '#c8c86e',
    description: 'Certs, licenses, online courses',
    placeholder: 'e.g. completed while learning distributed systems...',
  },
  awards: {
    label: 'AWARDS',
    icon: React.createElement(Trophy, { size: 13 }),
    color: '#d0a06e',
    description: 'Scholarships, prizes, recognition',
    placeholder: 'e.g. won for building a sign language translator...',
  },
}

export const FREE_BLOCK_META: Record<
  FreeBlockType,
  {
    label: string
    icon: React.ReactNode
    description: string
    color: string
  }
> = {
  note: {
    label: 'NOTE',
    icon: React.createElement(StickyNote, { size: 13 }),
    description: 'Freeform sticky note',
    color: '#e8c86e',
  },
  link: {
    label: 'LINK',
    icon: React.createElement(Link2, { size: 13 }),
    description: 'URL card with title + desc',
    color: '#6ea8e8',
  },
  image: {
    label: 'IMAGE',
    icon: React.createElement(ImageIcon, { size: 13 }),
    description: 'Photo, screenshot, diagram',
    color: '#c86ea8',
  },
}

export const ALL_SECTION_TYPES: SectionType[] = [
  'education',
  'experience',
  'projects',
  'skills',
  'research',
  'leadership',
  'volunteering',
  'certifications',
  'awards',
]

export const DEFAULT_POSITIONS: Record<SectionType, { x: number; y: number }> = {
  education: { x: 60, y: 80 },
  experience: { x: 420, y: 80 },
  projects: { x: 780, y: 80 },
  skills: { x: 60, y: 460 },
  research: { x: 420, y: 460 },
  leadership: { x: 780, y: 460 },
  volunteering: { x: 60, y: 820 },
  certifications: { x: 420, y: 820 },
  awards: { x: 780, y: 820 },
}

export const DEFAULT_PROFILE: ProfileData = {
  contact: { name: '', phone: '', email: '', linkedin: '', github: '', portfolio: '' },
  education: [],
  experience: [],
  projects: [],
  skills: [],
  research: [],
  leadership: [],
  volunteering: [],
  certifications: [],
  awards: [],
}
