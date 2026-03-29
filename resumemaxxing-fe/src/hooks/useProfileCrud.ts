import { useState, useCallback } from 'react'
import type {
  ProfileData,
  SectionType,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  SkillsEntry,
  CertificationEntry,
  AwardEntry,
} from '@/types/profile'

export type SaveHandlers = {
  education: (e: Omit<EducationEntry, 'id'>) => void
  experience: (e: Omit<ExperienceEntry, 'id'>) => void
  projects: (e: Omit<ProjectEntry, 'id'>) => void
  skills: (e: Omit<SkillsEntry, 'id'>) => void
  research: (e: Omit<ExperienceEntry, 'id'>) => void
  leadership: (e: Omit<ExperienceEntry, 'id'>) => void
  volunteering: (e: Omit<ExperienceEntry, 'id'>) => void
  certifications: (e: Omit<CertificationEntry, 'id'>) => void
  awards: (e: Omit<AwardEntry, 'id'>) => void
}

export function useProfileCrud(
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>,
  setSections: React.Dispatch<React.SetStateAction<SectionType[]>>
) {
  const [addingIn, setAddingIn] = useState<SectionType | null>(null)
  const [editingEntry, setEditingEntry] = useState<{ type: SectionType; id: string } | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleEntryExpand = (id: string) =>
    setExpandedIds((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const deleteEntry = useCallback(
    (type: SectionType, id: string) => {
      setProfile((p) => ({
        ...p,
        [type]: (p[type] as Array<{ id: string }>).filter((e) => e.id !== id),
      }))
    },
    [setProfile]
  )

  const removeSection = useCallback(
    (type: SectionType) => {
      setSections((prev) => prev.filter((s) => s !== type))
      setProfile((p) => ({ ...p, [type]: [] }))
      setAddingIn((prev) => (prev === type ? null : prev))
    },
    [setProfile, setSections]
  )

  const addEducation = useCallback(
    (entry: Omit<EducationEntry, 'id'>) => {
      if (editingEntry?.type === 'education') {
        setProfile((p) => ({
          ...p,
          education: p.education.map((e) =>
            e.id === editingEntry.id ? { ...entry, id: e.id } : e
          ),
        }))
        setEditingEntry(null)
      } else {
        const id = crypto.randomUUID()
        setProfile((p) => ({ ...p, education: [...p.education, { ...entry, id }] }))
        setExpandedIds((prev) => new Set(prev).add(id))
        setAddingIn(null)
      }
    },
    [editingEntry, setProfile]
  )

  const addExperience = useCallback(
    (entry: Omit<ExperienceEntry, 'id'>) => {
      if (editingEntry?.type === 'experience') {
        setProfile((p) => ({
          ...p,
          experience: p.experience.map((e) =>
            e.id === editingEntry.id ? { ...entry, id: e.id } : e
          ),
        }))
        setEditingEntry(null)
      } else {
        const id = crypto.randomUUID()
        setProfile((p) => ({ ...p, experience: [...p.experience, { ...entry, id }] }))
        setExpandedIds((prev) => new Set(prev).add(id))
        setAddingIn(null)
      }
    },
    [editingEntry, setProfile]
  )

  const addProject = useCallback(
    (entry: Omit<ProjectEntry, 'id'>) => {
      if (editingEntry?.type === 'projects') {
        setProfile((p) => ({
          ...p,
          projects: p.projects.map((e) => (e.id === editingEntry.id ? { ...entry, id: e.id } : e)),
        }))
        setEditingEntry(null)
      } else {
        const id = crypto.randomUUID()
        setProfile((p) => ({ ...p, projects: [...p.projects, { ...entry, id }] }))
        setExpandedIds((prev) => new Set(prev).add(id))
        setAddingIn(null)
      }
    },
    [editingEntry, setProfile]
  )

  const addSkill = useCallback(
    (entry: Omit<SkillsEntry, 'id'>) => {
      if (editingEntry?.type === 'skills') {
        setProfile((p) => ({
          ...p,
          skills: p.skills.map((e) => (e.id === editingEntry.id ? { ...entry, id: e.id } : e)),
        }))
        setEditingEntry(null)
      } else {
        setProfile((p) => ({ ...p, skills: [...p.skills, { ...entry, id: crypto.randomUUID() }] }))
        setAddingIn(null)
      }
    },
    [editingEntry, setProfile]
  )

  const makeExpHandler = useCallback(
    (key: 'research' | 'leadership' | 'volunteering') => (entry: Omit<ExperienceEntry, 'id'>) => {
      if (editingEntry?.type === key) {
        setProfile((p) => ({
          ...p,
          [key]: (p[key] as ExperienceEntry[]).map((e) =>
            e.id === editingEntry.id ? { ...entry, id: e.id } : e
          ),
        }))
        setEditingEntry(null)
      } else {
        const id = crypto.randomUUID()
        setProfile((p) => ({ ...p, [key]: [...(p[key] as ExperienceEntry[]), { ...entry, id }] }))
        setExpandedIds((prev) => new Set(prev).add(id))
        setAddingIn(null)
      }
    },
    [editingEntry, setProfile]
  )

  const addCertification = useCallback(
    (entry: Omit<CertificationEntry, 'id'>) => {
      if (editingEntry?.type === 'certifications') {
        setProfile((p) => ({
          ...p,
          certifications: p.certifications.map((e) =>
            e.id === editingEntry.id ? { ...entry, id: e.id } : e
          ),
        }))
        setEditingEntry(null)
      } else {
        const id = crypto.randomUUID()
        setProfile((p) => ({ ...p, certifications: [...p.certifications, { ...entry, id }] }))
        setExpandedIds((prev) => new Set(prev).add(id))
        setAddingIn(null)
      }
    },
    [editingEntry, setProfile]
  )

  const addAward = useCallback(
    (entry: Omit<AwardEntry, 'id'>) => {
      if (editingEntry?.type === 'awards') {
        setProfile((p) => ({
          ...p,
          awards: p.awards.map((e) => (e.id === editingEntry.id ? { ...entry, id: e.id } : e)),
        }))
        setEditingEntry(null)
      } else {
        const id = crypto.randomUUID()
        setProfile((p) => ({ ...p, awards: [...p.awards, { ...entry, id }] }))
        setExpandedIds((prev) => new Set(prev).add(id))
        setAddingIn(null)
      }
    },
    [editingEntry, setProfile]
  )

  const saveHandlers: SaveHandlers = {
    education: addEducation,
    experience: addExperience,
    projects: addProject,
    skills: addSkill,
    research: makeExpHandler('research'),
    leadership: makeExpHandler('leadership'),
    volunteering: makeExpHandler('volunteering'),
    certifications: addCertification,
    awards: addAward,
  }

  return {
    addingIn,
    setAddingIn,
    editingEntry,
    setEditingEntry,
    expandedIds,
    toggleEntryExpand,
    deleteEntry,
    removeSection,
    saveHandlers,
  }
}
