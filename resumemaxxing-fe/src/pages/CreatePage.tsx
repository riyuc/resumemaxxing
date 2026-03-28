import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Plus,
  X,
  Trash2,
  Pencil,
  Check,
  GraduationCap,
  Briefcase,
  Code2,
  Wrench,
  User,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Upload,
  TerminalSquare,
  Download,
  FileText,
  Printer,
  PanelLeftOpen,
  SquarePen,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { parseResumeWithAI } from '@/utils/aiParser'
import {
  exportAsTex,
  exportAsMd,
  generateResumeHtml,
  printResumePdf,
  downloadFile,
  FONT_OPTIONS,
  DEFAULT_FORMAT,
} from '@/utils/profileExport'
import type {
  ProfileData,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  SkillsEntry,
  SectionType,
} from '@/types/profile'
import type { ResumeFormat } from '@/utils/profileExport'
import { cn } from '@/lib/utils'
import { DropdownBtn, DropItem } from '@/components/ui/dropdown-btn'
import { EducationForm } from '@/components/forms/EducationForm'
import { ExperienceForm } from '@/components/forms/ExperienceForm'
import { ProjectForm } from '@/components/forms/ProjectForm'
import { SkillsForm } from '@/components/forms/SkillsForm'
import { ProfileDataSchema } from '@/schemas/profile'

// ─── storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'agentic-resume-profile'
const SECTIONS_KEY = 'agentic-resume-sections'
const FORMAT_KEY = 'agentic-resume-format'

const DEFAULT_PROFILE: ProfileData = {
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

function loadProfile(): ProfileData {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    const result = ProfileDataSchema.safeParse(s ? JSON.parse(s) : null)
    return result.success ? result.data : DEFAULT_PROFILE
  } catch {
    return DEFAULT_PROFILE
  }
}

function loadSections(): SectionType[] {
  try {
    const s = localStorage.getItem(SECTIONS_KEY)
    return s ? JSON.parse(s) : []
  } catch {
    return []
  }
}

function loadFormat(): ResumeFormat {
  try {
    const s = localStorage.getItem(FORMAT_KEY)
    return s ? { ...DEFAULT_FORMAT, ...JSON.parse(s) } : DEFAULT_FORMAT
  } catch {
    return DEFAULT_FORMAT
  }
}

function sectionsFromData(data: ProfileData): SectionType[] {
  const out: SectionType[] = []
  if (data.education.length) out.push('education')
  if (data.experience.length) out.push('experience')
  if (data.projects.length) out.push('projects')
  if (data.skills.length) out.push('skills')
  return out
}

// ─── draft entry type (for live preview while typing) ─────────────────────────

type DraftEntry =
  | { sectionType: 'education'; id: string | null; data: Omit<EducationEntry, 'id'> }
  | { sectionType: 'experience'; id: string | null; data: Omit<ExperienceEntry, 'id'> }
  | { sectionType: 'projects'; id: string | null; data: Omit<ProjectEntry, 'id'> }
  | { sectionType: 'skills'; id: string | null; data: Omit<SkillsEntry, 'id'> }

// ─── edit-on-preview helpers ──────────────────────────────────────────────────

function applyFieldEdit(
  profile: ProfileData,
  rs: string,
  rid: string | null,
  rf: string,
  rbi: number | null,
  value: string
): ProfileData {
  if (rs === 'contact') return { ...profile, contact: { ...profile.contact, [rf]: value } }
  const key = rs as 'education' | 'experience' | 'projects' | 'skills'
  return {
    ...profile,
    [key]: (profile[key] as { id: string }[]).map((e) => {
      if (e.id !== rid) return e
      if (rf === 'bullet' && rbi != null) {
        const bullets = [...(e as unknown as { bullets: string[] }).bullets]
        bullets[rbi] = value
        return { ...e, bullets }
      }
      return { ...e, [rf]: value }
    }),
  }
}

// ─── constants ────────────────────────────────────────────────────────────────

const SECTION_META: Record<
  SectionType,
  { label: string; icon: React.ReactNode; placeholder: string }
> = {
  education: {
    label: 'EDUCATION',
    icon: <GraduationCap size={13} />,
    placeholder: 'e.g. studied CS here, took AI/OS courses, 3.8 GPA, was in the coding club...',
  },
  experience: {
    label: 'EXPERIENCE',
    icon: <Briefcase size={13} />,
    placeholder:
      'e.g. worked on payments infrastructure, improved success rates, led the migration from...',
  },
  projects: {
    label: 'PROJECTS',
    icon: <Code2 size={13} />,
    placeholder:
      'e.g. built a RAG pipeline for X, used embeddings + postgres, demoed at hackathon...',
  },
  skills: { label: 'SKILLS', icon: <Wrench size={13} />, placeholder: '' },
  research: {
    label: 'RESEARCH',
    icon: <GraduationCap size={13} />,
    placeholder: 'e.g. worked on NLP for low-resource languages, published at ACL...',
  },
  leadership: {
    label: 'LEADERSHIP',
    icon: <Briefcase size={13} />,
    placeholder: 'e.g. VP of the AI club, organized weekly workshops...',
  },
  volunteering: {
    label: 'VOLUNTEERING',
    icon: <Briefcase size={13} />,
    placeholder: 'e.g. tutored underprivileged students in math every Saturday...',
  },
  certifications: { label: 'CERTIFICATIONS', icon: <Wrench size={13} />, placeholder: '' },
  awards: { label: 'AWARDS', icon: <Wrench size={13} />, placeholder: '' },
}

// ─── atoms ────────────────────────────────────────────────────────────────────

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  mono = true,
  multiline = false,
  rows = 4,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
  multiline?: boolean
  rows?: number
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[10px] text-payne-gray tracking-widest uppercase">{label}</span>
    {multiline ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          'bg-[#060e20] border border-[#1e3a5f] rounded-lg p-3 text-xs text-porcelain',
          'placeholder:text-[#4a7090] focus:outline-none focus:border-payne-gray resize-none leading-relaxed',
          mono && 'font-jetbrains'
        )}
      />
    ) : (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'bg-[#060e20] border border-[#1e3a5f] rounded-lg p-3 text-xs text-porcelain',
          'placeholder:text-[#4a7090] focus:outline-none focus:border-payne-gray',
          mono && 'font-jetbrains'
        )}
      />
    )}
  </div>
)

