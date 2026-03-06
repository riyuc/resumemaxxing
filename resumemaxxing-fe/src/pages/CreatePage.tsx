import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Plus, X, Trash2, Pencil, Check, GraduationCap, Briefcase,
  Code2, Wrench, User, ChevronDown, ChevronRight, ChevronLeft, Upload, TerminalSquare,
  Download, FileText, Printer, ChevronUp, PanelLeftOpen,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { parseTexResume } from '@/utils/texParser'
import { exportAsTex, exportAsMd, generateResumeHtml, printResumePdf, downloadFile } from '@/utils/profileExport'
import type {
  ProfileData, EducationEntry, ExperienceEntry, ProjectEntry, SkillsEntry, SectionType,
} from '@/types/profile'
import { cn } from '@/lib/utils'

// ─── storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'agentic-resume-profile'
const SECTIONS_KEY = 'agentic-resume-sections'

const DEFAULT_PROFILE: ProfileData = {
  contact: { name: '', phone: '', email: '', linkedin: '', github: '', portfolio: '' },
  education: [], experience: [], projects: [], skills: [],
}

function loadProfile(): ProfileData {
  try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : DEFAULT_PROFILE }
  catch { return DEFAULT_PROFILE }
}

function loadSections(): SectionType[] {
  try { const s = localStorage.getItem(SECTIONS_KEY); return s ? JSON.parse(s) : [] }
  catch { return [] }
}

function sectionsFromData(data: ProfileData): SectionType[] {
  const out: SectionType[] = []
  if (data.education.length)  out.push('education')
  if (data.experience.length) out.push('experience')
  if (data.projects.length)   out.push('projects')
  if (data.skills.length)     out.push('skills')
  return out
}

// ─── draft entry type (for live preview while typing) ─────────────────────────

type DraftEntry =
  | { sectionType: 'education';  id: string | null; data: Omit<EducationEntry,  'id'> }
  | { sectionType: 'experience'; id: string | null; data: Omit<ExperienceEntry, 'id'> }
  | { sectionType: 'projects';   id: string | null; data: Omit<ProjectEntry,    'id'> }
  | { sectionType: 'skills';     id: string | null; data: Omit<SkillsEntry,     'id'> }

// ─── constants ────────────────────────────────────────────────────────────────

const SECTION_META: Record<SectionType, { label: string; icon: React.ReactNode; placeholder: string }> = {
  education:  { label: 'EDUCATION',  icon: <GraduationCap size={13} />, placeholder: 'e.g. studied CS here, took AI/OS courses, 3.8 GPA, was in the coding club...' },
  experience: { label: 'EXPERIENCE', icon: <Briefcase    size={13} />, placeholder: 'e.g. worked on payments infrastructure, improved success rates, led the migration from...' },
  projects:   { label: 'PROJECTS',   icon: <Code2        size={13} />, placeholder: 'e.g. built a RAG pipeline for X, used embeddings + postgres, demoed at hackathon...' },
  skills:     { label: 'SKILLS',     icon: <Wrench       size={13} />, placeholder: '' },
}

// ─── atoms ────────────────────────────────────────────────────────────────────

const Field = ({
  label, value, onChange, placeholder, mono = true, multiline = false, rows = 4,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; mono?: boolean; multiline?: boolean; rows?: number;
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[10px] text-payne-gray tracking-widest uppercase">{label}</span>
    {multiline ? (
      <textarea
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className={cn(
          'bg-[#060e20] border border-[#1e3a5f] rounded-lg p-3 text-xs text-porcelain',
          'placeholder:text-[#4a7090] focus:outline-none focus:border-payne-gray resize-none leading-relaxed',
          mono && 'font-jetbrains',
        )}
      />
    ) : (
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={cn(
          'bg-[#060e20] border border-[#1e3a5f] rounded-lg p-3 text-xs text-porcelain',
          'placeholder:text-[#4a7090] focus:outline-none focus:border-payne-gray',
          mono && 'font-jetbrains',
        )}
      />
    )}
  </div>
)

const PillBtn = ({
  children, onClick, variant = 'default', className, type = 'button',
}: {
  children: React.ReactNode; onClick?: () => void;
  variant?: 'default' | 'ghost' | 'danger' | 'accent';
  className?: string; type?: 'button' | 'submit';
}) => (
  <button type={type} onClick={onClick}
    className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-jetbrains',
      'transition-all duration-150 cursor-pointer select-none',
      variant === 'default' && 'border border-payne-gray text-[#94a3b8] hover:border-[#6a8fa3] hover:text-porcelain',
      variant === 'accent'  && 'bg-payne-gray text-white hover:bg-[#5a7d91]',
      variant === 'ghost'   && 'text-payne-gray hover:text-porcelain',
      variant === 'danger'  && 'text-[#ef4444]/60 hover:text-[#ef4444]',
      className,
    )}
  >
    {children}
  </button>
)

// ─── bullet reference ─────────────────────────────────────────────────────────

