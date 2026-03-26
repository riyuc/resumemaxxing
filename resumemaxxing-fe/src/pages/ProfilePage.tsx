import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Plus, X, Trash2, Pencil, Check, GraduationCap, Briefcase,
  Code2, Wrench, Upload, Download, FileText,
  FlaskConical, Users, Heart, BadgeCheck, Trophy,
  GripHorizontal, ChevronDown, ChevronUp, RotateCcw,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Link } from 'react-router'
import { parseTexResume } from '@/utils/texParser'
import { exportAsTex, exportAsMd, downloadFile } from '@/utils/profileExport'
import type {
  ProfileData, EducationEntry, ExperienceEntry, ProjectEntry, SkillsEntry,
  CertificationEntry, AwardEntry, SectionType,
} from '@/types/profile'
import { cn } from '@/lib/utils'
import PillBtn from '@/components/ui/pill-btn'
import EditableBullets from '@/components/ui/editable-bullets'
import { DropdownBtn, DropItem } from '@/components/ui/dropdown-btn'

// ─── constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY   = 'agentic-resume-profile'
const SECTIONS_KEY  = 'agentic-resume-sections'
const POSITIONS_KEY = 'agentic-resume-positions'

const SECTION_META: Record<SectionType, { label: string; icon: React.ReactNode; placeholder: string; description: string; color: string }> = {
  education:      { label: 'EDUCATION',      icon: <GraduationCap size={13} />, color: '#6ea8d0', description: 'Degrees, diplomas, coursework',         placeholder: 'e.g. studied CS here, took AI/OS courses, 3.8 GPA...' },
  experience:     { label: 'EXPERIENCE',     icon: <Briefcase     size={13} />, color: '#7ec8a0', description: 'Jobs, internships, co-ops',             placeholder: 'e.g. worked on payments infra, improved success rates...' },
  projects:       { label: 'PROJECTS',       icon: <Code2         size={13} />, color: '#c89a6e', description: 'Side projects, hackathons, open source', placeholder: 'e.g. built a RAG pipeline for X, demoed at hackathon...' },
  skills:         { label: 'SKILLS',         icon: <Wrench        size={13} />, color: '#a07ec8', description: 'Languages, tools, frameworks',          placeholder: '' },
  research:       { label: 'RESEARCH',       icon: <FlaskConical  size={13} />, color: '#6ec8c8', description: 'Academic or industry research',         placeholder: 'e.g. NLP for low-resource languages, published at ACL...' },
  leadership:     { label: 'LEADERSHIP',     icon: <Users         size={13} />, color: '#d08080', description: 'Clubs, orgs, student government',       placeholder: 'e.g. VP of the AI club, organized weekly workshops...' },
  volunteering:   { label: 'VOLUNTEERING',   icon: <Heart         size={13} />, color: '#d06ea8', description: 'Community work, non-profits',           placeholder: 'e.g. tutored underprivileged students every Saturday...' },
  certifications: { label: 'CERTIFICATIONS', icon: <BadgeCheck    size={13} />, color: '#c8c86e', description: 'Certs, licenses, online courses',       placeholder: 'e.g. completed while learning distributed systems...' },
  awards:         { label: 'AWARDS',         icon: <Trophy        size={13} />, color: '#d0a06e', description: 'Scholarships, prizes, recognition',     placeholder: 'e.g. won for building a sign language translator...' },
}

const ALL_SECTION_TYPES: SectionType[] = [
  'education', 'experience', 'projects', 'skills',
  'research', 'leadership', 'volunteering', 'certifications', 'awards',
]

const DEFAULT_POSITIONS: Record<SectionType, { x: number; y: number }> = {
  education:      { x: 60,   y: 80  },
  experience:     { x: 420,  y: 80  },
  projects:       { x: 780,  y: 80  },
  skills:         { x: 60,   y: 460 },
  research:       { x: 420,  y: 460 },
  leadership:     { x: 780,  y: 460 },
  volunteering:   { x: 60,   y: 820 },
  certifications: { x: 420,  y: 820 },
  awards:         { x: 780,  y: 820 },
}

const DEFAULT_PROFILE: ProfileData = {
  contact: { name: '', phone: '', email: '', linkedin: '', github: '', portfolio: '' },
  education: [], experience: [], projects: [], skills: [],
  research: [], leadership: [], volunteering: [], certifications: [], awards: [],
}

// ─── storage ──────────────────────────────────────────────────────────────────

function loadProfile(): ProfileData {
  try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : DEFAULT_PROFILE }
  catch { return DEFAULT_PROFILE }
}
function loadSections(): SectionType[] {
  try { const s = localStorage.getItem(SECTIONS_KEY); return s ? JSON.parse(s) : [] }
  catch { return [] }
}
function loadPositions(): Record<SectionType, { x: number; y: number }> {
  try { const s = localStorage.getItem(POSITIONS_KEY); return s ? { ...DEFAULT_POSITIONS, ...JSON.parse(s) } : DEFAULT_POSITIONS }
  catch { return DEFAULT_POSITIONS }
}
function sectionsFromData(data: ProfileData): SectionType[] {
  return ALL_SECTION_TYPES.filter(s => (data[s] as unknown[]).length > 0)
}

// ─── field atom ───────────────────────────────────────────────────────────────

