// Re-export everything from the canonical schema file.
// Import from '@/schemas/profile' directly for schema access.
export type {
  ContactInfo,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  SkillsEntry,
  CertificationEntry,
  AwardEntry,
  ProfileData,
  ProfileDataApi,
} from '@/schemas/profile'
export type {SectionType} from '@/schemas/section'