const PillBtn = ({
  children,
  onClick,
  variant = 'default',
  className,
  type = 'button',
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'ghost' | 'danger' | 'accent'
  className?: string
  type?: 'button' | 'submit'
}) => (
  <button
    type={type}
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-jetbrains',
      'transition-all duration-150 cursor-pointer select-none',
      variant === 'default' &&
        'border border-payne-gray text-[#94a3b8] hover:border-[#6a8fa3] hover:text-porcelain',
      variant === 'accent' && 'bg-payne-gray text-white hover:bg-[#5a7d91]',
      variant === 'ghost' && 'text-payne-gray hover:text-porcelain',
      variant === 'danger' && 'text-[#ef4444]/60 hover:text-[#ef4444]',
      className
    )}
  >
    {children}
  </button>
)

// ─── entry forms (with onChange for live preview) ─────────────────────────────
const EntryCard = ({
  children,
  onEdit,
  onDelete,
  expanded,
  onToggle,
  isEditing,
}: {
  children: React.ReactNode
  onEdit: () => void
  onDelete: () => void
  expanded: boolean
  onToggle: () => void
  isEditing?: boolean
}) => (
  <div className="border border-[#1a3050] rounded-xl overflow-hidden bg-[#08132a]">
    <div
      className="flex items-start justify-between px-4 py-3 cursor-pointer hover:bg-[#0c1a38] transition-colors"
      onClick={onToggle}
    >
      <div className="flex-1 min-w-0">{children}</div>
      <div className="flex items-center gap-1 ml-3 shrink-0" onClick={(e) => e.stopPropagation()}>
        <PillBtn variant="ghost" onClick={onEdit}>
          {isEditing ? <X size={11} /> : <Pencil size={11} />}
        </PillBtn>
        <PillBtn variant="danger" onClick={onDelete}>
          <Trash2 size={11} />
        </PillBtn>
        <span className="text-[#4a7090] ml-1">
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
      </div>
    </div>
  </div>
)

// ─── format sidebar controls ──────────────────────────────────────────────────