const Field = ({
  label, value, onChange, placeholder, multiline = false,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[9px] text-[#456677] tracking-widest uppercase font-jetbrains">{label}</span>
    {multiline ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
        className="bg-[#020810] border border-[#1a3050] rounded p-2 text-[11px] text-[#c8d8f0] placeholder:text-[#2a4060] focus:outline-none focus:border-[#456677] resize-none font-jetbrains leading-relaxed" />
    ) : (
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="bg-[#020810] border border-[#1a3050] rounded p-2 text-[11px] text-[#c8d8f0] placeholder:text-[#2a4060] focus:outline-none focus:border-[#456677] font-jetbrains" />
    )}
  </div>
)

// ─── entry forms ──────────────────────────────────────────────────────────────

const EducationForm = ({ initial, onSave, onCancel }: { initial?: Partial<EducationEntry>; onSave: (e: Omit<EducationEntry, 'id'>) => void; onCancel: () => void }) => {
  const [school, setSchool]     = useState(initial?.school ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [degree, setDegree]     = useState(initial?.degree ?? '')
  const [dates, setDates]       = useState(initial?.dates ?? '')
  const [coursework, setCw]     = useState(initial?.coursework ?? '')
  const [rawText, setRaw]       = useState(initial?.rawText ?? '')
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2">
        <Field label="school" value={school} onChange={setSchool} placeholder="Concordia University" />
        <Field label="location" value={location} onChange={setLocation} placeholder="Montreal, QC" />
        <Field label="degree" value={degree} onChange={setDegree} placeholder="B.Sc. Computer Science" />
        <Field label="dates" value={dates} onChange={setDates} placeholder="2022 – 2026" />
      </div>
      <Field label="coursework" value={coursework} onChange={setCw} placeholder="OS, Algorithms, AI..." />
      <Field label="// tell us about your time here" value={rawText} onChange={setRaw} placeholder="clubs, achievements, what you learned..." multiline />
      <div className="flex gap-1.5 pt-1">
        <PillBtn variant="accent" onClick={() => onSave({ school, location, degree, dates, coursework, rawText })}><Check size={11} /> save</PillBtn>
        <PillBtn variant="ghost" onClick={onCancel}><X size={11} /> cancel</PillBtn>
      </div>
    </div>
  )
}

const ExperienceForm = ({ initial, onSave, onCancel }: { initial?: Partial<ExperienceEntry>; onSave: (e: Omit<ExperienceEntry, 'id'>) => void; onCancel: () => void }) => {
  const [company, setCompany]   = useState(initial?.company ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [role, setRole]         = useState(initial?.role ?? '')
  const [dates, setDates]       = useState(initial?.dates ?? '')
  const [bullets, setBullets]   = useState(initial?.bullets ?? [])
  const [rawText, setRaw]       = useState(initial?.rawText ?? '')
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2">
        <Field label="company" value={company} onChange={setCompany} placeholder="Shopify" />
        <Field label="location" value={location} onChange={setLocation} placeholder="Toronto, ON" />
        <Field label="role" value={role} onChange={setRole} placeholder="Software Engineering Intern" />
        <Field label="dates" value={dates} onChange={setDates} placeholder="May – Dec 2025" />
      </div>
      <EditableBullets bullets={bullets} onChange={setBullets} />
      <Field label="// what did you do there?" value={rawText} onChange={setRaw} placeholder="tech used, impact, what you shipped..." multiline />
      <div className="flex gap-1.5 pt-1">
        <PillBtn variant="accent" onClick={() => onSave({ company, location, role, dates, bullets, rawText })}><Check size={11} /> save</PillBtn>
        <PillBtn variant="ghost" onClick={onCancel}><X size={11} /> cancel</PillBtn>
      </div>
    </div>
  )
}

const ProjectForm = ({ initial, onSave, onCancel }: { initial?: Partial<ProjectEntry>; onSave: (e: Omit<ProjectEntry, 'id'>) => void; onCancel: () => void }) => {
  const [name, setName]       = useState(initial?.name ?? '')
  const [tech, setTech]       = useState(initial?.techStack ?? '')
  const [dates, setDates]     = useState(initial?.dates ?? '')
  const [bullets, setBullets] = useState(initial?.bullets ?? [])
  const [rawText, setRaw]     = useState(initial?.rawText ?? '')
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2">
        <Field label="project name" value={name} onChange={setName} placeholder="AI Resume Builder" />
        <Field label="dates" value={dates} onChange={setDates} placeholder="Hackathon, 2025" />
      </div>
      <Field label="tech stack" value={tech} onChange={setTech} placeholder="Python, React, Anthropic API..." />
      <EditableBullets bullets={bullets} onChange={setBullets} />
      <Field label="// describe it casually" value={rawText} onChange={setRaw} placeholder="what it does, how you built it, results..." multiline />
      <div className="flex gap-1.5 pt-1">
        <PillBtn variant="accent" onClick={() => onSave({ name, techStack: tech, dates, bullets, rawText })}><Check size={11} /> save</PillBtn>
        <PillBtn variant="ghost" onClick={onCancel}><X size={11} /> cancel</PillBtn>
      </div>
    </div>
  )
}

