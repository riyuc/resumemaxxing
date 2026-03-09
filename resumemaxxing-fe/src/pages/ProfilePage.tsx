import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Plus, X, Trash2, Pencil, Check, GraduationCap, Briefcase,
  Code2, Wrench, User, Upload, TerminalSquare, Download,
  FileText,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Link } from 'react-router'
import PageLayout from '@/components/layout/PageLayout'
import { parseTexResume } from '@/utils/texParser'
import { exportAsTex, exportAsMd, downloadFile } from '@/utils/profileExport'
import type {
  ProfileData, EducationEntry, ExperienceEntry, ProjectEntry, SkillsEntry, SectionType,
} from '@/types/profile'
import { cn } from '@/lib/utils'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import PillBtn from '@/components/ui/pill-btn'
import EditableBullets from '@/components/ui/editable-bullets'
import EntryCard from '@/components/ui/entry-card'
import { DropdownBtn, DropItem } from '@/components/ui/dropdown-btn'

// ─── constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'agentic-resume-profile'
const SECTIONS_KEY = 'agentic-resume-sections'

const SECTION_META: Record<SectionType, { label: string; icon: React.ReactNode; placeholder: string }> = {
  education:  { label: 'EDUCATION',  icon: <GraduationCap size={14} />, placeholder: 'e.g. studied CS here, took AI/OS courses, 3.8 GPA, was in the coding club...' },
  experience: { label: 'EXPERIENCE', icon: <Briefcase    size={14} />, placeholder: 'e.g. worked on payments infrastructure, improved success rates, led the migration from...' },
  projects:   { label: 'PROJECTS',   icon: <Code2        size={14} />, placeholder: 'e.g. built a RAG pipeline for X, used embeddings + postgres, demoed at hackathon...' },
  skills:     { label: 'SKILLS',     icon: <Wrench       size={14} />, placeholder: '' },
}

const DEFAULT_PROFILE: ProfileData = {
  contact: { name: '', phone: '', email: '', linkedin: '', github: '', portfolio: '' },
  education: [], experience: [], projects: [], skills: [],
}

// ─── storage ──────────────────────────────────────────────────────────────────

function loadProfile(): ProfileData {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    return s ? JSON.parse(s) : DEFAULT_PROFILE
  } catch { return DEFAULT_PROFILE }
}

function loadSections(): SectionType[] {
  try {
    const s = localStorage.getItem(SECTIONS_KEY)
    return s ? JSON.parse(s) : []
  } catch { return [] }
}

function sectionsFromData(data: ProfileData): SectionType[] {
  const out: SectionType[] = []
  if (data.education.length)  out.push('education')
  if (data.experience.length) out.push('experience')
  if (data.projects.length)   out.push('projects')
  if (data.skills.length)     out.push('skills')
  return out
}

// ─── small atoms ──────────────────────────────────────────────────────────────

const Field = ({
  label, value, onChange, placeholder, mono = true, multiline = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; mono?: boolean; multiline?: boolean;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] text-payne-gray tracking-widest uppercase">{label}</span>
    {multiline ? (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className={cn(
          'bg-[#060e20] border border-[#1e3a5f] rounded p-3 text-[12px] text-porcelain',
          'placeholder:text-[#4a7090] focus:outline-none focus:border-payne-gray resize-none',
          'leading-relaxed',
          mono && 'font-jetbrains',
        )}
      />
    ) : (
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'bg-[#060e20] border border-[#1e3a5f] rounded p-3 text-[12px] text-porcelain',
          'placeholder:text-[#4a7090] focus:outline-none focus:border-payne-gray',
          mono && 'font-jetbrains',
        )}
      />
    )}
  </div>
)

// ─── entry forms ──────────────────────────────────────────────────────────────

