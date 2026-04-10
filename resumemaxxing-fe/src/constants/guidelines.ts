export interface GuidelineMeta {
  id: string
  label: string
  description: string
}

export const GUIDELINES: GuidelineMeta[] = [
  {
    id: 'amazon-recruiter',
    label: 'Amazon Recruiter',
    description:
      'GPA thresholds, coursework, quantification rules from an Amazon technical recruiter',
  },
  {
    id: 'student-forum',
    label: "Jake's Resume",
    description:
      'X-Y-Z bullet formula, ATS keywords, single-page rules from CS student communities',
  },
]