const EditableBullets = ({ bullets, onChange }: { bullets: string[]; onChange: (bs: string[]) => void }) => {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [bullets])
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] text-payne-gray tracking-widest uppercase">bullets</span>
      <textarea
        ref={ref}
        value={bullets.join('\n')}
        onChange={e => onChange(e.target.value.split('\n'))}
        className="w-full bg-[#060e20] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs text-porcelain placeholder:text-[#4a7090] focus:outline-none focus:border-payne-gray resize-none overflow-hidden font-jetbrains leading-relaxed"
        placeholder={"each line is one bullet\n—\npress Enter to add a new bullet"}
        style={{ minHeight: '80px' }}
      />
    </div>
  )
}

// ─── entry forms (with onChange for live preview) ─────────────────────────────

const EducationForm = ({ initial, onSave, onCancel, onChange }: {
  initial?: Partial<EducationEntry>;
  onSave: (e: Omit<EducationEntry, 'id'>) => void;
  onCancel: () => void;
  onChange?: (draft: Omit<EducationEntry, 'id'>) => void;
}) => {
  const [school, setSchool]   = useState(initial?.school ?? '')
  const [location, setLoc]    = useState(initial?.location ?? '')
  const [degree, setDegree]   = useState(initial?.degree ?? '')
  const [dates, setDates]     = useState(initial?.dates ?? '')
  const [coursework, setCw]   = useState(initial?.coursework ?? '')
  const [rawText, setRaw]     = useState(initial?.rawText ?? '')

  const draft = useMemo(() => ({ school, location, degree, dates, coursework, rawText }), [school, location, degree, dates, coursework, rawText])
  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    onChange?.(draft)
  }, [draft]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="school" value={school} onChange={setSchool} placeholder="Concordia University" />
        <Field label="location" value={location} onChange={setLoc} placeholder="Montreal, QC" />
        <Field label="degree" value={degree} onChange={setDegree} placeholder="B.Sc. Computer Science" />
        <Field label="dates" value={dates} onChange={setDates} placeholder="Sep 2022 – Dec 2026" />
      </div>
      <Field label="coursework" value={coursework} onChange={setCw} placeholder="OS, Algorithms, AI..." />
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-[#4a7090] tracking-widest">// casual notes — clubs, what you learned, achievements</span>
        <textarea value={rawText} onChange={e => setRaw(e.target.value)}
          placeholder={SECTION_META.education.placeholder} rows={3}
          className="bg-[#060e20] border border-payne-gray/30 rounded-lg px-3 py-2.5 text-xs text-porcelain placeholder:text-[#4a7090] focus:outline-none focus:border-payne-gray resize-none font-jetbrains leading-relaxed"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <PillBtn variant="accent" onClick={() => onSave(draft)}><Check size={12} /> save</PillBtn>
        <PillBtn variant="ghost" onClick={onCancel}><X size={12} /> cancel</PillBtn>
      </div>
    </div>
  )
}

const ExperienceForm = ({ initial, onSave, onCancel, onChange }: {
  initial?: Partial<ExperienceEntry>;
  onSave: (e: Omit<ExperienceEntry, 'id'>) => void;
  onCancel: () => void;
  onChange?: (draft: Omit<ExperienceEntry, 'id'>) => void;
}) => {
  const [company, setCompany]   = useState(initial?.company ?? '')
  const [location, setLoc]      = useState(initial?.location ?? '')
  const [role, setRole]         = useState(initial?.role ?? '')
  const [dates, setDates]       = useState(initial?.dates ?? '')
  const [bullets, setBullets]   = useState(initial?.bullets ?? [])
  const [rawText, setRaw]       = useState(initial?.rawText ?? '')

  const draft = useMemo(() => ({ company, location, role, dates, bullets, rawText }), [company, location, role, dates, bullets, rawText])
  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    onChange?.(draft)
  }, [draft]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="company" value={company} onChange={setCompany} placeholder="Shopify" />
        <Field label="location" value={location} onChange={setLoc} placeholder="Toronto, ON" />
        <Field label="role" value={role} onChange={setRole} placeholder="Software Engineering Intern" />
        <Field label="dates" value={dates} onChange={setDates} placeholder="May 2025 – Dec 2025" />
      </div>
      <EditableBullets bullets={bullets} onChange={setBullets} />
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-[#4a7090] tracking-widest">// casual notes — tech used, impact, what you shipped</span>
        <textarea value={rawText} onChange={e => setRaw(e.target.value)}
          placeholder={SECTION_META.experience.placeholder} rows={3}
          className="bg-[#060e20] border border-payne-gray/30 rounded-lg px-3 py-2.5 text-xs text-porcelain placeholder:text-[#4a7090] focus:outline-none focus:border-payne-gray resize-none font-jetbrains leading-relaxed"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <PillBtn variant="accent" onClick={() => onSave(draft)}><Check size={12} /> save</PillBtn>
        <PillBtn variant="ghost" onClick={onCancel}><X size={12} /> cancel</PillBtn>
      </div>
    </div>
  )
}