const EducationForm = ({
  initial, onSave, onCancel,
}: {
  initial?: Partial<EducationEntry>; onSave: (e: Omit<EducationEntry, 'id'>) => void; onCancel: () => void;
}) => {
  const [school, setSchool]       = useState(initial?.school ?? '')
  const [location, setLocation]   = useState(initial?.location ?? '')
  const [degree, setDegree]       = useState(initial?.degree ?? '')
  const [dates, setDates]         = useState(initial?.dates ?? '')
  const [coursework, setCw]       = useState(initial?.coursework ?? '')
  const [rawText, setRawText]     = useState(initial?.rawText ?? '')

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="school / university" value={school} onChange={setSchool} placeholder="Concordia University" />
        <Field label="location" value={location} onChange={setLocation} placeholder="Montreal, QC" />
        <Field label="degree & major" value={degree} onChange={setDegree} placeholder="B.Sc. Computer Science" />
        <Field label="dates" value={dates} onChange={setDates} placeholder="Sep 2022 – Dec 2026" />
      </div>
      <Field label="relevant coursework" value={coursework} onChange={setCw} placeholder="Operating Systems, Algorithms, AI..." />
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-payne-gray tracking-widest uppercase">
          // tell us about your time here — be casual
        </span>
        <span className="text-[10px] text-[#4a7090] mb-1">
          // clubs, projects, what you actually learned, achievements — this will generate bullet points later
        </span>
        <textarea
          value={rawText}
          onChange={e => setRawText(e.target.value)}
          placeholder={SECTION_META.education.placeholder}
          rows={4}
          className="bg-[#060e20] border border-payne-gray/30 rounded px-3 py-2 text-sm text-porcelain placeholder:text-[#4a7090] focus:outline-none focus:border-payne-gray resize-none font-jetbrains leading-relaxed"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <PillBtn variant="accent" onClick={() => onSave({ school, location, degree, dates, coursework, rawText })}>
          <Check size={12} /> save entry
        </PillBtn>
        <PillBtn variant="ghost" onClick={onCancel}><X size={12} /> cancel</PillBtn>
      </div>
    </div>
  )
}

const ExperienceForm = ({
  initial, onSave, onCancel,
}: {
  initial?: Partial<ExperienceEntry>; onSave: (e: Omit<ExperienceEntry, 'id'>) => void; onCancel: () => void;
}) => {
  const [company, setCompany]   = useState(initial?.company ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [role, setRole]         = useState(initial?.role ?? '')
  const [dates, setDates]       = useState(initial?.dates ?? '')
  const [bullets, setBullets]   = useState(initial?.bullets ?? [])
  const [rawText, setRawText]   = useState(initial?.rawText ?? '')

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="company" value={company} onChange={setCompany} placeholder="Shopify" />
        <Field label="location" value={location} onChange={setLocation} placeholder="Toronto, ON" />
        <Field label="role / title" value={role} onChange={setRole} placeholder="Software Engineering Intern" />
        <Field label="dates" value={dates} onChange={setDates} placeholder="May 2025 – Dec 2025" />
      </div>
      <EditableBullets bullets={bullets} onChange={setBullets} />
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-payne-gray tracking-widest uppercase">
          // what did you do there? — be casual
        </span>
        <span className="text-[10px] text-[#4a7090] mb-1">
          // projects, tech used, impact, team size, what you shipped — the agentic system will extract bullets from this
        </span>
        <textarea
          value={rawText}
          onChange={e => setRawText(e.target.value)}
          placeholder={SECTION_META.experience.placeholder}
          rows={5}
          className="bg-[#060e20] border border-payne-gray/30 rounded px-3 py-2 text-sm text-porcelain placeholder:text-[#4a7090] focus:outline-none focus:border-payne-gray resize-none font-jetbrains leading-relaxed"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <PillBtn variant="accent" onClick={() => onSave({ company, location, role, dates, bullets, rawText })}>
          <Check size={12} /> save entry
        </PillBtn>
        <PillBtn variant="ghost" onClick={onCancel}><X size={12} /> cancel</PillBtn>
      </div>
    </div>
  )
}