const SkillsForm = ({ initial, onSave, onCancel }: { initial?: Partial<SkillsEntry>; onSave: (e: Omit<SkillsEntry, 'id'>) => void; onCancel: () => void }) => {
  const [category, setCat]  = useState(initial?.category ?? '')
  const [techs, setTechs]   = useState(initial?.technologies ?? '')
  return (
    <div className="flex flex-col gap-2.5">
      <Field label="category" value={category} onChange={setCat} placeholder="Languages, Frameworks, Cloud..." />
      <Field label="technologies" value={techs} onChange={setTechs} placeholder="Python, TypeScript, Go..." />
      <div className="flex gap-1.5 pt-1">
        <PillBtn variant="accent" onClick={() => onSave({ category, technologies: techs })}><Check size={11} /> save</PillBtn>
        <PillBtn variant="ghost" onClick={onCancel}><X size={11} /> cancel</PillBtn>
      </div>
    </div>
  )
}

const CertificationForm = ({ initial, onSave, onCancel }: { initial?: Partial<CertificationEntry>; onSave: (e: Omit<CertificationEntry, 'id'>) => void; onCancel: () => void }) => {
  const [title, setTitle]   = useState(initial?.title ?? '')
  const [issuer, setIssuer] = useState(initial?.issuer ?? '')
  const [date, setDate]     = useState(initial?.date ?? '')
  const [rawText, setRaw]   = useState(initial?.rawText ?? '')
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2">
        <Field label="title" value={title} onChange={setTitle} placeholder="AWS Certified Developer" />
        <Field label="issued by" value={issuer} onChange={setIssuer} placeholder="Amazon Web Services" />
        <Field label="date" value={date} onChange={setDate} placeholder="2024" />
      </div>
      <Field label="notes" value={rawText} onChange={setRaw} placeholder="why you got it, what you learned..." multiline />
      <div className="flex gap-1.5 pt-1">
        <PillBtn variant="accent" onClick={() => onSave({ title, issuer, date, rawText })}><Check size={11} /> save</PillBtn>
        <PillBtn variant="ghost" onClick={onCancel}><X size={11} /> cancel</PillBtn>
      </div>
    </div>
  )
}