const ProjectForm = ({ initial, onSave, onCancel, onChange }: {
  initial?: Partial<ProjectEntry>;
  onSave: (e: Omit<ProjectEntry, 'id'>) => void;
  onCancel: () => void;
  onChange?: (draft: Omit<ProjectEntry, 'id'>) => void;
}) => {
  const [name, setName]         = useState(initial?.name ?? '')
  const [techStack, setTech]    = useState(initial?.techStack ?? '')
  const [dates, setDates]       = useState(initial?.dates ?? '')
  const [bullets, setBullets]   = useState(initial?.bullets ?? [])
  const [rawText, setRaw]       = useState(initial?.rawText ?? '')

  const draft = useMemo(() => ({ name, techStack, dates, bullets, rawText }), [name, techStack, dates, bullets, rawText])
  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    onChange?.(draft)
  }, [draft]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="project name" value={name} onChange={setName} placeholder="AI Transcription Correction" />
        <Field label="dates" value={dates} onChange={setDates} placeholder="Hackathon, 2025" />
      </div>
      <Field label="tech stack" value={techStack} onChange={setTech} placeholder="Python, FastAPI, React..." />
      <EditableBullets bullets={bullets} onChange={setBullets} />
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-[#4a7090] tracking-widest">// casual notes — what it does, how you built it, results</span>
        <textarea value={rawText} onChange={e => setRaw(e.target.value)}
          placeholder={SECTION_META.projects.placeholder} rows={3}
          className="bg-[#060e20] border border-payne-gray/30 rounded-lg px-3 py-2.5 text-xs text-porcelain placeholder:text-[#4a7090] focus:outline-none focus:border-payne-gray resize-none font-jetbrains leading-relaxed"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <PillBtn variant="accent" onClick={() => onSave(draft)}><Check size={12} /> save</PillBtn>
        <PillBtn variant="ghost" onClick={onCancel}><X size={12} /> cancel</PillBtn>
      </div>
    </div>
  )
}

const SkillsForm = ({ initial, onSave, onCancel, onChange }: {
  initial?: Partial<SkillsEntry>;
  onSave: (e: Omit<SkillsEntry, 'id'>) => void;
  onCancel: () => void;
  onChange?: (draft: Omit<SkillsEntry, 'id'>) => void;
}) => {
  const [category, setCat] = useState(initial?.category ?? '')
  const [tech, setTech]    = useState(initial?.technologies ?? '')

  const draft = useMemo(() => ({ category, technologies: tech }), [category, tech])
  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    onChange?.(draft)
  }, [draft]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-3">
      <Field label="category" value={category} onChange={setCat} placeholder="Languages, Frameworks..." />
      <Field label="technologies" value={tech} onChange={setTech} placeholder="Python, TypeScript, Go..." />
      <div className="flex gap-2 pt-1">
        <PillBtn variant="accent" onClick={() => onSave(draft)}><Check size={12} /> save</PillBtn>
        <PillBtn variant="ghost" onClick={onCancel}><X size={12} /> cancel</PillBtn>
      </div>
    </div>
  )
}

const EntryCard = ({ children, onEdit, onDelete, expanded, onToggle, isEditing }: {
  children: React.ReactNode; onEdit: () => void; onDelete: () => void;
  expanded: boolean; onToggle: () => void; isEditing?: boolean;
}) => (
  <div className="border border-[#1a3050] rounded-xl overflow-hidden bg-[#08132a]">
    <div className="flex items-start justify-between px-4 py-3 cursor-pointer hover:bg-[#0c1a38] transition-colors" onClick={onToggle}>
      <div className="flex-1 min-w-0">{children}</div>
      <div className="flex items-center gap-1 ml-3 shrink-0" onClick={e => e.stopPropagation()}>
        <PillBtn variant="ghost" onClick={onEdit}>
          {isEditing ? <X size={11} /> : <Pencil size={11} />}
        </PillBtn>
        <PillBtn variant="danger" onClick={onDelete}><Trash2 size={11} /></PillBtn>
        <span className="text-[#4a7090] ml-1">
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
      </div>
    </div>
  </div>
)

// ─── dropdown button ──────────────────────────────────────────────────────────