const ProjectForm = ({
  initial, onSave, onCancel,
}: {
  initial?: Partial<ProjectEntry>; onSave: (e: Omit<ProjectEntry, 'id'>) => void; onCancel: () => void;
}) => {
  const [name, setName]         = useState(initial?.name ?? '')
  const [techStack, setTech]    = useState(initial?.techStack ?? '')
  const [dates, setDates]       = useState(initial?.dates ?? '')
  const [bullets, setBullets]   = useState(initial?.bullets ?? [])
  const [rawText, setRawText]   = useState(initial?.rawText ?? '')

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="project name" value={name} onChange={setName} placeholder="AI Transcription Correction" />
        <Field label="dates / context" value={dates} onChange={setDates} placeholder="Intact Hackathon, 2025" />
      </div>
      <Field label="tech stack" value={techStack} onChange={setTech} placeholder="Python, FastAPI, React, OpenAI API..." />
      <EditableBullets bullets={bullets} onChange={setBullets} />
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-payne-gray tracking-widest uppercase">
          // describe the project — be casual
        </span>
        <span className="text-[10px] text-[#4a7090] mb-1">
          // what problem it solves, how you built it, results, what you're proud of
        </span>
        <textarea
          value={rawText}
          onChange={e => setRawText(e.target.value)}
          placeholder={SECTION_META.projects.placeholder}
          rows={5}
          className="bg-[#060e20] border border-payne-gray/30 rounded px-3 py-2 text-sm text-porcelain placeholder:text-[#4a7090] focus:outline-none focus:border-payne-gray resize-none font-jetbrains leading-relaxed"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <PillBtn variant="accent" onClick={() => onSave({ name, techStack, dates, bullets, rawText })}>
          <Check size={12} /> save entry
        </PillBtn>
        <PillBtn variant="ghost" onClick={onCancel}><X size={12} /> cancel</PillBtn>
      </div>
    </div>
  )
}

