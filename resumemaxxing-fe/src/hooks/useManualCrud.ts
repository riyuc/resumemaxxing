import { useState, useCallback } from 'react'
import type {
  ProfileData,
  SectionType,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  SkillsEntry,
} from '@/types/profile'

export type DraftEntry =
  | { sectionType: 'education'; id: string | null; data: Omit<EducationEntry, 'id'> }
  | { sectionType: 'experience'; id: string | null; data: Omit<ExperienceEntry, 'id'> }
  | { sectionType: 'projects'; id: string | null; data: Omit<ProjectEntry, 'id'> }
  | { sectionType: 'skills'; id: string | null; data: Omit<SkillsEntry, 'id'> }

export function useManualCrud(
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>,
  setSections: React.Dispatch<React.SetStateAction<SectionType[]>>
) {
  const [addingIn, setAddingIn] = useState<SectionType | null>(null)
  const [editingEntry, setEditingEntry] = useState<{ type: SectionType; id: string } | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [draftEntry, setDraftEntry] = useState<DraftEntry | null>(null)

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }, [])

  const addEducation = useCallback(
    (entry: Omit<EducationEntry, 'id'>) => {
      setDraftEntry(null)
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
      setDraftEntry(null)
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
      setDraftEntry(null)
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
      setDraftEntry(null)
      if (editingEntry?.type === 'skills') {
        setProfile((p) => ({
          ...p,
          skills: p.skills.map((e) => (e.id === editingEntry.id ? { ...entry, id: e.id } : e)),
        }))
        setEditingEntry(null)
      } else {
        const id = crypto.randomUUID()
        setProfile((p) => ({ ...p, skills: [...p.skills, { ...entry, id }] }))
        setAddingIn(null)
      }
    },
    [editingEntry, setProfile]
  )

  const deleteEducation = useCallback(
    (id: string) =>
      setProfile((p) => ({ ...p, education: p.education.filter((e) => e.id !== id) })),
    [setProfile]
  )
  const deleteExperience = useCallback(
    (id: string) =>
      setProfile((p) => ({ ...p, experience: p.experience.filter((e) => e.id !== id) })),
    [setProfile]
  )
  const deleteProject = useCallback(
    (id: string) => setProfile((p) => ({ ...p, projects: p.projects.filter((e) => e.id !== id) })),
    [setProfile]
  )
  const deleteSkill = useCallback(
    (id: string) => setProfile((p) => ({ ...p, skills: p.skills.filter((e) => e.id !== id) })),
    [setProfile]
  )

  const removeSection = useCallback(
    (type: SectionType) => {
      setSections((prev) => prev.filter((s) => s !== type))
      setProfile((p) => ({ ...p, [type]: [] }))
      if (addingIn === type) setAddingIn(null)
    },
    [addingIn, setProfile, setSections]
  )

  return {
    addingIn,
    setAddingIn,
    editingEntry,
    setEditingEntry,
    expandedIds,
    setExpandedIds,
    draftEntry,
    setDraftEntry,
    toggleExpand,
    addEducation,
    addExperience,
    addProject,
    addSkill,
    deleteEducation,
    deleteExperience,
    deleteProject,
    deleteSkill,
    removeSection,
  }
}