const DropdownBtn = ({ label, icon, children, align = 'right' }: {
  label: string; icon?: React.ReactNode; children: React.ReactNode; align?: 'left' | 'right';
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <PillBtn variant="default" onClick={() => setOpen(o => !o)}>
        {icon}{label}{open ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
      </PillBtn>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className={cn(
              'absolute top-full mt-1.5 z-30 bg-[#08132a] border border-[#1a3050] rounded-xl overflow-hidden shadow-xl min-w-[140px]',
              align === 'right' ? 'right-0' : 'left-0',
            )}
            onClick={() => setOpen(false)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const DropItem = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <button onClick={onClick}
    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-[#94a3b8] hover:bg-[#0c1a38] hover:text-porcelain transition-colors cursor-pointer font-jetbrains text-left">
    {children}
  </button>
)

// ─── resize handle ────────────────────────────────────────────────────────────

const MIN_LEFT = 280
const MAX_LEFT = 760

function useResize(initial: number) {
  const [width, setWidth] = useState(initial)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startW = useRef(initial)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    startX.current = e.clientX
    startW.current = width
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [width])

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
  const [contactDraft, setContactDraft]     = useState(profile.contact)
  const [showSectionPicker, setShowSectionPicker] = useState(false)
  const [addingIn, setAddingIn]             = useState<SectionType | null>(null)
  const [editingEntry, setEditingEntry]     = useState<{ type: SectionType; id: string } | null>(null)
  const [expandedIds, setExpandedIds]       = useState<Set<string>>(new Set())
  const [importStatus, setImportStatus]     = useState<'idle' | 'success' | 'error'>('idle')
  const [pdfImporting, setPdfImporting]     = useState(false)
  const [sidebarOpen, setSidebarOpen]       = useState(true)

  // live preview draft — tracks what's currently being typed in open forms
  const [draftEntry, setDraftEntry]         = useState<DraftEntry | null>(null)

  const texRef = useRef<HTMLInputElement>(null)
  const pdfRef = useRef<HTMLInputElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const { width: leftWidth, onMouseDown: onDividerMouseDown } = useResize(460)

  // ── derive live preview profile ──
  const previewProfile = useMemo<ProfileData>(() => {
    if (!draftEntry) return profile
    const { sectionType, id, data } = draftEntry
    if (id) {
      return {
        ...profile,
        [sectionType]: (profile[sectionType] as { id: string }[]).map(
          e => e.id === id ? { ...data, id } : e,
        ),
      } as ProfileData
    }
    return {
      ...profile,
      [sectionType]: [...(profile[sectionType] as object[]), { ...data, id: '__draft__' }],
    } as ProfileData
  }, [profile, draftEntry])

  // ── sync preview HTML — instant, no debounce ──
  const [resumeHtml, setResumeHtml] = useState(() => generateResumeHtml(loadProfile()))
  useEffect(() => {
    const t = setTimeout(() => setResumeHtml(generateResumeHtml(previewProfile)), 120)
    return () => clearTimeout(t)
  }, [previewProfile])

  // persist to localStorage
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)) }, [profile])
  useEffect(() => { localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections)) }, [sections])

  const toggleExpand = (id: string) =>
    setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  // ── contact ──
  const saveContact = () => { setProfile(p => ({ ...p, contact: contactDraft })); setEditingContact(false) }

  // also live-preview contact edits
  const livePreviewProfile = useMemo<ProfileData>(() => {
    if (!editingContact) return previewProfile
    return { ...previewProfile, contact: contactDraft }
  }, [previewProfile, editingContact, contactDraft])

  const [resumeHtmlFinal, setResumeHtmlFinal] = useState(resumeHtml)
  useEffect(() => {
    const t = setTimeout(() => setResumeHtmlFinal(generateResumeHtml(livePreviewProfile)), 120)
    return () => clearTimeout(t)
  }, [livePreviewProfile])

  // ── sections ──
  const addSection = (type: SectionType) => {
    if (!sections.includes(type)) setSections(prev => [...prev, type])
    setShowSectionPicker(false); setAddingIn(type)
  }
  const removeSection = (type: SectionType) => {
    setSections(prev => prev.filter(s => s !== type))
    setProfile(p => ({ ...p, [type]: [] }))
    if (addingIn === type) setAddingIn(null)
  }
  const availableSections = (['education', 'experience', 'projects', 'skills'] as SectionType[])
    .filter(s => !sections.includes(s))

  // ── CRUD ──
  const addEducation = useCallback((entry: Omit<EducationEntry, 'id'>) => {
    setDraftEntry(null)
    if (editingEntry?.type === 'education') {
      setProfile(p => ({ ...p, education: p.education.map(e => e.id === editingEntry.id ? { ...entry, id: e.id } : e) }))
      setEditingEntry(null)
    } else {
      const id = crypto.randomUUID()
      setProfile(p => ({ ...p, education: [...p.education, { ...entry, id }] }))
      setExpandedIds(prev => new Set(prev).add(id)); setAddingIn(null)
    }
  }, [editingEntry])

  const addExperience = useCallback((entry: Omit<ExperienceEntry, 'id'>) => {
    setDraftEntry(null)
    if (editingEntry?.type === 'experience') {
      setProfile(p => ({ ...p, experience: p.experience.map(e => e.id === editingEntry.id ? { ...entry, id: e.id } : e) }))
      setEditingEntry(null)
    } else {
      const id = crypto.randomUUID()
      setProfile(p => ({ ...p, experience: [...p.experience, { ...entry, id }] }))
      setExpandedIds(prev => new Set(prev).add(id)); setAddingIn(null)
    }
  }, [editingEntry])

  const addProject = useCallback((entry: Omit<ProjectEntry, 'id'>) => {
    setDraftEntry(null)
    if (editingEntry?.type === 'projects') {
      setProfile(p => ({ ...p, projects: p.projects.map(e => e.id === editingEntry.id ? { ...entry, id: e.id } : e) }))
      setEditingEntry(null)
    } else {
      const id = crypto.randomUUID()
      setProfile(p => ({ ...p, projects: [...p.projects, { ...entry, id }] }))
      setExpandedIds(prev => new Set(prev).add(id)); setAddingIn(null)
    }
  }, [editingEntry])

  const addSkill = useCallback((entry: Omit<SkillsEntry, 'id'>) => {
    setDraftEntry(null)
    if (editingEntry?.type === 'skills') {
      setProfile(p => ({ ...p, skills: p.skills.map(e => e.id === editingEntry.id ? { ...entry, id: e.id } : e) }))
      setEditingEntry(null)
    } else {
      const id = crypto.randomUUID()
      setProfile(p => ({ ...p, skills: [...p.skills, { ...entry, id }] }))
      setAddingIn(null)
    }
  }, [editingEntry])

  const deleteEducation  = (id: string) => setProfile(p => ({ ...p, education:  p.education.filter(e => e.id !== id) }))
  const deleteExperience = (id: string) => setProfile(p => ({ ...p, experience: p.experience.filter(e => e.id !== id) }))
  const deleteProject    = (id: string) => setProfile(p => ({ ...p, projects:   p.projects.filter(e => e.id !== id) }))
  const deleteSkill      = (id: string) => setProfile(p => ({ ...p, skills:     p.skills.filter(e => e.id !== id) }))

  // ── imports ──
  const handleTexImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const parsed = parseTexResume(ev.target?.result as string)
        setProfile(parsed)
        const ns = sectionsFromData(parsed)
        setSections(prev => { const m = [...prev]; ns.forEach(s => { if (!m.includes(s)) m.push(s) }); return m })
        setImportStatus('success'); setTimeout(() => setImportStatus('idle'), 3000)
      } catch { setImportStatus('error'); setTimeout(() => setImportStatus('idle'), 3000) }
    }
    reader.readAsText(file); e.target.value = ''
  }

  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setPdfImporting(true)
    try {
      const { extractTextFromPdf, parsePdfText } = await import('@/utils/pdfParser')
      const text = await extractTextFromPdf(file)
      const parsed = parsePdfText(text)
      setProfile(prev => ({
        contact: { ...prev.contact, ...parsed.contact },
        education:  parsed.education  ?? prev.education,
        experience: parsed.experience ?? prev.experience,
        projects:   parsed.projects   ?? prev.projects,
        skills:     parsed.skills     ?? prev.skills,
      }))
      const ns = sectionsFromData({
        contact: DEFAULT_PROFILE.contact,
        education:  parsed.education  ?? [],
        experience: parsed.experience ?? [],
        projects:   parsed.projects   ?? [],
        skills:     parsed.skills     ?? [],
      })
      setSections(prev => { const m = [...prev]; ns.forEach(s => { if (!m.includes(s)) m.push(s) }); return m })
      setImportStatus('success'); setTimeout(() => setImportStatus('idle'), 3000)
    } catch (err) {
      console.error('PDF import failed:', err)
      setImportStatus('error'); setTimeout(() => setImportStatus('idle'), 3000)
    } finally { setPdfImporting(false); e.target.value = '' }
  }

  // ── exports ──
  const nameSlug = profile.contact.name?.replace(/\s+/g, '_') || 'resume'
  const handleExportTex = () => downloadFile(exportAsTex(profile), `${nameSlug}_resume.tex`, 'text/plain')
  const handleExportMd  = () => downloadFile(exportAsMd(profile),  `${nameSlug}_resume.md`,  'text/markdown')
  const handlePrint     = () => printResumePdf(resumeHtmlFinal)

  // iframe auto-height
  useEffect(() => {
    const iframe = iframeRef.current; if (!iframe) return
    const resize = () => {
      const h = iframe.contentDocument?.body?.scrollHeight
      if (h) iframe.style.height = `${h + 32}px`
    }
    iframe.addEventListener('load', resize)
    return () => iframe.removeEventListener('load', resize)
  }, [resumeHtmlFinal])

  const eId = (type: SectionType) => editingEntry?.type === type ? editingEntry.id : null

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

      {/* ══ LEFT PANEL (sidebar) ══ */}
      <div
        className="shrink-0 border-r border-[#0d1a2e] bg-[#030b18] overflow-hidden transition-[width] duration-200"
        style={{ width: sidebarOpen ? leftWidth : 44 }}
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
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className={cn('text-[11px] font-jetbrains shrink-0', importStatus === 'success' ? 'text-[#4ade80]' : 'text-[#ef4444]')}>
                    {importStatus === 'success' ? '✓ imported' : '✗ error'}
                  </motion.span>
                )}
              </AnimatePresence>
              {pdfImporting && <span className="text-[11px] text-[#4a7090] font-jetbrains animate-pulse">parsing...</span>}
              <DropdownBtn label="import" icon={<Upload size={11} />} align="right">
                <DropItem onClick={() => texRef.current?.click()}><FileText size={12} className="text-payne-gray" /> .tex file</DropItem>
                <DropItem onClick={() => pdfRef.current?.click()}><FileText size={12} className="text-payne-gray" /> .pdf file</DropItem>
              </DropdownBtn>
              <input ref={texRef} type="file" accept=".tex" className="hidden" onChange={handleTexImport} />
              <input ref={pdfRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfImport} />
              <button onClick={() => setSidebarOpen(false)}
                className="text-[#4a7090] hover:text-[#94a3b8] transition-colors cursor-pointer p-1">
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
                <PillBtn variant="ghost" onClick={() => { setContactDraft(profile.contact); setEditingContact(true) }}>
                  <Pencil size={11} /> edit
                </PillBtn>
              ) : (
                <div className="flex gap-1.5">
                  <PillBtn variant="accent" onClick={saveContact}><Check size={11} /> save</PillBtn>
                  <PillBtn variant="ghost" onClick={() => setEditingContact(false)}><X size={11} /> cancel</PillBtn>
                </div>
              )}
            </div>
            <div className="border border-[#1a3050] rounded-xl p-4 bg-[#08132a]">
              <AnimatePresence mode="wait">
                {editingContact ? (
                  <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-3">
                    <Field label="full name" value={contactDraft.name} onChange={v => setContactDraft(p => ({ ...p, name: v }))} placeholder="Your Name" />
                    <Field label="phone" value={contactDraft.phone} onChange={v => setContactDraft(p => ({ ...p, phone: v }))} placeholder="+1 (555) 000-0000" />
                    <Field label="email" value={contactDraft.email} onChange={v => setContactDraft(p => ({ ...p, email: v }))} placeholder="you@email.com" />
                    <Field label="linkedin" value={contactDraft.linkedin} onChange={v => setContactDraft(p => ({ ...p, linkedin: v }))} placeholder="handle" />
                    <Field label="github" value={contactDraft.github} onChange={v => setContactDraft(p => ({ ...p, github: v }))} placeholder="handle" />
                    <Field label="portfolio" value={contactDraft.portfolio} onChange={v => setContactDraft(p => ({ ...p, portfolio: v }))} placeholder="https://..." />
                  </motion.div>
                ) : (
                  <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {profile.contact.name ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-bold text-porcelain">{profile.contact.name}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#94a3b8]">
                          {profile.contact.email    && <span>{profile.contact.email}</span>}
                          {profile.contact.linkedin && <span>li/{profile.contact.linkedin}</span>}
                          {profile.contact.github   && <span>gh/{profile.contact.github}</span>}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#4a7090] italic">// no contact yet — click edit</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* sections */}
          <div className="flex flex-col gap-6">
            <AnimatePresence>
              {sections.map(sectionType => {
                const meta     = SECTION_META[sectionType]
                const isAdding = addingIn === sectionType
                const editId   = eId(sectionType)

                return (
                  <motion.div key={sectionType}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
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
                        <PillBtn variant="default" onClick={() => { setAddingIn(isAdding ? null : sectionType); setEditingEntry(null); setDraftEntry(null) }}>
                          {isAdding ? <X size={11} /> : <Plus size={11} />}
                          {isAdding ? 'cancel' : 'add'}
                        </PillBtn>
                        <PillBtn variant="danger" onClick={() => removeSection(sectionType)}><Trash2 size={11} /></PillBtn>
                      </div>
                    </div>

                    {/* add form */}
                    <AnimatePresence>
                      {isAdding && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="border border-payne-gray/30 rounded-xl p-4 bg-[#060e20] mb-2">
                            {sectionType === 'education' && (
                              <EducationForm onSave={addEducation} onCancel={() => { setAddingIn(null); setDraftEntry(null) }}
                                onChange={d => setDraftEntry({ sectionType: 'education', id: null, data: d })} />
                            )}
                            {sectionType === 'experience' && (
                              <ExperienceForm onSave={addExperience} onCancel={() => { setAddingIn(null); setDraftEntry(null) }}
                                onChange={d => setDraftEntry({ sectionType: 'experience', id: null, data: d })} />
                            )}
                            {sectionType === 'projects' && (
                              <ProjectForm onSave={addProject} onCancel={() => { setAddingIn(null); setDraftEntry(null) }}
                                onChange={d => setDraftEntry({ sectionType: 'projects', id: null, data: d })} />
                            )}
                            {sectionType === 'skills' && (
                              <SkillsForm onSave={addSkill} onCancel={() => { setAddingIn(null); setDraftEntry(null) }}
                                onChange={d => setDraftEntry({ sectionType: 'skills', id: null, data: d })} />
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* entries */}
                    <div className="flex flex-col gap-2">

                      {/* education */}
                      {sectionType === 'education' && profile.education.map(entry => (
                        <div key={entry.id}>
                          <EntryCard expanded={expandedIds.has(entry.id)} onToggle={() => toggleExpand(entry.id)}
                            isEditing={editId === entry.id}
                            onEdit={() => {
                              if (editId === entry.id) { setEditingEntry(null); setDraftEntry(null) }
                              else { setEditingEntry({ type: 'education', id: entry.id }); setAddingIn(null); setDraftEntry(null); setExpandedIds(prev => { const n = new Set(prev); n.add(entry.id); return n }) }
                            }}
                            onDelete={() => deleteEducation(entry.id)}>
                            <div className="flex flex-col gap-1">
                              <p className="text-sm font-bold text-porcelain">{entry.school || '—'}</p>
                              <p className="text-xs text-[#94a3b8]">
                                {entry.degree}{entry.location ? ` · ${entry.location}` : ''}
                                {entry.dates && <span className="ml-2 text-payne-gray">{entry.dates}</span>}
                              </p>
                            </div>
                          </EntryCard>
                          <AnimatePresence>
                            {expandedIds.has(entry.id) && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                {editId === entry.id ? (
                                  <div className="border border-payne-gray/30 border-t-0 rounded-b-xl p-4 bg-[#060e20]">
                                    <EducationForm initial={entry} onSave={addEducation} onCancel={() => { setEditingEntry(null); setDraftEntry(null) }}
                                      onChange={d => setDraftEntry({ sectionType: 'education', id: entry.id, data: d })} />
                                  </div>
                                ) : (
                                  <div className="border border-[#1a3050] border-t-0 rounded-b-xl px-4 pb-4 pt-3 bg-[#08132a] flex flex-col gap-2">
                                    {entry.coursework && <p className="text-xs text-[#94a3b8]"><span className="text-payne-gray">coursework: </span>{entry.coursework}</p>}
                                    {entry.rawText ? <p className="text-xs text-[#94a3b8] leading-relaxed whitespace-pre-wrap">{entry.rawText}</p>
                                      : <p className="text-xs text-[#4a7090] italic">// no casual notes yet</p>}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}

                      {/* experience */}
                      {sectionType === 'experience' && profile.experience.map(entry => (
                        <div key={entry.id}>
                          <EntryCard expanded={expandedIds.has(entry.id)} onToggle={() => toggleExpand(entry.id)}
                            isEditing={editId === entry.id}
                            onEdit={() => {
                              if (editId === entry.id) { setEditingEntry(null); setDraftEntry(null) }
                              else { setEditingEntry({ type: 'experience', id: entry.id }); setAddingIn(null); setDraftEntry(null); setExpandedIds(prev => { const n = new Set(prev); n.add(entry.id); return n }) }
                            }}
                            onDelete={() => deleteExperience(entry.id)}>
                            <div className="flex flex-col gap-1">
                              <p className="text-sm font-bold text-porcelain">{entry.company || '—'}</p>
                              <p className="text-xs text-[#94a3b8]">
                                {entry.role}{entry.location ? ` · ${entry.location}` : ''}
                                {entry.dates && <span className="ml-2 text-payne-gray">{entry.dates}</span>}
                              </p>
                            </div>
                          </EntryCard>
                          <AnimatePresence>
                            {expandedIds.has(entry.id) && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                {editId === entry.id ? (
                                  <div className="border border-payne-gray/30 border-t-0 rounded-b-xl p-4 bg-[#060e20]">
                                    <ExperienceForm initial={entry} onSave={addExperience} onCancel={() => { setEditingEntry(null); setDraftEntry(null) }}
                                      onChange={d => setDraftEntry({ sectionType: 'experience', id: entry.id, data: d })} />
                                  </div>
                                ) : (
                                  <div className="border border-[#1a3050] border-t-0 rounded-b-xl px-4 pb-4 pt-3 bg-[#08132a] flex flex-col gap-2">
                                    {entry.bullets.length > 0 && (
                                      <div className="flex flex-col gap-1.5">
                                        {entry.bullets.map((b, i) => (
                                          <p key={i} className="text-xs text-[#94a3b8] flex gap-2"><span className="text-payne-gray shrink-0">◆</span><span>{b}</span></p>
                                        ))}
                                      </div>
                                    )}
                                    {entry.rawText ? <p className="text-xs text-[#94a3b8] leading-relaxed whitespace-pre-wrap">{entry.rawText}</p>
                                      : <p className="text-xs text-[#4a7090] italic">// no casual notes — edit to add</p>}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}

                      {/* projects */}
                      {sectionType === 'projects' && profile.projects.map(entry => (
                        <div key={entry.id}>
                          <EntryCard expanded={expandedIds.has(entry.id)} onToggle={() => toggleExpand(entry.id)}
                            isEditing={editId === entry.id}
                            onEdit={() => {
                              if (editId === entry.id) { setEditingEntry(null); setDraftEntry(null) }
                              else { setEditingEntry({ type: 'projects', id: entry.id }); setAddingIn(null); setDraftEntry(null); setExpandedIds(prev => { const n = new Set(prev); n.add(entry.id); return n }) }
                            }}
                            onDelete={() => deleteProject(entry.id)}>
                            <div className="flex flex-col gap-1">
                              <p className="text-sm font-bold text-porcelain">{entry.name || '—'}</p>
                              <p className="text-xs text-[#94a3b8]">
                                {entry.techStack}
                                {entry.dates && <span className="ml-2 text-payne-gray">{entry.dates}</span>}
                              </p>
                            </div>
                          </EntryCard>
                          <AnimatePresence>
                            {expandedIds.has(entry.id) && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                {editId === entry.id ? (
                                  <div className="border border-payne-gray/30 border-t-0 rounded-b-xl p-4 bg-[#060e20]">
                                    <ProjectForm initial={entry} onSave={addProject} onCancel={() => { setEditingEntry(null); setDraftEntry(null) }}
                                      onChange={d => setDraftEntry({ sectionType: 'projects', id: entry.id, data: d })} />
                                  </div>
                                ) : (
                                  <div className="border border-[#1a3050] border-t-0 rounded-b-xl px-4 pb-4 pt-3 bg-[#08132a] flex flex-col gap-2">
                                    {entry.bullets.length > 0 && (
                                      <div className="flex flex-col gap-1.5">
                                        {entry.bullets.map((b, i) => (
                                          <p key={i} className="text-xs text-[#94a3b8] flex gap-2"><span className="text-payne-gray shrink-0">◆</span><span>{b}</span></p>
                                        ))}
                                      </div>
                                    )}
                                    {entry.rawText ? <p className="text-xs text-[#94a3b8] leading-relaxed whitespace-pre-wrap">{entry.rawText}</p>
                                      : <p className="text-xs text-[#4a7090] italic">// no casual notes — edit to describe</p>}
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
                          {profile.skills.length === 0
                            ? <p className="text-xs text-[#4a7090] italic">// no skills yet</p>
                            : profile.skills.map(entry => (
                              <div key={entry.id} className="flex items-start gap-3 group">
                                <span className="text-xs text-payne-gray shrink-0 w-32 pt-px">{entry.category}</span>
                                <span className="text-xs text-[#94a3b8] flex-1 leading-relaxed">{entry.technologies}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {editId !== entry.id && (
                                    <>
                                      <PillBtn variant="ghost" onClick={() => { setEditingEntry({ type: 'skills', id: entry.id }); setDraftEntry(null) }}><Pencil size={10} /></PillBtn>
                                      <PillBtn variant="danger" onClick={() => deleteSkill(entry.id)}><Trash2 size={10} /></PillBtn>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))
                          }
                          <AnimatePresence>
                            {editingEntry?.type === 'skills' && editingEntry.id && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }} className="overflow-hidden pt-3 border-t border-[#1a3050] mt-1">
                                <SkillsForm initial={profile.skills.find(s => s.id === editingEntry.id)} onSave={addSkill}
                                  onCancel={() => { setEditingEntry(null); setDraftEntry(null) }}
                                  onChange={d => setDraftEntry({ sectionType: 'skills', id: editingEntry.id, data: d })} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {sectionType !== 'skills' && profile[sectionType].length === 0 && !isAdding && (
                        <p className="text-xs text-[#4a7090] italic px-1">// no {sectionType} entries — click [add]</p>
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
                <button onClick={() => setShowSectionPicker(p => !p)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2 rounded-full text-xs font-jetbrains border border-dashed transition-all cursor-pointer',
                    showSectionPicker
                      ? 'border-payne-gray text-porcelain bg-[#08132a]'
                      : 'border-[#1a3050] text-[#4a7090] hover:border-payne-gray hover:text-[#94a3b8]',
                  )}
                >
                  <Plus size={12} /> add section
                </button>
                <AnimatePresence>
                  {showSectionPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#08132a] border border-[#1a3050] rounded-xl overflow-hidden shadow-xl z-10 min-w-[170px]"
                    >
                      {availableSections.map(s => (
                        <button key={s} onClick={() => addSection(s)}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-[#94a3b8] hover:bg-[#0c1a38] hover:text-porcelain transition-colors cursor-pointer">
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
            <button onClick={() => setSidebarOpen(true)}
              className="text-[#4a7090] hover:text-[#94a3b8] transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-[#0c1a38]">
              <PanelLeftOpen size={14} />
            </button>
            <span className="text-[10px] text-[#4a7090] font-jetbrains [writing-mode:vertical-rl] tracking-widest rotate-180 mt-2">profile</span>
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
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse ml-1" title="live" />
          </div>
          <div className="flex items-center gap-2">
            <DropdownBtn label="export" icon={<Download size={11} />} align="right">
              <DropItem onClick={handleExportTex}><FileText size={12} className="text-payne-gray" /> download .tex</DropItem>
              <DropItem onClick={handleExportMd}><FileText size={12} className="text-payne-gray" /> download .md</DropItem>
            </DropdownBtn>
            <PillBtn variant="accent" onClick={handlePrint}><Printer size={11} /> print PDF</PillBtn>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[820px] mx-auto shadow-2xl rounded overflow-hidden">
            <iframe
              ref={iframeRef}
              srcDoc={resumeHtmlFinal}
              title="Resume Preview"
              sandbox="allow-same-origin"
              className="w-full border-0 bg-white"
              style={{ minHeight: '1056px' }}
            />
          </div>
        </div>

      </div>
    </div>
  )
}