const SkillsForm = ({
  initial, onSave, onCancel,
}: {
  initial?: Partial<SkillsEntry>; onSave: (e: Omit<SkillsEntry, 'id'>) => void; onCancel: () => void;
}) => {
  const [category, setCategory]         = useState(initial?.category ?? '')
  const [technologies, setTechnologies] = useState(initial?.technologies ?? '')

  return (
    <div className="flex flex-col gap-3">
      <Field label="category" value={category} onChange={setCategory} placeholder="Languages, Frameworks, Cloud/Infra..." />
      <Field
        label="technologies (comma-separated)"
        value={technologies}
        onChange={setTechnologies}
        placeholder="Python, TypeScript, Go, Rust..."
      />
      <div className="flex gap-2 pt-1">
        <PillBtn variant="accent" onClick={() => onSave({ category, technologies })}>
          <Check size={12} /> save entry
        </PillBtn>
        <PillBtn variant="ghost" onClick={onCancel}><X size={12} /> cancel</PillBtn>
      </div>
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [profile, setProfile]             = useState<ProfileData>(loadProfile)
  const [sections, setSections]           = useState<SectionType[]>(() => {
    const stored = loadSections()
    return stored.length ? stored : sectionsFromData(loadProfile())
  })
  const [editingContact, setEditingContact]   = useState(false)
  const [contactDraft, setContactDraft]       = useState(profile.contact)
  const [showSectionPicker, setShowSectionPicker] = useState(false)
  const [addingIn, setAddingIn]               = useState<SectionType | null>(null)
  const [editingEntry, setEditingEntry]       = useState<{ type: SectionType; id: string } | null>(null)
  const [expandedIds, setExpandedIds]         = useState<Set<string>>(new Set())
  const [importStatus, setImportStatus]       = useState<'idle' | 'success' | 'error'>('idle')
  const [pdfImporting, setPdfImporting]       = useState(false)
  const fileRef    = useRef<HTMLInputElement>(null)
  const pdfFileRef = useRef<HTMLInputElement>(null)

  const handleExportTex = () => {
    const name = profile.contact.name?.replace(/\s+/g, '_') || 'resume'
    downloadFile(exportAsTex(profile), `${name}_resume.tex`, 'text/plain')
  }

  const handleExportMd = () => {
    const name = profile.contact.name?.replace(/\s+/g, '_') || 'resume'
    downloadFile(exportAsMd(profile), `${name}_resume.md`, 'text/markdown')
  }

  // persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections))
  }, [sections])

  const toggleExpand = (id: string) =>
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  // ── contact ──
  const saveContact = () => {
    setProfile(p => ({ ...p, contact: contactDraft }))
    setEditingContact(false)
  }

  // ── add / remove sections ──
  const addSection = (type: SectionType) => {
    if (!sections.includes(type)) setSections(prev => [...prev, type])
    setShowSectionPicker(false)
    setAddingIn(type)
  }

  const removeSection = (type: SectionType) => {
    setSections(prev => prev.filter(s => s !== type))
    setProfile(p => ({ ...p, [type]: [] }))
    if (addingIn === type) setAddingIn(null)
  }

  const availableSections = (['education', 'experience', 'projects', 'skills'] as SectionType[])
    .filter(s => !sections.includes(s))

  // ── education CRUD ──
  const addEducation = useCallback((entry: Omit<EducationEntry, 'id'>) => {
    if (editingEntry?.type === 'education') {
      setProfile(p => ({
        ...p,
        education: p.education.map(e => e.id === editingEntry.id ? { ...entry, id: e.id } : e),
      }))
      setEditingEntry(null)
    } else {
      const id = crypto.randomUUID()
      setProfile(p => ({ ...p, education: [...p.education, { ...entry, id }] }))
      setExpandedIds(prev => new Set(prev).add(id))
      setAddingIn(null)
    }
  }, [editingEntry])

  const deleteEducation = (id: string) =>
    setProfile(p => ({ ...p, education: p.education.filter(e => e.id !== id) }))

  // ── experience CRUD ──
  const addExperience = useCallback((entry: Omit<ExperienceEntry, 'id'>) => {
    if (editingEntry?.type === 'experience') {
      setProfile(p => ({
        ...p,
        experience: p.experience.map(e => e.id === editingEntry.id ? { ...entry, id: e.id } : e),
      }))
      setEditingEntry(null)
    } else {
      const id = crypto.randomUUID()
      setProfile(p => ({ ...p, experience: [...p.experience, { ...entry, id }] }))
      setExpandedIds(prev => new Set(prev).add(id))
      setAddingIn(null)
    }
  }, [editingEntry])

  const deleteExperience = (id: string) =>
    setProfile(p => ({ ...p, experience: p.experience.filter(e => e.id !== id) }))

  // ── projects CRUD ──
  const addProject = useCallback((entry: Omit<ProjectEntry, 'id'>) => {
    if (editingEntry?.type === 'projects') {
      setProfile(p => ({
        ...p,
        projects: p.projects.map(e => e.id === editingEntry.id ? { ...entry, id: e.id } : e),
      }))
      setEditingEntry(null)
    } else {
      const id = crypto.randomUUID()
      setProfile(p => ({ ...p, projects: [...p.projects, { ...entry, id }] }))
      setExpandedIds(prev => new Set(prev).add(id))
      setAddingIn(null)
    }
  }, [editingEntry])

  const deleteProject = (id: string) =>
    setProfile(p => ({ ...p, projects: p.projects.filter(e => e.id !== id) }))

  // ── skills CRUD ──
  const addSkill = useCallback((entry: Omit<SkillsEntry, 'id'>) => {
    if (editingEntry?.type === 'skills') {
      setProfile(p => ({
        ...p,
        skills: p.skills.map(e => e.id === editingEntry.id ? { ...entry, id: e.id } : e),
      }))
      setEditingEntry(null)
    } else {
      const id = crypto.randomUUID()
      setProfile(p => ({ ...p, skills: [...p.skills, { ...entry, id }] }))
      setAddingIn(null)
    }
  }, [editingEntry])

  const deleteSkill = (id: string) =>
    setProfile(p => ({ ...p, skills: p.skills.filter(e => e.id !== id) }))

  // ── pdf import ──
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
      const newSections = sectionsFromData({
        contact: { name: '', phone: '', email: '', linkedin: '', github: '', portfolio: '' },
        education:  parsed.education  ?? [],
        experience: parsed.experience ?? [],
        projects:   parsed.projects   ?? [],
        skills:     parsed.skills     ?? [],
      })
      setSections(prev => {
        const merged = [...prev]
        newSections.forEach(s => { if (!merged.includes(s)) merged.push(s) })
        return merged
      })
      setImportStatus('success'); setTimeout(() => setImportStatus('idle'), 3000)
    } catch (err) {
      console.error('PDF import failed:', err)
      setImportStatus('error'); setTimeout(() => setImportStatus('idle'), 3000)
    } finally { setPdfImporting(false); e.target.value = '' }
  }

  // ── tex import ──
  const handleTexImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const tex = ev.target?.result as string
        const parsed = parseTexResume(tex)
        setProfile(parsed)
        const newSections = sectionsFromData(parsed)
        setSections(prev => {
          const merged = [...prev]
          newSections.forEach(s => { if (!merged.includes(s)) merged.push(s) })
          return merged
        })
        setImportStatus('success')
        setTimeout(() => setImportStatus('idle'), 3000)
      } catch {
        setImportStatus('error')
        setTimeout(() => setImportStatus('idle'), 3000)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-6 w-full pb-24">

        {/* ── page header ── */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[#4a7090] text-xs">
            <TerminalSquare size={14} className="text-payne-gray" />
            <span className="text-payne-gray">~/</span>
            <span className="text-porcelain">profile</span>
            <span className="text-payne-gray">.tsx</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <AnimatePresence>
              {importStatus !== 'idle' && (
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    'text-xs font-jetbrains',
                    importStatus === 'success' ? 'text-[#4ade80]' : 'text-[#ef4444]',
                  )}
                >
                  {importStatus === 'success' ? '✓ imported' : '✗ parse error'}
                </motion.span>
              )}
            </AnimatePresence>
            
            {/* Dropdown Import */}
            <DropdownBtn 
              label='import'
              icon={<Upload size={11} />} 
              align="right"
            >
              <DropItem onClick={() => fileRef.current?.click()}>
                <Upload size={11} /> import .tex
              </DropItem>
              <DropItem onClick={() => pdfFileRef.current?.click()}>
                <Upload size={11} /> {pdfImporting ? 'parsing...' : 'import .pdf'}
              </DropItem>
            </DropdownBtn>
            {/* Dropdown Export */}
            <DropdownBtn 
              label='export'
              icon={<Download size={11} />} 
              align="right"
            >
              <DropItem onClick={handleExportTex}>
                <Download size={11} /> .tex
              </DropItem>
              <DropItem onClick={handleExportMd}>
                <FileText size={11} /> .md
              </DropItem>
            </DropdownBtn>
            <Link
              to="/create"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-jetbrains bg-payne-gray text-white hover:bg-[#5a7d91] transition-all"
            >
              create resume ↗
            </Link>
            <input ref={fileRef} type="file" accept=".tex" className="hidden" onChange={handleTexImport} />
            <input ref={pdfFileRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfImport} />
          </div>
        </div>

        <div className='my-4 flex font-jetbrains text-xs'>
          Add all the context to this profile (doesn't need to be curated), 
          agentic flow will take context from here to generate your resume.
        </div>

        {/* ── contact section ── */}
        <div className="mb-8 border border-[#1a3050] rounded-xl p-5 bg-[#08132a]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-porcelain text-xs tracking-widest">
              <User size={13} className="text-payne-gray" />
              <span className="uppercase">Contact</span>
            </div>
            {!editingContact ? (
              <PillBtn variant="ghost" onClick={() => { setContactDraft(profile.contact); setEditingContact(true) }}>
                <Pencil size={11} /> edit
              </PillBtn>
            ) : (
              <div className="flex gap-2">
                <PillBtn variant="accent" onClick={saveContact}><Check size={11} /> save</PillBtn>
                <PillBtn variant="ghost" onClick={() => setEditingContact(false)}><X size={11} /> cancel</PillBtn>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {editingContact ? (
              <motion.div
                key="editing"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 gap-3"
              >
                <Field label="full name" value={contactDraft.name} onChange={v => setContactDraft(p => ({ ...p, name: v }))} placeholder="Duc Anh Nguyen" />
                <Field label="phone" value={contactDraft.phone} onChange={v => setContactDraft(p => ({ ...p, phone: v }))} placeholder="+1 (437)-433-9262" />
                <Field label="email" value={contactDraft.email} onChange={v => setContactDraft(p => ({ ...p, email: v }))} placeholder="you@email.com" />
                <Field label="linkedin (handle)" value={contactDraft.linkedin} onChange={v => setContactDraft(p => ({ ...p, linkedin: v }))} placeholder="ducanhnguyen0" />
                <Field label="github (handle)" value={contactDraft.github} onChange={v => setContactDraft(p => ({ ...p, github: v }))} placeholder="riyuc" />
                <Field label="portfolio url" value={contactDraft.portfolio} onChange={v => setContactDraft(p => ({ ...p, portfolio: v }))} placeholder="https://liyuchi.dev" />
              </motion.div>
            ) : (
              <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {profile.contact.name ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xl font-bold tracking-tight text-porcelain">{profile.contact.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#94a3b8]">
                      {profile.contact.phone    && <span>{profile.contact.phone}</span>}
                      {profile.contact.email    && <span>{profile.contact.email}</span>}
                      {profile.contact.linkedin && <span>linkedin/{profile.contact.linkedin}</span>}
                      {profile.contact.github   && <span>github/{profile.contact.github}</span>}
                      {profile.contact.portfolio && <span>{profile.contact.portfolio}</span>}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#4a7090] italic">// no contact info yet — click edit to add</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── dynamic sections ── */}
        <div className="flex flex-col gap-6">
          <AnimatePresence>
            {sections.map(sectionType => {
              const meta  = SECTION_META[sectionType]
              const isAdding = addingIn === sectionType
              const editingId = editingEntry?.type === sectionType ? editingEntry.id : null

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
                      <span className="text-porcelain font-bold">{meta.label}</span>
                    </div>
                    <div className="flex-1 h-px bg-[#1a3050]" />
                    <div className="flex items-center gap-1">
                      <PillBtn
                        variant="default"
                        onClick={() => { setAddingIn(isAdding ? null : sectionType); setEditingEntry(null) }}
                      >
                        {isAdding ? <X size={11} /> : <Plus size={11} />}
                        {isAdding ? 'cancel' : 'add entry'}
                      </PillBtn>
                      <PillBtn variant="danger" onClick={() => removeSection(sectionType)}>
                        <Trash2 size={11} />
                      </PillBtn>
                    </div>
                  </div>

                  {/* add entry form */}
                  <AnimatePresence>
                    {isAdding && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border border-payne-gray/30 rounded-xl p-5 bg-[#060e20] mb-2">
                          <p className="text-[10px] text-payne-gray tracking-widest uppercase mb-3">
                            // new {sectionType} entry
                          </p>
                          {sectionType === 'education' && (
                            <EducationForm onSave={addEducation} onCancel={() => setAddingIn(null)} />
                          )}
                          {sectionType === 'experience' && (
                            <ExperienceForm onSave={addExperience} onCancel={() => setAddingIn(null)} />
                          )}
                          {sectionType === 'projects' && (
                            <ProjectForm onSave={addProject} onCancel={() => setAddingIn(null)} />
                          )}
                          {sectionType === 'skills' && (
                            <SkillsForm onSave={addSkill} onCancel={() => setAddingIn(null)} />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* entries */}
                  <div className="flex flex-col gap-2">
                    {sectionType === 'education' && profile.education.map(entry => (
                      <div key={entry.id}>
                        <EntryCard
                          expanded={expandedIds.has(entry.id)}
                          onToggle={() => toggleExpand(entry.id)}
                          onEdit={() => { setEditingEntry({ type: 'education', id: entry.id }); setAddingIn(null) }}
                          onDelete={() => deleteEducation(entry.id)}
                        >
                          <div className="flex flex-col gap-0.5">
                            <p className="text-sm font-bold text-porcelain">{entry.school || '—'}</p>
                            <p className="text-xs text-[#94a3b8]">
                              {entry.degree}{entry.location ? ` · ${entry.location}` : ''}
                              {entry.dates && <span className="ml-2 text-payne-gray">{entry.dates}</span>}
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
                              {editingId === entry.id ? (
                                <div className="border border-payne-gray/30 border-t-0 rounded-b-xl p-5 bg-[#060e20]">
                                  <EducationForm
                                    initial={entry}
                                    onSave={addEducation}
                                    onCancel={() => setEditingEntry(null)}
                                  />
                                </div>
                              ) : (
                                <div className="border border-[#1a3050] border-t-0 rounded-b-xl px-4 pb-4 pt-3 bg-[#08132a] flex flex-col gap-2">
                                  {entry.coursework && (
                                    <p className="text-xs text-[#94a3b8]">
                                      <span className="text-payne-gray">coursework: </span>{entry.coursework}
                                    </p>
                                  )}
                                  {entry.rawText ? (
                                    <div>
                                      <p className="text-[10px] text-payne-gray mb-1">// casual notes</p>
                                      <p className="text-xs text-[#94a3b8] leading-relaxed whitespace-pre-wrap">{entry.rawText}</p>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-[#4a7090] italic">// no casual notes yet</p>
                                  )}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}

                    {sectionType === 'experience' && profile.experience.map(entry => (
                      <div key={entry.id}>
                        <EntryCard
                          expanded={expandedIds.has(entry.id)}
                          onToggle={() => toggleExpand(entry.id)}
                          onEdit={() => { setEditingEntry({ type: 'experience', id: entry.id }); setAddingIn(null) }}
                          onDelete={() => deleteExperience(entry.id)}
                        >
                          <div className="flex flex-col gap-0.5">
                            <p className="text-sm font-bold text-porcelain">{entry.company || '—'}</p>
                            <p className="text-xs text-[#94a3b8]">
                              {entry.role}{entry.location ? ` · ${entry.location}` : ''}
                              {entry.dates && <span className="ml-2 text-payne-gray">{entry.dates}</span>}
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
                              {editingId === entry.id ? (
                                <div className="border border-payne-gray/30 border-t-0 rounded-b-xl p-5 bg-[#060e20]">
                                  <ExperienceForm
                                    initial={entry}
                                    onSave={addExperience}
                                    onCancel={() => setEditingEntry(null)}
                                  />
                                </div>
                              ) : (
                                <div className="border border-[#1a3050] border-t-0 rounded-b-xl px-4 pb-4 pt-3 bg-[#08132a] flex flex-col gap-2">
                                  {entry.bullets.length > 0 && (
                                    <div className="flex flex-col gap-1">
                                      <p className="text-[10px] text-payne-gray mb-1">// bullets (from .tex import)</p>
                                      {entry.bullets.map((b, i) => (
                                        <p key={i} className="text-xs text-[#94a3b8] leading-relaxed flex gap-2">
                                          <span className="text-payne-gray shrink-0">◆</span>
                                          <span>{b}</span>
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                  {entry.rawText ? (
                                    <div>
                                      <p className="text-[10px] text-payne-gray mb-1">// casual notes</p>
                                      <p className="text-xs text-[#94a3b8] leading-relaxed whitespace-pre-wrap">{entry.rawText}</p>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-[#4a7090] italic">// no casual notes yet — edit to add your story</p>
                                  )}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}

                    {sectionType === 'projects' && profile.projects.map(entry => (
                      <div key={entry.id}>
                        <EntryCard
                          expanded={expandedIds.has(entry.id)}
                          onToggle={() => toggleExpand(entry.id)}
                          onEdit={() => { setEditingEntry({ type: 'projects', id: entry.id }); setAddingIn(null) }}
                          onDelete={() => deleteProject(entry.id)}
                        >
                          <div className="flex flex-col gap-0.5">
                            <p className="text-sm font-bold text-porcelain">{entry.name || '—'}</p>
                            <p className="text-xs text-[#94a3b8]">
                              {entry.techStack}
                              {entry.dates && <span className="ml-2 text-payne-gray">{entry.dates}</span>}
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
                              {editingId === entry.id ? (
                                <div className="border border-payne-gray/30 border-t-0 rounded-b-xl p-5 bg-[#060e20]">
                                  <ProjectForm
                                    initial={entry}
                                    onSave={addProject}
                                    onCancel={() => setEditingEntry(null)}
                                  />
                                </div>
                              ) : (
                                <div className="border border-[#1a3050] border-t-0 rounded-b-xl px-4 pb-4 pt-3 bg-[#08132a] flex flex-col gap-2">
                                  {entry.bullets.length > 0 && (
                                    <div className="flex flex-col gap-1">
                                      <p className="text-[10px] text-payne-gray mb-1">// bullets (from .tex import)</p>
                                      {entry.bullets.map((b, i) => (
                                        <p key={i} className="text-xs text-[#94a3b8] leading-relaxed flex gap-2">
                                          <span className="text-payne-gray shrink-0">◆</span>
                                          <span>{b}</span>
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                  {entry.rawText ? (
                                    <div>
                                      <p className="text-[10px] text-payne-gray mb-1">// casual notes</p>
                                      <p className="text-xs text-[#94a3b8] leading-relaxed whitespace-pre-wrap">{entry.rawText}</p>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-[#4a7090] italic">// no casual notes yet — edit to describe the project</p>
                                  )}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}

                    {sectionType === 'skills' && (
                      <div className="border border-[#1a3050] rounded-xl px-4 py-3 bg-[#08132a] flex flex-col gap-2">
                        {profile.skills.length === 0 ? (
                          <p className="text-xs text-[#4a7090] italic">// no skills yet — add a category</p>
                        ) : (
                          profile.skills.map(entry => (
                            <div key={entry.id} className="flex items-start gap-3 group">
                              <span className="text-xs text-payne-gray shrink-0 w-40 pt-px">{entry.category}</span>
                              <span className="text-xs text-[#94a3b8] flex-1 leading-relaxed">{entry.technologies}</span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {editingId === entry.id ? null : (
                                  <>
                                    <PillBtn variant="ghost" onClick={() => setEditingEntry({ type: 'skills', id: entry.id })}>
                                      <Pencil size={10} />
                                    </PillBtn>
                                    <PillBtn variant="danger" onClick={() => deleteSkill(entry.id)}>
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
                              className="overflow-hidden pt-2 border-t border-[#1a3050] mt-1"
                            >
                              <SkillsForm
                                initial={profile.skills.find(s => s.id === editingEntry.id)}
                                onSave={addSkill}
                                onCancel={() => setEditingEntry(null)}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* empty state */}
                    {sectionType !== 'skills' && profile[sectionType].length === 0 && !isAdding && (
                      <p className="text-xs text-[#4a7090] italic px-1">
                        // no {sectionType} entries yet — click [add entry] above
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* ── add section button ── */}
        <div className="mt-8 relative">
          {availableSections.length > 0 && (
            <div className="flex justify-center">
              <div className="relative">
                <button
                  onClick={() => setShowSectionPicker(p => !p)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-jetbrains',
                    'border border-dashed transition-all duration-200 cursor-pointer',
                    showSectionPicker
                      ? 'border-payne-gray text-porcelain bg-[#08132a]'
                      : 'border-[#1a3050] text-[#4a7090] hover:border-payne-gray hover:text-[#94a3b8]',
                  )}
                >
                  <Plus size={12} />
                  add section
                </button>

                <AnimatePresence>
                  {showSectionPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#08132a] border border-[#1a3050] rounded-xl overflow-hidden shadow-xl z-10 min-w-[180px]"
                    >
                      {availableSections.map(s => (
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

          {sections.length === 0 && (
            <div className="text-center py-12 flex flex-col items-center gap-4">
              <p className="text-xs text-[#4a7090] font-jetbrains">
                // your profile is empty — import a .tex or add sections below
              </p>
            </div>
          )}
        </div>

      </div>
    </PageLayout>
  )
}