const AwardForm = ({ initial, onSave, onCancel }: { initial?: Partial<AwardEntry>; onSave: (e: Omit<AwardEntry, 'id'>) => void; onCancel: () => void }) => {
  const [title, setTitle]   = useState(initial?.title ?? '')
  const [issuer, setIssuer] = useState(initial?.issuer ?? '')
  const [date, setDate]     = useState(initial?.date ?? '')
  const [desc, setDesc]     = useState(initial?.description ?? '')
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2">
        <Field label="award" value={title} onChange={setTitle} placeholder="Dean's List" />
        <Field label="issued by" value={issuer} onChange={setIssuer} placeholder="Concordia University" />
        <Field label="date" value={date} onChange={setDate} placeholder="Fall 2024" />
      </div>
      <Field label="description" value={desc} onChange={setDesc} placeholder="what it was for, why it mattered..." multiline />
      <div className="flex gap-1.5 pt-1">
        <PillBtn variant="accent" onClick={() => onSave({ title, issuer, date, description: desc })}><Check size={11} /> save</PillBtn>
        <PillBtn variant="ghost" onClick={onCancel}><X size={11} /> cancel</PillBtn>
      </div>
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  // ── profile state ──
  const [profile, setProfile]   = useState<ProfileData>(loadProfile)
  const [sections, setSections] = useState<SectionType[]>(() => {
    const stored = loadSections()
    return stored.length ? stored : sectionsFromData(loadProfile())
  })

  // ── canvas state ──
  const [pan, setPan]           = useState({ x: 80, y: 80 })
  const [zoom, setZoom]         = useState(1)
  const [positions, setPositions] = useState<Record<SectionType, { x: number; y: number }>>(loadPositions)

  // ── ui state ──
  const [addingIn, setAddingIn]   = useState<SectionType | null>(null)
  const [editingEntry, setEditingEntry] = useState<{ type: SectionType; id: string } | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<SectionType>>(new Set())
  const [expandedIds, setExpandedIds]   = useState<Set<string>>(new Set())
  const [showPicker, setShowPicker]     = useState(false)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [pdfImporting, setPdfImporting] = useState(false)
  const [draggingCard, setDraggingCard] = useState<SectionType | null>(null)

  // ── refs ──
  const fileRef    = useRef<HTMLInputElement>(null)
  const pdfFileRef = useRef<HTMLInputElement>(null)
  const canvasRef  = useRef<HTMLDivElement>(null)
  const panDrag    = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null)
  const cardDrag   = useRef<{ type: SectionType; startX: number; startY: number; cardX: number; cardY: number; moved: boolean } | null>(null)

  // ── persist ──
  useEffect(() => { localStorage.setItem(STORAGE_KEY,   JSON.stringify(profile))   }, [profile])
  useEffect(() => { localStorage.setItem(SECTIONS_KEY,  JSON.stringify(sections))  }, [sections])
  useEffect(() => { localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions)) }, [positions])

  // ── canvas mouse handlers ──
  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-card]')) return
    panDrag.current = { startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y }
  }

  const onCardHeaderMouseDown = (e: React.MouseEvent, type: SectionType) => {
    e.stopPropagation()
    cardDrag.current = { type, startX: e.clientX, startY: e.clientY, cardX: positions[type].x, cardY: positions[type].y, moved: false }
    setDraggingCard(type)
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (panDrag.current) {
        const dx = e.clientX - panDrag.current.startX
        const dy = e.clientY - panDrag.current.startY
        setPan({ x: panDrag.current.startPanX + dx, y: panDrag.current.startPanY + dy })
      }
      if (cardDrag.current) {
        const dx = (e.clientX - cardDrag.current.startX) / zoom
        const dy = (e.clientY - cardDrag.current.startY) / zoom
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) cardDrag.current.moved = true
        if (cardDrag.current.moved) {
          const type = cardDrag.current.type
          setPositions(prev => ({ ...prev, [type]: { x: cardDrag.current!.cardX + dx, y: cardDrag.current!.cardY + dy } }))
        }
      }
    }
    const onUp = (_e: MouseEvent) => {
      if (cardDrag.current && !cardDrag.current.moved) {
        // was a click — toggle expand
        const type = cardDrag.current.type
        setExpandedCards(prev => {
          const next = new Set(prev)
          next.has(type) ? next.delete(type) : next.add(type)
          return next
        })
      }
      panDrag.current  = null
      cardDrag.current = null
      setDraggingCard(null)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
  }, [zoom])

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const factor  = e.deltaY < 0 ? 1.08 : 0.93
    const newZoom = Math.max(0.25, Math.min(2.5, zoom * factor))
    const rect    = canvasRef.current!.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    setPan(p => ({ x: cx - (cx - p.x) * (newZoom / zoom), y: cy - (cy - p.y) * (newZoom / zoom) }))
    setZoom(newZoom)
  }

  const resetView = () => { setPan({ x: 80, y: 80 }); setZoom(1) }

  // ── section management ──
  const addSection = (type: SectionType) => {
    if (!sections.includes(type)) setSections(prev => [...prev, type])
    setShowPicker(false)
    setExpandedCards(prev => new Set(prev).add(type))
    setAddingIn(type)
  }
  const removeSection = (type: SectionType) => {
    setSections(prev => prev.filter(s => s !== type))
    setProfile(p => ({ ...p, [type]: [] }))
    if (addingIn === type) setAddingIn(null)
  }

  // ── CRUD ──
  const addEducation = useCallback((entry: Omit<EducationEntry, 'id'>) => {
    if (editingEntry?.type === 'education') {
      setProfile(p => ({ ...p, education: p.education.map(e => e.id === editingEntry.id ? { ...entry, id: e.id } : e) }))
      setEditingEntry(null)
    } else {
      const id = crypto.randomUUID()
      setProfile(p => ({ ...p, education: [...p.education, { ...entry, id }] }))
      setExpandedIds(prev => new Set(prev).add(id))
      setAddingIn(null)
    }
  }, [editingEntry])

  const addExperience = useCallback((entry: Omit<ExperienceEntry, 'id'>) => {
    if (editingEntry?.type === 'experience') {
      setProfile(p => ({ ...p, experience: p.experience.map(e => e.id === editingEntry.id ? { ...entry, id: e.id } : e) }))
      setEditingEntry(null)
    } else {
      const id = crypto.randomUUID()
      setProfile(p => ({ ...p, experience: [...p.experience, { ...entry, id }] }))
      setExpandedIds(prev => new Set(prev).add(id))
      setAddingIn(null)
    }
  }, [editingEntry])

  const addProject = useCallback((entry: Omit<ProjectEntry, 'id'>) => {
    if (editingEntry?.type === 'projects') {
      setProfile(p => ({ ...p, projects: p.projects.map(e => e.id === editingEntry.id ? { ...entry, id: e.id } : e) }))
      setEditingEntry(null)
    } else {
      const id = crypto.randomUUID()
      setProfile(p => ({ ...p, projects: [...p.projects, { ...entry, id }] }))
      setExpandedIds(prev => new Set(prev).add(id))
      setAddingIn(null)
    }
  }, [editingEntry])

  const addSkill = useCallback((entry: Omit<SkillsEntry, 'id'>) => {
    if (editingEntry?.type === 'skills') {
      setProfile(p => ({ ...p, skills: p.skills.map(e => e.id === editingEntry.id ? { ...entry, id: e.id } : e) }))
      setEditingEntry(null)
    } else {
      setProfile(p => ({ ...p, skills: [...p.skills, { ...entry, id: crypto.randomUUID() }] }))
      setAddingIn(null)
    }
  }, [editingEntry])

  const makeExpCrud = (key: 'research' | 'leadership' | 'volunteering') => ({
    add: (entry: Omit<ExperienceEntry, 'id'>) => {
      if (editingEntry?.type === key) {
        setProfile(p => ({ ...p, [key]: (p[key] as ExperienceEntry[]).map(e => e.id === editingEntry.id ? { ...entry, id: e.id } : e) }))
        setEditingEntry(null)
      } else {
        const id = crypto.randomUUID()
        setProfile(p => ({ ...p, [key]: [...(p[key] as ExperienceEntry[]), { ...entry, id }] }))
        setExpandedIds(prev => new Set(prev).add(id))
        setAddingIn(null)
      }
    },
    del: (id: string) => setProfile(p => ({ ...p, [key]: (p[key] as ExperienceEntry[]).filter(e => e.id !== id) })),
  })
  const { add: addResearch,     del: deleteResearch     } = makeExpCrud('research')
  const { add: addLeadership,   del: deleteLeadership   } = makeExpCrud('leadership')
  const { add: addVolunteering, del: deleteVolunteering  } = makeExpCrud('volunteering')

  const addCertification = useCallback((entry: Omit<CertificationEntry, 'id'>) => {
    if (editingEntry?.type === 'certifications') {
      setProfile(p => ({ ...p, certifications: p.certifications.map(e => e.id === editingEntry.id ? { ...entry, id: e.id } : e) }))
      setEditingEntry(null)
    } else {
      const id = crypto.randomUUID()
      setProfile(p => ({ ...p, certifications: [...p.certifications, { ...entry, id }] }))
      setExpandedIds(prev => new Set(prev).add(id))
      setAddingIn(null)
    }
  }, [editingEntry])

  const addAward = useCallback((entry: Omit<AwardEntry, 'id'>) => {
    if (editingEntry?.type === 'awards') {
      setProfile(p => ({ ...p, awards: p.awards.map(e => e.id === editingEntry.id ? { ...entry, id: e.id } : e) }))
      setEditingEntry(null)
    } else {
      const id = crypto.randomUUID()
      setProfile(p => ({ ...p, awards: [...p.awards, { ...entry, id }] }))
      setExpandedIds(prev => new Set(prev).add(id))
      setAddingIn(null)
    }
  }, [editingEntry])

  // ── import/export ──
  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setPdfImporting(true)
    try {
      const { extractTextFromPdf, parsePdfText } = await import('@/utils/pdfParser')
      const text = await extractTextFromPdf(file)
      const parsed = parsePdfText(text)
      setProfile(prev => ({ ...DEFAULT_PROFILE, ...prev, ...parsed, contact: { ...prev.contact, ...parsed.contact } }))
      setSections(prev => { const m = [...prev]; sectionsFromData({ ...DEFAULT_PROFILE, ...parsed }).forEach(s => { if (!m.includes(s)) m.push(s) }); return m })
      setImportStatus('success'); setTimeout(() => setImportStatus('idle'), 3000)
    } catch { setImportStatus('error'); setTimeout(() => setImportStatus('idle'), 3000) }
    finally { setPdfImporting(false); e.target.value = '' }
  }
  const handleTexImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const parsed = parseTexResume(ev.target?.result as string)
        setProfile(parsed)
        setSections(prev => { const m = [...prev]; sectionsFromData(parsed).forEach(s => { if (!m.includes(s)) m.push(s) }); return m })
        setImportStatus('success'); setTimeout(() => setImportStatus('idle'), 3000)
      } catch { setImportStatus('error'); setTimeout(() => setImportStatus('idle'), 3000) }
    }
    reader.readAsText(file); e.target.value = ''
  }
  const handleExportTex = () => downloadFile(exportAsTex(profile), `${profile.contact.name?.replace(/\s+/g, '_') || 'resume'}_resume.tex`, 'text/plain')
  const handleExportMd  = () => downloadFile(exportAsMd(profile),  `${profile.contact.name?.replace(/\s+/g, '_') || 'resume'}_resume.md`,  'text/markdown')

  // ── helpers ──
  const getEntries = (type: SectionType) => (profile[type] as unknown[]) ?? []
  const editingId  = editingEntry?.id
  const availableSections = ALL_SECTION_TYPES.filter(s => !sections.includes(s))

  // ─────────────────────────────────────────────────────────────────────────────
  // ── render ──
  // ─────────────────────────────────────────────────────────────────────────────
  const dotSize  = Math.max(24 * zoom, 8)
  const dotStyle: React.CSSProperties = {
    backgroundImage: `radial-gradient(circle, rgba(26,48,80,0.9) 1px, transparent 1px)`,
    backgroundSize:  `${dotSize}px ${dotSize}px`,
    backgroundPosition: `${pan.x % dotSize}px ${pan.y % dotSize}px`,
  }

  return (
    <div className="relative w-full overflow-hidden bg-[#030b18]" style={{ height: 'calc(100vh - 56px)' }}>

      {/* ── dot grid ── */}
      <div className="absolute inset-0 pointer-events-none" style={dotStyle} />

      {/* ── top HUD ── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-3 pointer-events-none">
        {/* left: branding */}
        <div className="pointer-events-auto flex items-center gap-3">
          <div className="flex flex-col leading-none">
            <span className="font-jetbrains text-[10px] text-[#456677] tracking-[0.3em] uppercase">your</span>
            <span className="font-jetbrains text-lg font-bold text-[#e8f0fc] tracking-tight leading-none">life.</span>
          </div>
          <div className="w-px h-8 bg-[#1a3050]" />
          <p className="font-jetbrains text-[10px] text-[#4a7090] max-w-[200px] leading-relaxed hidden md:block">
            everything you've ever done — your source of truth
          </p>
        </div>

        {/* right: controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          <AnimatePresence>
            {importStatus !== 'idle' && (
              <motion.span initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className={cn('text-[11px] font-jetbrains', importStatus === 'success' ? 'text-[#4ade80]' : 'text-[#ef4444]')}>
                {importStatus === 'success' ? '✓ imported' : '✗ parse error'}
              </motion.span>
            )}
          </AnimatePresence>

          <DropdownBtn label="import" icon={<Upload size={11} />} align="right">
            <DropItem onClick={() => fileRef.current?.click()}><Upload size={11} /> .tex resume</DropItem>
            <DropItem onClick={() => pdfFileRef.current?.click()}><Upload size={11} /> {pdfImporting ? 'parsing...' : '.pdf resume'}</DropItem>
          </DropdownBtn>
          <DropdownBtn label="export" icon={<Download size={11} />} align="right">
            <DropItem onClick={handleExportTex}><Download size={11} /> .tex</DropItem>
            <DropItem onClick={handleExportMd}><FileText size={11} /> .md</DropItem>
          </DropdownBtn>
          <Link to="/create"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-jetbrains bg-[#456677] text-white hover:bg-[#5a7d91] transition-all">
            create resume ↗
          </Link>
          <input ref={fileRef}    type="file" accept=".tex" className="hidden" onChange={handleTexImport} />
          <input ref={pdfFileRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfImport} />
        </div>
      </div>

      {/* ── canvas ── */}
      <div
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor: panDrag.current ? 'grabbing' : 'grab' }}
        onMouseDown={onCanvasMouseDown}
        onWheel={onWheel}
      >
        <div
          style={{
            position: 'absolute',
            transformOrigin: '0 0',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            willChange: 'transform',
          }}
        >
          {sections.map(type => {
            const meta     = SECTION_META[type]
            const entries  = getEntries(type)
            const expanded = expandedCards.has(type)
            const isAdding = addingIn === type

            return (
              <motion.div
                key={type}
                data-card
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  position: 'absolute',
                  left: positions[type].x,
                  top:  positions[type].y,
                  width: 300,
                  zIndex: draggingCard === type ? 100 : 1,
                  cursor: draggingCard === type ? 'grabbing' : 'default',
                }}
              >
                {/* card */}
                <div className={cn(
                  'rounded-xl overflow-hidden border transition-shadow duration-200',
                  draggingCard === type
                    ? 'border-[#2a4870] shadow-[0_8px_40px_rgba(0,0,0,0.6)]'
                    : 'border-[#1a3050] shadow-[0_4px_24px_rgba(0,0,0,0.4)]',
                )}>

                  {/* ── header (drag handle) ── */}
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 select-none"
                    style={{ background: '#0a1628', cursor: draggingCard === type ? 'grabbing' : 'grab', borderBottom: expanded ? '1px solid #1a3050' : 'none' }}
                    onMouseDown={e => onCardHeaderMouseDown(e, type)}
                  >
                    <GripHorizontal size={12} className="text-[#2a4060] flex-shrink-0" />
                    <span style={{ color: meta.color }} className="flex-shrink-0">{meta.icon}</span>
                    <span className="font-jetbrains text-[10px] font-bold tracking-widest flex-1" style={{ color: meta.color }}>
                      {meta.label}
                    </span>
                    <span className="font-jetbrains text-[9px] text-[#2a4060]">
                      {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                    </span>
                    {expanded ? <ChevronUp size={11} className="text-[#456677]" /> : <ChevronDown size={11} className="text-[#456677]" />}
                    <button
                      className="text-[#2a4060] hover:text-[#ef4444] transition-colors cursor-pointer ml-1"
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); removeSection(type) }}
                    >
                      <X size={11} />
                    </button>
                  </div>

                  {/* ── body ── */}
                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                        style={{ background: '#060e20' }}
                      >
                        <div className="flex flex-col gap-0" onMouseDown={e => e.stopPropagation()}>

                          {/* ── entry list ── */}
                          {type === 'skills' && profile.skills.map(entry => (
                            <div key={entry.id} className="border-b border-[#0d1a2e]">
                              {editingId === entry.id ? (
                                <div className="p-3"><SkillsForm initial={entry} onSave={addSkill} onCancel={() => setEditingEntry(null)} /></div>
                              ) : (
                                <div className="flex items-center justify-between px-3 py-2 group hover:bg-[#080f1e]">
                                  <div>
                                    <p className="font-jetbrains text-[11px] text-[#94a3b8] font-semibold">{entry.category || '—'}</p>
                                    <p className="font-jetbrains text-[10px] text-[#4a7090] mt-0.5 leading-relaxed">{entry.technologies}</p>
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingEntry({ type: 'skills', id: entry.id }); setAddingIn(null) }} className="text-[#456677] hover:text-[#94a3b8] cursor-pointer"><Pencil size={10} /></button>
                                    <button onClick={() => setProfile(p => ({ ...p, skills: p.skills.filter(e => e.id !== entry.id) }))} className="text-[#456677] hover:text-[#ef4444] cursor-pointer"><Trash2 size={10} /></button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {type === 'education' && profile.education.map(entry => (
                            <EntryRow key={entry.id} title={entry.school} sub={entry.degree} date={entry.dates}
                              expanded={expandedIds.has(entry.id)} onToggle={() => setExpandedIds(prev => { const n = new Set(prev); n.has(entry.id) ? n.delete(entry.id) : n.add(entry.id); return n })}
                              onEdit={() => { setEditingEntry({ type: 'education', id: entry.id }); setAddingIn(null) }}
                              onDelete={() => setProfile(p => ({ ...p, education: p.education.filter(e => e.id !== entry.id) }))}>
                              {editingId === entry.id
                                ? <div className="p-3 border-t border-[#0d1a2e]"><EducationForm initial={entry} onSave={addEducation} onCancel={() => setEditingEntry(null)} /></div>
                                : entry.coursework && <p className="px-3 pb-2 font-jetbrains text-[10px] text-[#4a7090]">coursework: {entry.coursework}</p>
                              }
                            </EntryRow>
                          ))}

                          {(type === 'experience' || type === 'research' || type === 'leadership' || type === 'volunteering') &&
                            (profile[type] as ExperienceEntry[]).map(entry => {
                              const saveHandlers: Record<string, (e: Omit<ExperienceEntry, 'id'>) => void> = {
                                experience: addExperience, research: addResearch, leadership: addLeadership, volunteering: addVolunteering
                              }
                              const delHandlers: Record<string, (id: string) => void> = {
                                experience: (id) => setProfile(p => ({ ...p, experience: p.experience.filter(e => e.id !== id) })),
                                research: deleteResearch, leadership: deleteLeadership, volunteering: deleteVolunteering,
                              }
                              return (
                                <EntryRow key={entry.id} title={entry.company} sub={entry.role} date={entry.dates}
                                  expanded={expandedIds.has(entry.id)} onToggle={() => setExpandedIds(prev => { const n = new Set(prev); n.has(entry.id) ? n.delete(entry.id) : n.add(entry.id); return n })}
                                  onEdit={() => { setEditingEntry({ type, id: entry.id }); setAddingIn(null) }}
                                  onDelete={() => delHandlers[type](entry.id)}>
                                  {editingId === entry.id
                                    ? <div className="p-3 border-t border-[#0d1a2e]"><ExperienceForm initial={entry} onSave={saveHandlers[type]} onCancel={() => setEditingEntry(null)} /></div>
                                    : entry.bullets.length > 0 && <ul className="px-3 pb-2 flex flex-col gap-0.5">{entry.bullets.slice(0, 2).map((b, i) => <li key={i} className="font-jetbrains text-[10px] text-[#4a7090] flex gap-1.5"><span className="text-[#456677] flex-shrink-0">◆</span>{b}</li>)}</ul>
                                  }
                                </EntryRow>
                              )
                            })
                          }

                          {type === 'projects' && profile.projects.map(entry => (
                            <EntryRow key={entry.id} title={entry.name} sub={entry.techStack} date={entry.dates}
                              expanded={expandedIds.has(entry.id)} onToggle={() => setExpandedIds(prev => { const n = new Set(prev); n.has(entry.id) ? n.delete(entry.id) : n.add(entry.id); return n })}
                              onEdit={() => { setEditingEntry({ type: 'projects', id: entry.id }); setAddingIn(null) }}
                              onDelete={() => setProfile(p => ({ ...p, projects: p.projects.filter(e => e.id !== entry.id) }))}>
                              {editingId === entry.id
                                ? <div className="p-3 border-t border-[#0d1a2e]"><ProjectForm initial={entry} onSave={addProject} onCancel={() => setEditingEntry(null)} /></div>
                                : entry.bullets.length > 0 && <ul className="px-3 pb-2 flex flex-col gap-0.5">{entry.bullets.slice(0, 2).map((b, i) => <li key={i} className="font-jetbrains text-[10px] text-[#4a7090] flex gap-1.5"><span className="text-[#456677] flex-shrink-0">◆</span>{b}</li>)}</ul>
                              }
                            </EntryRow>
                          ))}

                          {type === 'certifications' && profile.certifications.map(entry => (
                            <EntryRow key={entry.id} title={entry.title} sub={entry.issuer} date={entry.date}
                              expanded={expandedIds.has(entry.id)} onToggle={() => setExpandedIds(prev => { const n = new Set(prev); n.has(entry.id) ? n.delete(entry.id) : n.add(entry.id); return n })}
                              onEdit={() => { setEditingEntry({ type: 'certifications', id: entry.id }); setAddingIn(null) }}
                              onDelete={() => setProfile(p => ({ ...p, certifications: p.certifications.filter(e => e.id !== entry.id) }))}>
                              {editingId === entry.id && <div className="p-3 border-t border-[#0d1a2e]"><CertificationForm initial={entry} onSave={addCertification} onCancel={() => setEditingEntry(null)} /></div>}
                            </EntryRow>
                          ))}

                          {type === 'awards' && profile.awards.map(entry => (
                            <EntryRow key={entry.id} title={entry.title} sub={entry.issuer} date={entry.date}
                              expanded={expandedIds.has(entry.id)} onToggle={() => setExpandedIds(prev => { const n = new Set(prev); n.has(entry.id) ? n.delete(entry.id) : n.add(entry.id); return n })}
                              onEdit={() => { setEditingEntry({ type: 'awards', id: entry.id }); setAddingIn(null) }}
                              onDelete={() => setProfile(p => ({ ...p, awards: p.awards.filter(e => e.id !== entry.id) }))}>
                              {editingId === entry.id && <div className="p-3 border-t border-[#0d1a2e]"><AwardForm initial={entry} onSave={addAward} onCancel={() => setEditingEntry(null)} /></div>}
                            </EntryRow>
                          ))}

                          {/* ── add entry form ── */}
                          {isAdding && (
                            <div className="p-3 border-t border-[#0d1a2e]">
                              {type === 'education'      && <EducationForm      onSave={addEducation}     onCancel={() => setAddingIn(null)} />}
                              {type === 'experience'     && <ExperienceForm     onSave={addExperience}    onCancel={() => setAddingIn(null)} />}
                              {type === 'projects'       && <ProjectForm        onSave={addProject}       onCancel={() => setAddingIn(null)} />}
                              {type === 'skills'         && <SkillsForm         onSave={addSkill}         onCancel={() => setAddingIn(null)} />}
                              {type === 'research'       && <ExperienceForm     onSave={addResearch}      onCancel={() => setAddingIn(null)} />}
                              {type === 'leadership'     && <ExperienceForm     onSave={addLeadership}    onCancel={() => setAddingIn(null)} />}
                              {type === 'volunteering'   && <ExperienceForm     onSave={addVolunteering}  onCancel={() => setAddingIn(null)} />}
                              {type === 'certifications' && <CertificationForm  onSave={addCertification} onCancel={() => setAddingIn(null)} />}
                              {type === 'awards'         && <AwardForm          onSave={addAward}         onCancel={() => setAddingIn(null)} />}
                            </div>
                          )}

                          {/* ── add button ── */}
                          {!isAdding && (
                            <button
                              className="w-full flex items-center gap-1.5 px-3 py-2 font-jetbrains text-[10px] text-[#2a4060] hover:text-[#456677] hover:bg-[#080f1e] transition-colors cursor-pointer border-t border-[#0d1a2e]"
                              onMouseDown={e => e.stopPropagation()}
                              onClick={() => { setAddingIn(type); setEditingEntry(null) }}
                            >
                              <Plus size={10} /> add entry
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── bottom-right HUD: zoom + add ── */}
      <div className="absolute bottom-5 right-5 z-30 flex flex-col items-end gap-3">

        {/* zoom controls */}
        <div className="flex items-center gap-1.5 bg-[#08132a]/90 border border-[#1a3050] rounded-full px-3 py-1.5 backdrop-blur-sm">
          <button onClick={() => setZoom(z => Math.max(0.25, z * 0.85))} className="text-[#456677] hover:text-[#94a3b8] transition-colors cursor-pointer"><span className="font-jetbrains text-lg leading-none">−</span></button>
          <span className="font-jetbrains text-[10px] text-[#4a7090] w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2.5, z * 1.15))} className="text-[#456677] hover:text-[#94a3b8] transition-colors cursor-pointer"><span className="font-jetbrains text-lg leading-none">+</span></button>
          <div className="w-px h-3 bg-[#1a3050] mx-0.5" />
          <button onClick={resetView} className="text-[#456677] hover:text-[#94a3b8] transition-colors cursor-pointer"><RotateCcw size={11} /></button>
        </div>

        {/* add section button */}
        <div className="relative">
          <button
            onClick={() => setShowPicker(p => !p)}
            className="flex items-center gap-2 bg-[#456677] hover:bg-[#5a7d91] text-white rounded-full px-4 py-2 font-jetbrains text-[11px] font-semibold transition-all shadow-lg cursor-pointer"
          >
            <Plus size={13} /> add section
          </button>

          <AnimatePresence>
            {showPicker && availableSections.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                className="absolute bottom-full mb-2 right-0 bg-[#08132a] border border-[#1a3050] rounded-xl shadow-2xl p-2 w-64"
              >
                <p className="font-jetbrains text-[9px] text-[#2a4060] tracking-widest uppercase px-2 pb-1.5">// add to your life</p>
                {availableSections.map(s => (
                  <button key={s} onClick={() => addSection(s)}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg hover:bg-[#0c1a38] transition-colors cursor-pointer group">
                    <span style={{ color: SECTION_META[s].color }}>{SECTION_META[s].icon}</span>
                    <div className="text-left">
                      <p className="font-jetbrains text-[11px] text-[#c8d8f0] font-semibold">{SECTION_META[s].label}</p>
                      <p className="font-jetbrains text-[9px] text-[#4a7090]">{SECTION_META[s].description}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ─── entry row ────────────────────────────────────────────────────────────────
function EntryRow({ title, sub, date, expanded, onToggle, onEdit, onDelete, children }: {
  title: string; sub: string; date: string;
  expanded: boolean; onToggle: () => void;
  onEdit: () => void; onDelete: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-[#0d1a2e] last:border-b-0">
      <div className="flex items-center gap-2 px-3 py-2 group hover:bg-[#080f1e] cursor-pointer" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <p className="font-jetbrains text-[11px] text-[#94a3b8] font-semibold truncate">{title || '—'}</p>
          <p className="font-jetbrains text-[10px] text-[#4a7090] truncate">{sub}{date && <span className="ml-2">{date}</span>}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={e => { e.stopPropagation(); onEdit() }}   className="text-[#456677] hover:text-[#94a3b8] cursor-pointer"><Pencil size={10} /></button>
          <button onClick={e => { e.stopPropagation(); onDelete() }} className="text-[#456677] hover:text-[#ef4444] cursor-pointer"><Trash2 size={10} /></button>
        </div>
        {expanded ? <ChevronUp size={10} className="text-[#2a4060] flex-shrink-0" /> : <ChevronDown size={10} className="text-[#2a4060] flex-shrink-0" />}
      </div>
      <AnimatePresence>
        {expanded && children && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