const FormatSlider = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (v: number) => void
}) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between items-baseline">
      <span className="text-[11px] text-[#8aaac8] font-jetbrains">{label}</span>
      <span className="text-[11px] text-[#c8d8f0] font-jetbrains tabular-nums">
        {value}
        {unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 rounded-full appearance-none cursor-pointer bg-[#1a3050] accent-payne-gray"
    />
  </div>
)

// ─── resize handle ────────────────────────────────────────────────────────────

const MIN_LEFT = 280
const MAX_LEFT = 760

function useResize(initial: number) {
  const [width, setWidth] = useState(initial)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startW = useRef(initial)

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true
      startX.current = e.clientX
      startW.current = width
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [width]
  )

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      setWidth(Math.min(MAX_LEFT, Math.max(MIN_LEFT, startW.current + e.clientX - startX.current)))
    }
    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [])

  return { width, onMouseDown }
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function CreatePage() {
  const [profile, setProfile] = useState<ProfileData>(loadProfile)
  const [sections, setSections] = useState<SectionType[]>(() => {
    const stored = loadSections()
    return stored.length ? stored : sectionsFromData(loadProfile())
  })
  const [editingContact, setEditingContact] = useState(false)
  const [contactDraft, setContactDraft] = useState(profile.contact)
  const [showSectionPicker, setShowSectionPicker] = useState(false)
  const [addingIn, setAddingIn] = useState<SectionType | null>(null)
  const [editingEntry, setEditingEntry] = useState<{ type: SectionType; id: string } | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [pdfImporting, setPdfImporting] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [formatOpen, setFormatOpen] = useState(false)
  const [format, setFormat] = useState<ResumeFormat>(loadFormat)
  const [iframeEditing, setIframeEditing] = useState(false)
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false)
  const [pdfPreviewHtml, setPdfPreviewHtml] = useState('')
  const [contentHeight, setContentHeight] = useState(0)
  const [pdfPageCount, setPdfPageCount] = useState(1)

  // live preview draft — tracks what's currently being typed in open forms
  const [draftEntry, setDraftEntry] = useState<DraftEntry | null>(null)

  const texRef = useRef<HTMLInputElement>(null)
  const pdfRef = useRef<HTMLInputElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const pdfPreviewIfrRef = useRef<HTMLIFrameElement>(null)

  const { width: leftWidth, onMouseDown: onDividerMouseDown } = useResize(500)

  // ── derive live preview profile ──
  const previewProfile = useMemo<ProfileData>(() => {
    if (!draftEntry) return profile
    const { sectionType, id, data } = draftEntry
    if (id) {
      return {
        ...profile,
        [sectionType]: (profile[sectionType] as { id: string }[]).map((e) =>
          e.id === id ? { ...data, id } : e
        ),
      } as ProfileData
    }
    return {
      ...profile,
      [sectionType]: [...(profile[sectionType] as object[]), { ...data, id: '__draft__' }],
    } as ProfileData
  }, [profile, draftEntry])

  // ── sync preview HTML — instant, no debounce ──
  const [resumeHtml, setResumeHtml] = useState(() =>
    generateResumeHtml(loadProfile(), undefined, { format: loadFormat() })
  )
  useEffect(() => {
    const t = setTimeout(
      () => setResumeHtml(generateResumeHtml(previewProfile, undefined, { format })),
      120
    )
    return () => clearTimeout(t)
  }, [previewProfile, format])

  // persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }, [profile])
  useEffect(() => {
    localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections))
  }, [sections])
  useEffect(() => {
    localStorage.setItem(FORMAT_KEY, JSON.stringify(format))
  }, [format])

  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  // ── contact ──
  const saveContact = () => {
    setProfile((p) => ({ ...p, contact: contactDraft }))
    setEditingContact(false)
  }

  // also live-preview contact edits
  const livePreviewProfile = useMemo<ProfileData>(() => {
    if (!editingContact) return previewProfile
    return { ...previewProfile, contact: contactDraft }
  }, [previewProfile, editingContact, contactDraft])

  const [resumeHtmlFinal, setResumeHtmlFinal] = useState(resumeHtml)
  useEffect(() => {
    // Don't re-render the iframe while the user is actively typing in it
    if (iframeEditing) return
    const t = setTimeout(() => {
      setResumeHtmlFinal(
        generateResumeHtml(livePreviewProfile, undefined, { editable: editMode, format })
      )
    }, 120)
    return () => clearTimeout(t)
  }, [livePreviewProfile, editMode, iframeEditing, format])

  // ── sections ──
  const addSection = (type: SectionType) => {
    if (!sections.includes(type)) setSections((prev) => [...prev, type])
    setShowSectionPicker(false)
    setAddingIn(type)
  }
  const removeSection = (type: SectionType) => {
    setSections((prev) => prev.filter((s) => s !== type))
    setProfile((p) => ({ ...p, [type]: [] }))
    if (addingIn === type) setAddingIn(null)
  }
  const availableSections = (
    ['education', 'experience', 'projects', 'skills'] as SectionType[]
  ).filter((s) => !sections.includes(s))

  // ── CRUD ──
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
    [editingEntry]
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
    [editingEntry]
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
    [editingEntry]
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
    [editingEntry]
  )

  const deleteEducation = (id: string) =>
    setProfile((p) => ({ ...p, education: p.education.filter((e) => e.id !== id) }))
  const deleteExperience = (id: string) =>
    setProfile((p) => ({ ...p, experience: p.experience.filter((e) => e.id !== id) }))
  const deleteProject = (id: string) =>
    setProfile((p) => ({ ...p, projects: p.projects.filter((e) => e.id !== id) }))
  const deleteSkill = (id: string) =>
    setProfile((p) => ({ ...p, skills: p.skills.filter((e) => e.id !== id) }))

  // ── imports ──
  const handleTexImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfImporting(true)
    try {
      const text = await file.text()
      const parsed = await parseResumeWithAI(text)
      setProfile(parsed)
      const ns = sectionsFromData(parsed)
      setSections((prev) => {
        const m = [...prev]
        ns.forEach((s) => {
          if (!m.includes(s)) m.push(s)
        })
        return m
      })
      setImportStatus('success')
      setTimeout(() => setImportStatus('idle'), 3000)
    } catch (err) {
      console.error('TeX import failed:', err)
      setImportStatus('error')
      setTimeout(() => setImportStatus('idle'), 3000)
    } finally {
      setPdfImporting(false)
      e.target.value = ''
    }
  }

  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfImporting(true)
    try {
      const { extractTextFromPdf } = await import('@/utils/pdfParser')
      const text = await extractTextFromPdf(file)
      const parsed = await parseResumeWithAI(text)
      setProfile((prev) => ({
        ...prev,
        ...parsed,
        contact: { ...prev.contact, ...parsed.contact },
      }))
      const ns = sectionsFromData(parsed)
      setSections((prev) => {
        const m = [...prev]
        ns.forEach((s) => {
          if (!m.includes(s)) m.push(s)
        })
        return m
      })
      setImportStatus('success')
      setTimeout(() => setImportStatus('idle'), 3000)
    } catch (err) {
      console.error('PDF import failed:', err)
      setImportStatus('error')
      setTimeout(() => setImportStatus('idle'), 3000)
    } finally {
      setPdfImporting(false)
      e.target.value = ''
    }
  }

  const openPdfPreview = () => {
    setPdfPreviewHtml(generateResumeHtml(livePreviewProfile, undefined, { format }))
    setPdfPageCount(1)
    setPdfPreviewOpen(true)
  }

  const handlePdfPreviewLoad = useCallback(() => {
    const h = pdfPreviewIfrRef.current?.contentDocument?.body?.scrollHeight
    if (h && pdfPreviewIfrRef.current) {
      pdfPreviewIfrRef.current.style.height = `${h}px`
      setPdfPageCount(Math.max(1, Math.ceil(h / 1056)))
    }
  }, [])

  // ── exports ──
  const nameSlug = profile.contact.name?.replace(/\s+/g, '_') || 'resume'
  const handleExportTex = () =>
    downloadFile(exportAsTex(profile), `${nameSlug}_resume.tex`, 'text/plain')
  const handleExportMd = () =>
    downloadFile(exportAsMd(profile), `${nameSlug}_resume.md`, 'text/markdown')
  // Always print the clean (non-editable) version
  const handlePrint = () =>
    printResumePdf(generateResumeHtml(livePreviewProfile, undefined, { format }))

  // iframe auto-height + page count tracking
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const resize = () => {
      const h = iframe.contentDocument?.body?.scrollHeight
      if (h) {
        setContentHeight(h)
      }
    }
    iframe.addEventListener('load', resize)
    return () => iframe.removeEventListener('load', resize)
  }, [resumeHtmlFinal])

  // postMessage listener for contenteditable edit-on-preview + break-avoidance height updates
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // Break-avoidance script posts adjusted body height after inserting page spacers.
      // Handle regardless of editMode so pageCount stays accurate.
      if (e.data?.type === 'resume-height') {
        const h = e.data.height as number
        if (h > 0) setContentHeight(h)
        return
      }
      if (!editMode) return
      if (e.data?.type === 'resume-focus') {
        setIframeEditing(true)
        return
      }
      if (e.data?.type !== 'resume-input') return
      setIframeEditing(false)
      const { rf, rs, rid, rbi, value } = e.data
      // Sanitize innerHTML from contenteditable: keep only safe inline tags, strip the rest
      const sanitized = (value as string)
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<(?!\/?(?:b|i|u|strong|em)\b)[^>]*>/gi, '')
        .replace(/&nbsp;/gi, ' ')
        .trim()
      setProfile((p) => applyFieldEdit(p, rs, rid ?? null, rf, rbi ?? null, sanitized))
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [editMode])

  const eId = (type: SectionType) => (editingEntry?.type === type ? editingEntry?.id : null)

  const marginPx = Math.round(format.pageMargin * 96)
  const contentPerPage = 1056 - 2 * marginPx
  // contentHeight = body scrollHeight = marginPx (body top padding) + actual content
  const pageCount =
    contentHeight > 0 ? Math.max(1, Math.ceil((contentHeight - marginPx) / contentPerPage)) : 1

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
      {/* ══ LEFT PANEL (sidebar) ══ */}
      <div
        className="shrink-0 border-r border-[#0d1a2e] bg-[#030b18] overflow-hidden transition-[width] duration-0"
        style={{ width: sidebarOpen ? leftWidth : 46 }}
      >
        {sidebarOpen ? (
          <div className="overflow-y-auto h-full">
            <div className="px-5 py-5 flex flex-col gap-6">
              {/* header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs shrink-0">
                  <TerminalSquare size={13} className="text-payne-gray" />
                  <span className="text-payne-gray">~/</span>
                  <span className="text-[#c8d8f0]">profile</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <AnimatePresence>
                    {importStatus !== 'idle' && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          'text-[11px] font-jetbrains shrink-0',
                          importStatus === 'success' ? 'text-[#4ade80]' : 'text-[#ef4444]'
                        )}
                      >
                        {importStatus === 'success' ? '✓ imported' : '✗ error'}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {pdfImporting && (
                    <span className="text-[11px] text-[#4a7090] font-jetbrains animate-pulse">
                      parsing...
                    </span>
                  )}
                  <DropdownBtn label="import" icon={<Upload size={11} />} align="right">
                    <DropItem onClick={() => texRef.current?.click()}>
                      <FileText size={12} className="text-payne-gray" /> .tex file
                    </DropItem>
                    <DropItem onClick={() => pdfRef.current?.click()}>
                      <FileText size={12} className="text-payne-gray" /> .pdf file
                    </DropItem>
                    <DropItem onClick={() => pdfRef.current?.click()}>
                      <FileText size={12} className="text-payne-gray" /> from profile
                    </DropItem>
                  </DropdownBtn>
                  <input
                    ref={texRef}
                    type="file"
                    accept=".tex"
                    className="hidden"
                    onChange={handleTexImport}
                  />
                  <input
                    ref={pdfRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handlePdfImport}
                  />
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="text-[#4a7090] hover:text-[#94a3b8] transition-colors cursor-pointer p-1"
                  >
                    <ChevronLeft size={13} />
                  </button>
                </div>
              </div>

              {/* contact */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-payne-gray text-xs tracking-widest">
                    <User size={13} />
                    <span className="text-[#c8d8f0] font-bold text-xs uppercase">Contact</span>
                  </div>
                  <div className="flex-1 h-px bg-[#1a3050]" />
                  {!editingContact ? (
                    <PillBtn
                      variant="ghost"
                      onClick={() => {
                        setContactDraft(profile.contact)
                        setEditingContact(true)
                      }}
                    >
                      <Pencil size={11} /> edit
                    </PillBtn>
                  ) : (
                    <div className="flex gap-1.5">
                      <PillBtn variant="accent" onClick={saveContact}>
                        <Check size={11} /> save
                      </PillBtn>
                      <PillBtn variant="ghost" onClick={() => setEditingContact(false)}>
                        <X size={11} /> cancel
                      </PillBtn>
                    </div>
                  )}
                </div>
                <div className="border border-[#1a3050] rounded-xl p-4 bg-[#08132a]">
                  <AnimatePresence mode="wait">
                    {editingContact ? (
                      <motion.div
                        key="edit"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-2 gap-3"
                      >
                        <Field
                          label="full name"
                          value={contactDraft.name}
                          onChange={(v) => setContactDraft((p) => ({ ...p, name: v }))}
                          placeholder="Your Name"
                        />
                        <Field
                          label="phone"
                          value={contactDraft.phone}
                          onChange={(v) => setContactDraft((p) => ({ ...p, phone: v }))}
                          placeholder="+1 (555) 000-0000"
                        />
                        <Field
                          label="email"
                          value={contactDraft.email}
                          onChange={(v) => setContactDraft((p) => ({ ...p, email: v }))}
                          placeholder="you@email.com"
                        />
                        <Field
                          label="linkedin"
                          value={contactDraft.linkedin}
                          onChange={(v) => setContactDraft((p) => ({ ...p, linkedin: v }))}
                          placeholder="handle"
                        />
                        <Field
                          label="github"
                          value={contactDraft.github}
                          onChange={(v) => setContactDraft((p) => ({ ...p, github: v }))}
                          placeholder="handle"
                        />
                        <Field
                          label="portfolio"
                          value={contactDraft.portfolio}
                          onChange={(v) => setContactDraft((p) => ({ ...p, portfolio: v }))}
                          placeholder="https://..."
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="display"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {profile.contact.name ? (
                          <div className="flex flex-col gap-2">
                            <p className="text-sm font-bold text-porcelain">
                              {profile.contact.name}
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#94a3b8]">
                              {profile.contact.email && <span>{profile.contact.email}</span>}
                              {profile.contact.linkedin && (
                                <span>li/{profile.contact.linkedin}</span>
                              )}
                              {profile.contact.github && <span>gh/{profile.contact.github}</span>}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-[#4a7090] italic">
                            // no contact yet — click edit
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* sections */}
              <div className="flex flex-col gap-6">
                <AnimatePresence>
                  {sections.map((sectionType) => {
                    const meta = SECTION_META[sectionType]
                    const isAdding = addingIn === sectionType
                    const editId = eId(sectionType)

                    return (
                      <motion.div
                        key={sectionType}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex flex-col gap-3"
                      >
                        {/* section header */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 text-payne-gray text-xs tracking-widest">
                            {meta.icon}
                            <span className="text-[#c8d8f0] font-bold text-xs">{meta.label}</span>
                          </div>
                          <div className="flex-1 h-px bg-[#1a3050]" />
                          <div className="flex items-center gap-1.5">
                            <PillBtn
                              variant="default"
                              onClick={() => {
                                setAddingIn(isAdding ? null : sectionType)
                                setEditingEntry(null)
                                setDraftEntry(null)
                              }}
                            >
                              {isAdding ? <X size={11} /> : <Plus size={11} />}
                              {isAdding ? 'cancel' : 'add'}
                            </PillBtn>
                            <PillBtn variant="danger" onClick={() => removeSection(sectionType)}>
                              <Trash2 size={11} />
                            </PillBtn>
                          </div>
                        </div>

                        {/* add form */}
                        <AnimatePresence>
                          {isAdding && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="border border-payne-gray/30 rounded-xl p-4 bg-[#060e20] mb-2">
                                {sectionType === 'education' && (
                                  <EducationForm
                                    onSave={addEducation}
                                    onCancel={() => {
                                      setAddingIn(null)
                                      setDraftEntry(null)
                                    }}
                                    onChange={(d) =>
                                      setDraftEntry({ sectionType: 'education', id: null, data: d })
                                    }
                                  />
                                )}
                                {sectionType === 'experience' && (
                                  <ExperienceForm
                                    onSave={addExperience}
                                    onCancel={() => {
                                      setAddingIn(null)
                                      setDraftEntry(null)
                                    }}
                                    onChange={(d) =>
                                      setDraftEntry({
                                        sectionType: 'experience',
                                        id: null,
                                        data: d,
                                      })
                                    }
                                  />
                                )}
                                {sectionType === 'projects' && (
                                  <ProjectForm
                                    onSave={addProject}
                                    onCancel={() => {
                                      setAddingIn(null)
                                      setDraftEntry(null)
                                    }}
                                    onChange={(d) =>
                                      setDraftEntry({ sectionType: 'projects', id: null, data: d })
                                    }
                                  />
                                )}
                                {sectionType === 'skills' && (
                                  <SkillsForm
                                    onSave={addSkill}
                                    onCancel={() => {
                                      setAddingIn(null)
                                      setDraftEntry(null)
                                    }}
                                    onChange={(d) =>
                                      setDraftEntry({ sectionType: 'skills', id: null, data: d })
                                    }
                                  />
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* entries */}
                        <div className="flex flex-col gap-2">
                          {/* education */}
                          {sectionType === 'education' &&
                            profile.education.map((entry) => (
                              <div key={entry.id}>
                                <EntryCard
                                  expanded={expandedIds.has(entry.id)}
                                  onToggle={() => toggleExpand(entry.id)}
                                  isEditing={editId === entry.id}
                                  onEdit={() => {
                                    if (editId === entry.id) {
                                      setEditingEntry(null)
                                      setDraftEntry(null)
                                    } else {
                                      setEditingEntry({ type: 'education', id: entry.id })
                                      setAddingIn(null)
                                      setDraftEntry(null)
                                      setExpandedIds((prev) => {
                                        const n = new Set(prev)
                                        n.add(entry.id)
                                        return n
                                      })
                                    }
                                  }}
                                  onDelete={() => deleteEducation(entry.id)}
                                >
                                  <div className="flex flex-col gap-1">
                                    <p className="text-sm font-bold text-porcelain">
                                      {entry.school || '—'}
                                    </p>
                                    <p className="text-xs text-[#94a3b8]">
                                      {entry.degree}
                                      {entry.location ? ` · ${entry.location}` : ''}
                                      {entry.dates && (
                                        <span className="ml-2 text-payne-gray">{entry.dates}</span>
                                      )}
                                    </p>
                                  </div>
                                </EntryCard>
                                <AnimatePresence>
                                  {expandedIds.has(entry.id) && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="overflow-hidden"
                                    >
                                      {editId === entry.id ? (
                                        <div className="border border-payne-gray/30 border-t-0 rounded-b-xl p-4 bg-[#060e20]">
                                          <EducationForm
                                            initial={entry}
                                            onSave={addEducation}
                                            onCancel={() => {
                                              setEditingEntry(null)
                                              setDraftEntry(null)
                                            }}
                                            onChange={(d) =>
                                              setDraftEntry({
                                                sectionType: 'education',
                                                id: entry.id,
                                                data: d,
                                              })
                                            }
                                          />
                                        </div>
                                      ) : (
                                        <div className="border border-[#1a3050] border-t-0 rounded-b-xl px-4 pb-4 pt-3 bg-[#08132a] flex flex-col gap-2">
                                          {entry.coursework && (
                                            <p className="text-xs text-[#94a3b8]">
                                              <span className="text-payne-gray">coursework: </span>
                                              {entry.coursework}
                                            </p>
                                          )}
                                          {entry.rawText ? (
                                            <p className="text-xs text-[#94a3b8] leading-relaxed whitespace-pre-wrap">
                                              {entry.rawText}
                                            </p>
                                          ) : (
                                            <p className="text-xs text-[#4a7090] italic">
                                              // no casual notes yet
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}

                          {/* experience */}
                          {sectionType === 'experience' &&
                            profile.experience.map((entry) => (
                              <div key={entry.id}>
                                <EntryCard
                                  expanded={expandedIds.has(entry.id)}
                                  onToggle={() => toggleExpand(entry.id)}
                                  isEditing={editId === entry.id}
                                  onEdit={() => {
                                    if (editId === entry.id) {
                                      setEditingEntry(null)
                                      setDraftEntry(null)
                                    } else {
                                      setEditingEntry({ type: 'experience', id: entry.id })
                                      setAddingIn(null)
                                      setDraftEntry(null)
                                      setExpandedIds((prev) => {
                                        const n = new Set(prev)
                                        n.add(entry.id)
                                        return n
                                      })
                                    }
                                  }}
                                  onDelete={() => deleteExperience(entry.id)}
                                >
                                  <div className="flex flex-col gap-1">
                                    <p className="text-sm font-bold text-porcelain">
                                      {entry.company || '—'}
                                    </p>
                                    <p className="text-xs text-[#94a3b8]">
                                      {entry.role}
                                      {entry.location ? ` · ${entry.location}` : ''}
                                      {entry.dates && (
                                        <span className="ml-2 text-payne-gray">{entry.dates}</span>
                                      )}
                                    </p>
                                  </div>
                                </EntryCard>
                                <AnimatePresence>
                                  {expandedIds.has(entry.id) && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="overflow-hidden"
                                    >
                                      {editId === entry.id ? (
                                        <div className="border border-payne-gray/30 border-t-0 rounded-b-xl p-4 bg-[#060e20]">
                                          <ExperienceForm
                                            initial={entry}
                                            onSave={addExperience}
                                            onCancel={() => {
                                              setEditingEntry(null)
                                              setDraftEntry(null)
                                            }}
                                            onChange={(d) =>
                                              setDraftEntry({
                                                sectionType: 'experience',
                                                id: entry.id,
                                                data: d,
                                              })
                                            }
                                          />
                                        </div>
                                      ) : (
                                        <div className="border border-[#1a3050] border-t-0 rounded-b-xl px-4 pb-4 pt-3 bg-[#08132a] flex flex-col gap-2">
                                          {entry.bullets.length > 0 && (
                                            <div className="flex flex-col gap-1.5">
                                              {entry.bullets.map((b, i) => (
                                                <p
                                                  key={i}
                                                  className="text-xs text-[#94a3b8] flex gap-2"
                                                >
                                                  <span className="text-payne-gray shrink-0">
                                                    ◆
                                                  </span>
                                                  <span>{b}</span>
                                                </p>
                                              ))}
                                            </div>
                                          )}
                                          {entry.rawText ? (
                                            <p className="text-xs text-[#94a3b8] leading-relaxed whitespace-pre-wrap">
                                              {entry.rawText}
                                            </p>
                                          ) : (
                                            <p className="text-xs text-[#4a7090] italic">
                                              // no casual notes — edit to add
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}

                          {/* projects */}
                          {sectionType === 'projects' &&
                            profile.projects.map((entry) => (
                              <div key={entry.id}>
                                <EntryCard
                                  expanded={expandedIds.has(entry.id)}
                                  onToggle={() => toggleExpand(entry.id)}
                                  isEditing={editId === entry.id}
                                  onEdit={() => {
                                    if (editId === entry.id) {
                                      setEditingEntry(null)
                                      setDraftEntry(null)
                                    } else {
                                      setEditingEntry({ type: 'projects', id: entry.id })
                                      setAddingIn(null)
                                      setDraftEntry(null)
                                      setExpandedIds((prev) => {
                                        const n = new Set(prev)
                                        n.add(entry.id)
                                        return n
                                      })
                                    }
                                  }}
                                  onDelete={() => deleteProject(entry.id)}
                                >
                                  <div className="flex flex-col gap-1">
                                    <p className="text-sm font-bold text-porcelain">
                                      {entry.name || '—'}
                                    </p>
                                    <p className="text-xs text-[#94a3b8]">
                                      {entry.techStack}
                                      {entry.dates && (
                                        <span className="ml-2 text-payne-gray">{entry.dates}</span>
                                      )}
                                    </p>
                                  </div>
                                </EntryCard>
                                <AnimatePresence>
                                  {expandedIds.has(entry.id) && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="overflow-hidden"
                                    >
                                      {editId === entry.id ? (
                                        <div className="border border-payne-gray/30 border-t-0 rounded-b-xl p-4 bg-[#060e20]">
                                          <ProjectForm
                                            initial={entry}
                                            onSave={addProject}
                                            onCancel={() => {
                                              setEditingEntry(null)
                                              setDraftEntry(null)
                                            }}
                                            onChange={(d) =>
                                              setDraftEntry({
                                                sectionType: 'projects',
                                                id: entry.id,
                                                data: d,
                                              })
                                            }
                                          />
                                        </div>
                                      ) : (
                                        <div className="border border-[#1a3050] border-t-0 rounded-b-xl px-4 pb-4 pt-3 bg-[#08132a] flex flex-col gap-2">
                                          {entry.bullets.length > 0 && (
                                            <div className="flex flex-col gap-1.5">
                                              {entry.bullets.map((b, i) => (
                                                <p
                                                  key={i}
                                                  className="text-xs text-[#94a3b8] flex gap-2"
                                                >
                                                  <span className="text-payne-gray shrink-0">
                                                    ◆
                                                  </span>
                                                  <span>{b}</span>
                                                </p>
                                              ))}
                                            </div>
                                          )}
                                          {entry.rawText ? (
                                            <p className="text-xs text-[#94a3b8] leading-relaxed whitespace-pre-wrap">
                                              {entry.rawText}
                                            </p>
                                          ) : (
                                            <p className="text-xs text-[#4a7090] italic">
                                              // no casual notes — edit to describe
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}

                          {/* skills */}
                          {sectionType === 'skills' && (
                            <div className="border border-[#1a3050] rounded-xl px-4 py-3 bg-[#08132a] flex flex-col gap-2">
                              {profile.skills.length === 0 ? (
                                <p className="text-xs text-[#4a7090] italic">// no skills yet</p>
                              ) : (
                                profile.skills.map((entry) => (
                                  <div key={entry.id} className="flex items-start gap-3 group">
                                    <span className="text-xs text-payne-gray shrink-0 w-32 pt-px">
                                      {entry.category}
                                    </span>
                                    <span className="text-xs text-[#94a3b8] flex-1 leading-relaxed">
                                      {entry.technologies}
                                    </span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {editId !== entry.id && (
                                        <>
                                          <PillBtn
                                            variant="ghost"
                                            onClick={() => {
                                              setEditingEntry({ type: 'skills', id: entry.id })
                                              setDraftEntry(null)
                                            }}
                                          >
                                            <Pencil size={10} />
                                          </PillBtn>
                                          <PillBtn
                                            variant="danger"
                                            onClick={() => deleteSkill(entry.id)}
                                          >
                                            <Trash2 size={10} />
                                          </PillBtn>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                              <AnimatePresence>
                                {editingEntry?.type === 'skills' && editingEntry.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden pt-3 border-t border-[#1a3050] mt-1"
                                  >
                                    <SkillsForm
                                      initial={profile.skills.find((s) => s.id === editingEntry.id)}
                                      onSave={addSkill}
                                      onCancel={() => {
                                        setEditingEntry(null)
                                        setDraftEntry(null)
                                      }}
                                      onChange={(d) =>
                                        setDraftEntry({
                                          sectionType: 'skills',
                                          id: editingEntry.id,
                                          data: d,
                                        })
                                      }
                                    />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}

                          {sectionType !== 'skills' &&
                            profile[sectionType].length === 0 &&
                            !isAdding && (
                              <p className="text-xs text-[#4a7090] italic px-1">
                                // no {sectionType} entries — click [add]
                              </p>
                            )}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              {/* add section picker */}
              {availableSections.length > 0 && (
                <div className="flex justify-center pb-6">
                  <div className="relative">
                    <button
                      onClick={() => setShowSectionPicker((p) => !p)}
                      className={cn(
                        'flex items-center gap-2 px-5 py-2 rounded-full text-xs font-jetbrains border border-dashed transition-all cursor-pointer',
                        showSectionPicker
                          ? 'border-payne-gray text-porcelain bg-[#08132a]'
                          : 'border-[#1a3050] text-[#4a7090] hover:border-payne-gray hover:text-[#94a3b8]'
                      )}
                    >
                      <Plus size={12} /> add section
                    </button>
                    <AnimatePresence>
                      {showSectionPicker && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.97 }}
                          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#08132a] border border-[#1a3050] rounded-xl overflow-hidden shadow-xl z-10 min-w-[170px]"
                        >
                          {availableSections.map((s) => (
                            <button
                              key={s}
                              onClick={() => addSection(s)}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-[#94a3b8] hover:bg-[#0c1a38] hover:text-porcelain transition-colors cursor-pointer"
                            >
                              <span className="text-payne-gray">{SECTION_META[s].icon}</span>
                              {SECTION_META[s].label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-5 gap-4 h-full">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-[#4a7090] hover:text-[#94a3b8] transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-[#0c1a38]"
            >
              <PanelLeftOpen size={14} />
            </button>
            <span className="text-[10px] text-[#4a7090] font-jetbrains [writing-mode:vertical-rl] tracking-widest rotate-180 mt-2">
              profile
            </span>
          </div>
        )}
      </div>

      {/* ══ RESIZE HANDLE ══ */}
      {sidebarOpen && (
        <div
          onMouseDown={onDividerMouseDown}
          className="w-1 shrink-0 bg-[#0d1a2e] hover:bg-payne-gray/40 active:bg-payne-gray/70 transition-colors cursor-col-resize"
        />
      )}

      {/* ══ RIGHT PANEL ══ */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#060e20] min-w-0">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#0d1a2e] shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-payne-gray">~/</span>
            <span className="text-[#c8d8f0]">preview</span>
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse ml-1"
              title="live"
            />
            <span className="text-[11px] font-jetbrains ml-1 text-[#4a7090]">
              {pageCount} {pageCount === 1 ? 'page' : 'pages'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DropdownBtn label="export" icon={<Download size={11} />} align="right">
              <DropItem onClick={handleExportTex}>
                <FileText size={12} className="text-payne-gray" /> download .tex
              </DropItem>
              <DropItem onClick={handleExportMd}>
                <FileText size={12} className="text-payne-gray" /> download .md
              </DropItem>
            </DropdownBtn>
            <PillBtn
              variant={editMode ? 'accent' : 'default'}
              onClick={() => {
                const next = !editMode
                setEditMode(next)
                setIframeEditing(false)
                if (next) {
                  setSidebarOpen(false)
                  setFormatOpen(true)
                } else {
                  setFormatOpen(false)
                }
              }}
            >
              <SquarePen size={11} /> {editMode ? 'editing' : 'edit in preview'}
            </PillBtn>
            <PillBtn variant="default" onClick={openPdfPreview}>
              <Printer size={11} /> PDF preview
            </PillBtn>
            <PillBtn variant="default" onClick={() => console.log('hello')}>
              <Printer size={11} /> save profile
            </PillBtn>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* preview scroll area */}
          <div className="flex-1 overflow-y-auto p-6 min-w-0 bg-[#030b18]">
            <div className="flex flex-col items-center gap-6 max-w-[820px] mx-auto pb-6">
              {Array.from({ length: pageCount }, (_, i) => (
                <div
                  key={i}
                  className="w-full shadow-2xl rounded shrink-0 bg-white"
                  style={{ height: 1056 }}
                >
                  {/* pages 2+ get a top spacer; page 1 uses body CSS padding-top naturally */}
                  {i > 0 && <div style={{ height: marginPx }} />}
                  {/* content clip window:
                      page 1 → clips body-top-padding + contentPerPage (= marginPx + contentPerPage)
                      page 2+ → clips exactly contentPerPage */}
                  <div
                    style={{
                      height: i === 0 ? marginPx + contentPerPage : contentPerPage,
                      overflow: 'hidden',
                    }}
                  >
                    <iframe
                      ref={i === 0 ? iframeRef : undefined}
                      srcDoc={resumeHtmlFinal}
                      title={`Resume Page ${i + 1}`}
                      sandbox="allow-scripts allow-same-origin"
                      className={cn(
                        'w-full border-0 overflow-hidden bg-white block',
                        i === 0 && editMode && 'cursor-pointer'
                      )}
                      style={{
                        height: Math.max(contentHeight || contentPerPage, contentPerPage),
                        // page 1: no shift; page i>0: skip body-top + i full content pages
                        transform: `translateY(-${i === 0 ? 0 : marginPx + i * contentPerPage}px)`,
                        marginBottom: `-${i === 0 ? 0 : marginPx + i * contentPerPage}px`,
                      }}
                    />
                  </div>
                  {/* bottom page margin for every page */}
                  <div style={{ height: marginPx }} />
                </div>
              ))}
            </div>
          </div>

          {/* ── FORMAT SIDEBAR ── */}
          <AnimatePresence>
            {formatOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 272, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="shrink-0 border-l border-[#0d1a2e] bg-[#060e20] overflow-hidden flex flex-col"
                style={{ width: 272 }}
              >
                <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-5">
                  {/* header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-jetbrains text-payne-gray tracking-widest">
                      // format
                    </span>
                    <button
                      onClick={() => {
                        setFormatOpen(false)
                        setEditMode(false)
                      }}
                      className="text-[#4a7090] hover:text-[#94a3b8] transition-colors cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* typography */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] text-[#4a7090] font-jetbrains tracking-widest uppercase">
                      typography
                    </span>

                    {/* font family */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] text-[#8aaac8] font-jetbrains">font</span>
                      <select
                        value={format.fontFamily}
                        onChange={(e) => setFormat((f) => ({ ...f, fontFamily: e.target.value }))}
                        className="w-full bg-[#08132a] border border-[#1a3050] text-[#c8d8f0] text-[11px] font-jetbrains rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none focus:border-payne-gray appearance-none"
                      >
                        {(['monospace', 'serif', 'sans-serif'] as const).map((cat) => (
                          <optgroup key={cat} label={cat}>
                            {FONT_OPTIONS.filter((o) => o.category === cat).map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <FormatSlider
                      label="body size"
                      value={format.fontSize}
                      min={8}
                      max={12}
                      step={0.5}
                      unit="pt"
                      onChange={(v) => setFormat((f) => ({ ...f, fontSize: v }))}
                    />
                    <FormatSlider
                      label="name size"
                      value={format.nameSize}
                      min={14}
                      max={28}
                      step={1}
                      unit="pt"
                      onChange={(v) => setFormat((f) => ({ ...f, nameSize: v }))}
                    />
                    <FormatSlider
                      label="bullet size"
                      value={format.bulletSize}
                      min={7}
                      max={11}
                      step={0.5}
                      unit="pt"
                      onChange={(v) => setFormat((f) => ({ ...f, bulletSize: v }))}
                    />
                    <FormatSlider
                      label="line height"
                      value={format.lineHeight}
                      min={1.1}
                      max={1.8}
                      step={0.05}
                      unit=""
                      onChange={(v) => setFormat((f) => ({ ...f, lineHeight: v }))}
                    />
                  </div>

                  <div className="h-px bg-[#0d1a2e]" />

                  {/* layout */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] text-[#4a7090] font-jetbrains tracking-widest uppercase">
                      layout
                    </span>
                    <FormatSlider
                      label="page margin"
                      value={format.pageMargin}
                      min={0.3}
                      max={0.8}
                      step={0.05}
                      unit="in"
                      onChange={(v) => setFormat((f) => ({ ...f, pageMargin: v }))}
                    />
                    <FormatSlider
                      label="section gap"
                      value={format.sectionSpacing}
                      min={4}
                      max={20}
                      step={1}
                      unit="px"
                      onChange={(v) => setFormat((f) => ({ ...f, sectionSpacing: v }))}
                    />
                    <FormatSlider
                      label="entry gap"
                      value={format.entrySpacing}
                      min={2}
                      max={12}
                      step={1}
                      unit="px"
                      onChange={(v) => setFormat((f) => ({ ...f, entrySpacing: v }))}
                    />
                  </div>

                  <div className="h-px bg-[#0d1a2e]" />

                  {/* reset */}
                  <button
                    onClick={() => setFormat(DEFAULT_FORMAT)}
                    className="text-[11px] font-jetbrains text-[#4a7090] hover:text-[#94a3b8] transition-colors cursor-pointer text-left"
                  >
                    // reset to defaults
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ══ PDF PREVIEW MODAL ══ */}
      {pdfPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col items-center overflow-y-auto py-8 px-4">
          {/* toolbar */}
          <div className="sticky top-0 z-10 w-full max-w-[880px] flex items-center justify-between px-4 py-2.5 bg-[#030b18] border border-[#1a3050] rounded-xl mb-5 shadow-xl">
            <div className="flex items-center gap-3 text-xs">
              <Printer size={13} className="text-payne-gray" />
              <span className="text-[#c8d8f0]">PDF Preview</span>
              <span
                className={cn(
                  'font-jetbrains',
                  pdfPageCount > 1 ? 'text-[#ef4444]' : 'text-[#4ade80]'
                )}
              >
                {pdfPageCount > 1 ? `⚠ ${pdfPageCount} pages` : '✓ 1 page'}
              </span>
            </div>
            <div className="flex gap-2">
              <PillBtn variant="accent" onClick={handlePrint}>
                <Printer size={11} /> print / save PDF
              </PillBtn>
              <PillBtn variant="ghost" onClick={() => setPdfPreviewOpen(false)}>
                <X size={11} /> close
              </PillBtn>
            </div>
          </div>
          {/* page view */}
          <div className="w-full max-w-[880px] relative shadow-2xl">
            <iframe
              ref={pdfPreviewIfrRef}
              srcDoc={pdfPreviewHtml}
              title="PDF Preview"
              sandbox="allow-same-origin"
              className="w-full border-0 bg-white"
              style={{ minHeight: '1056px', overflow: 'hidden' }}
              onLoad={handlePdfPreviewLoad}
            />
            {/* page-break overlays */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: pdfPageCount - 1 }, (_, i) => (
                <div
                  key={i}
                  style={{ position: 'absolute', top: (i + 1) * 1056, left: 0, right: 0 }}
                  className="border-t-2 border-dashed border-red-500/50"
                >
                  <span className="absolute right-2 -top-5 bg-[#1a0808] text-[#ef4444] text-[10px] px-2 py-0.5 rounded font-jetbrains">
                    page {i + 2}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
