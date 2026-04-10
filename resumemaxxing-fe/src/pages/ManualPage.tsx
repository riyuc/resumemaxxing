import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  ChevronLeft,
  Upload,
  Download,
  FileText,
  Printer,
  PanelLeftOpen,
  SquarePen,
  TerminalSquare,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { parseResumeWithAI } from '@/utils/aiParser'
import {
  exportAsTex,
  exportAsMd,
  generateResumeHtml,
  printResumePdf,
  downloadFile,
  DEFAULT_FORMAT,
} from '@/utils/profileExport'
import type { ProfileData, SectionType, ExperienceEntry, ProjectEntry } from '@/types/profile'
import type { ResumeFormat } from '@/utils/profileExport'
import { cn } from '@/lib/utils'
import { DropdownBtn, DropItem } from '@/components/ui/dropdown-btn'
import PillBtn from '@/components/ui/pill-btn'
import { EducationForm } from '@/components/forms/EducationForm'
import { ExperienceForm } from '@/components/forms/ExperienceForm'
import { ProjectForm } from '@/components/forms/ProjectForm'
import { SkillsForm } from '@/components/forms/SkillsForm'
import { ProfileDataSchema } from '@/schemas/profile'
import { useManualCrud } from '@/hooks/useManualCrud'
import { useIsMobile } from '@/hooks/useIsMobile'
import { ContactPanel } from '@/components/manual/ContactPanel'
import { SectionBlock } from '@/components/manual/SectionBlock'
import { EntryListItem } from '@/components/manual/EntryListItem'
import { FormatSidebar } from '@/components/manual/FormatSidebar'
import { PdfPreviewModal } from '@/components/manual/PdfPreviewModal'

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

// ─── resize handle ────────────────────────────────────────────────────────────

const MIN_LEFT = 280,
  MAX_LEFT = 760

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

// ─── entry view content (bullets + notes) ────────────────────────────────────

function EntryViewContent({
  bullets,
  rawText,
  placeholder,
  onRawChange,
}: {
  bullets: string[]
  rawText: string
  placeholder: string
  onRawChange: (v: string) => void
}) {
  return (
    <>
      {bullets.length > 0 && (
        <ul className="flex flex-col gap-1.5 mb-1">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-xs text-[#94a3b8]">
              <span className="text-payne-gray mt-0.5">◆</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-payne-gray tracking-widest uppercase">notes</span>
        <textarea
          value={rawText}
          onChange={(e) => onRawChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="bg-[#060e20] border border-[#1e3a5f] rounded-lg p-3 text-xs text-porcelain placeholder:text-[#4a7090] focus:outline-none focus:border-payne-gray resize-none leading-relaxed font-jetbrains"
        />
      </div>
      <PillBtn variant="default" onClick={() => {}}>
        <TerminalSquare size={11} /> generate bullets
      </PillBtn>
    </>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

const AVAIL_SECTIONS: SectionType[] = ['education', 'experience', 'projects', 'skills']
const SECTION_PLACEHOLDER: Record<string, string> = {
  education: 'e.g. studied CS here, took AI/OS courses, 3.8 GPA, was in the coding club...',
  experience:
    'e.g. worked on payments infrastructure, improved success rates, led the migration from...',
  projects: 'e.g. built a RAG pipeline for X, used embeddings + postgres, demoed at hackathon...',
  skills: '',
}

export default function ManualPage() {
  const [profile, setProfile] = useState<ProfileData>(loadProfile)
  const [sections, setSections] = useState<SectionType[]>(() => {
    const stored = loadSections()
    return stored.length ? stored : sectionsFromData(loadProfile())
  })
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
  const [showSectionPicker, setShowSectionPicker] = useState(false)
  // live contact draft for preview
  const [contactLiveDraft, setContactLiveDraft] = useState<ProfileData['contact'] | null>(null)
  // mobile tab
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor')
  const isMobile = useIsMobile()

  const texRef = useRef<HTMLInputElement>(null)
  const pdfRef = useRef<HTMLInputElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const { width: leftWidth, onMouseDown: onDividerMouseDown } = useResize(500)

  const {
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
  } = useManualCrud(setProfile, setSections)

  // ── live preview ──
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

  const livePreviewProfile = useMemo<ProfileData>(() => {
    if (!contactLiveDraft) return previewProfile
    return { ...previewProfile, contact: contactLiveDraft }
  }, [previewProfile, contactLiveDraft])

  const [resumeHtmlFinal, setResumeHtmlFinal] = useState(() =>
    generateResumeHtml(loadProfile(), undefined, { format: loadFormat() })
  )
  useEffect(() => {
    if (iframeEditing) return
    const t = setTimeout(() => {
      setResumeHtmlFinal(
        generateResumeHtml(livePreviewProfile, undefined, { editable: editMode, format })
      )
    }, 120)
    return () => clearTimeout(t)
  }, [livePreviewProfile, editMode, iframeEditing, format])

  // ── persist ──
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }, [profile])
  useEffect(() => {
    localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections))
  }, [sections])
  useEffect(() => {
    localStorage.setItem(FORMAT_KEY, JSON.stringify(format))
  }, [format])

  // ── imports ──
  const flashStatus = (s: 'success' | 'error') => {
    setImportStatus(s)
    setTimeout(() => setImportStatus('idle'), 3000)
  }

  const handleTexImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfImporting(true)
    try {
      const text = await file.text()
      const parsed = await parseResumeWithAI(text)
      setProfile(parsed)
      setSections((prev) => {
        const m = [...prev]
        sectionsFromData(parsed).forEach((s) => {
          if (!m.includes(s)) m.push(s)
        })
        return m
      })
      flashStatus('success')
    } catch {
      flashStatus('error')
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
      setSections((prev) => {
        const m = [...prev]
        sectionsFromData(parsed).forEach((s) => {
          if (!m.includes(s)) m.push(s)
        })
        return m
      })
      flashStatus('success')
    } catch {
      flashStatus('error')
    } finally {
      setPdfImporting(false)
      e.target.value = ''
    }
  }

  // ── exports ──
  const nameSlug = profile.contact.name?.replace(/\s+/g, '_') || 'resume'
  const handleExportTex = () =>
    downloadFile(exportAsTex(profile), `${nameSlug}_resume.tex`, 'text/plain')
  const handleExportMd = () =>
    downloadFile(exportAsMd(profile), `${nameSlug}_resume.md`, 'text/markdown')
  const handlePrint = () =>
    printResumePdf(generateResumeHtml(livePreviewProfile, undefined, { format }))

  const openPdfPreview = () => {
    setPdfPreviewHtml(generateResumeHtml(livePreviewProfile, undefined, { format }))
    setPdfPageCount(1)
    setPdfPreviewOpen(true)
  }

  // ── iframe listeners ──
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const resize = () => {
      const h = iframe.contentDocument?.body?.scrollHeight
      if (h) setContentHeight(h)
    }
    iframe.addEventListener('load', resize)
    return () => iframe.removeEventListener('load', resize)
  }, [resumeHtmlFinal])

  useEffect(() => {
    const handler = (e: MessageEvent) => {
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

  // ── derived ──
  const availableSections = AVAIL_SECTIONS.filter((s) => !sections.includes(s))
  const addSection = (type: SectionType) => {
    if (!sections.includes(type)) setSections((prev) => [...prev, type])
    setShowSectionPicker(false)
    setAddingIn(type)
  }
  const eId = (type: SectionType) => (editingEntry?.type === type ? editingEntry.id : null)
  const marginPx = Math.round(format.pageMargin * 96)
  const contentPerPage = 1056 - 2 * marginPx
  const pageCount =
    contentHeight > 0 ? Math.max(1, Math.ceil((contentHeight - marginPx) / contentPerPage)) : 1

  const cancelAdd = () => {
    setAddingIn(null)
    setDraftEntry(null)
  }
  const cancelEdit = () => {
    setEditingEntry(null)
    setDraftEntry(null)
  }
  const startEdit = (id: string, type: SectionType) => {
    setEditingEntry({ type, id })
    setAddingIn(null)
    setDraftEntry(null)
    setExpandedIds((p) => new Set(p).add(id))
  }

  // ── render ──
  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Mobile tab bar */}
      <div className="md:hidden flex border-b border-[#0d1a2e] shrink-0 bg-[#08132a]">
        {(['editor', 'preview'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={cn(
              'flex-1 py-2.5 font-jetbrains text-[11px] transition-colors cursor-pointer',
              mobileTab === tab
                ? 'text-[#c8d8f0] border-b-2 border-payne-gray'
                : 'text-[#4a7090] hover:text-[#6a8aaa]'
            )}
          >
            ~/{tab}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ══ LEFT PANEL ══ */}
        <div
          className={cn(
            'shrink-0 border-r border-[#0d1a2e] bg-[#030b18] overflow-hidden',
            mobileTab === 'editor' ? 'flex flex-col w-full md:w-auto' : 'hidden md:flex md:flex-col'
          )}
          style={!isMobile ? { width: sidebarOpen ? leftWidth : 46 } : undefined}
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
                <ContactPanel
                  contact={profile.contact}
                  onSave={(c) => setProfile((p) => ({ ...p, contact: c }))}
                  onDraftChange={setContactLiveDraft}
                />

                {/* sections */}
                <div className="flex flex-col gap-6">
                  <AnimatePresence>
                    {sections.map((sectionType) => {
                      const isAdding = addingIn === sectionType
                      const editId = eId(sectionType)
                      const ph = SECTION_PLACEHOLDER[sectionType] ?? ''
                      const setRawText = (
                        key: 'education' | 'experience' | 'projects',
                        id: string,
                        v: string
                      ) =>
                        setProfile((p) => ({
                          ...p,
                          [key]: (p[key] as Array<{ id: string; rawText?: string }>).map((e) =>
                            e.id === id ? { ...e, rawText: v } : e
                          ),
                        }))

                      const addFormNode = (
                        <>
                          {sectionType === 'education' && (
                            <EducationForm
                              onSave={addEducation}
                              onCancel={cancelAdd}
                              onChange={(d) =>
                                setDraftEntry({ sectionType: 'education', id: null, data: d })
                              }
                            />
                          )}
                          {sectionType === 'experience' && (
                            <ExperienceForm
                              onSave={addExperience}
                              onCancel={cancelAdd}
                              onChange={(d) =>
                                setDraftEntry({ sectionType: 'experience', id: null, data: d })
                              }
                            />
                          )}
                          {sectionType === 'projects' && (
                            <ProjectForm
                              onSave={addProject}
                              onCancel={cancelAdd}
                              onChange={(d) =>
                                setDraftEntry({ sectionType: 'projects', id: null, data: d })
                              }
                            />
                          )}
                          {sectionType === 'skills' && (
                            <SkillsForm
                              onSave={addSkill}
                              onCancel={cancelAdd}
                              onChange={(d) =>
                                setDraftEntry({ sectionType: 'skills', id: null, data: d })
                              }
                            />
                          )}
                        </>
                      )

                      return (
                        <SectionBlock
                          key={sectionType}
                          type={sectionType}
                          isAdding={isAdding}
                          onToggleAdding={() => {
                            setAddingIn(isAdding ? null : sectionType)
                            setEditingEntry(null)
                            setDraftEntry(null)
                          }}
                          onRemove={() => removeSection(sectionType)}
                          addForm={addFormNode}
                          isEmpty={(profile[sectionType] as unknown[]).length === 0}
                        >
                          {/* education */}
                          {sectionType === 'education' &&
                            profile.education.map((entry) => (
                              <EntryListItem
                                key={entry.id}
                                entryId={entry.id}
                                expanded={expandedIds.has(entry.id)}
                                isEditing={editId === entry.id}
                                onToggle={() => toggleExpand(entry.id)}
                                onStartEdit={() => startEdit(entry.id, 'education')}
                                onCancelEdit={cancelEdit}
                                onDelete={() => deleteEducation(entry.id)}
                                summary={
                                  <EntrySum
                                    title={entry.school}
                                    sub={`${entry.degree}${entry.location ? ` · ${entry.location}` : ''}`}
                                    date={entry.dates}
                                  />
                                }
                                editForm={
                                  <EducationForm
                                    initial={entry}
                                    onSave={addEducation}
                                    onCancel={cancelEdit}
                                    onChange={(d) =>
                                      setDraftEntry({
                                        sectionType: 'education',
                                        id: entry.id,
                                        data: d,
                                      })
                                    }
                                  />
                                }
                                viewContent={
                                  <EntryViewContent
                                    bullets={[]}
                                    rawText={entry.rawText ?? ''}
                                    placeholder={ph}
                                    onRawChange={(v) => setRawText('education', entry.id, v)}
                                  />
                                }
                              />
                            ))}

                          {/* experience */}
                          {sectionType === 'experience' &&
                            (profile.experience as ExperienceEntry[]).map((entry) => (
                              <EntryListItem
                                key={entry.id}
                                entryId={entry.id}
                                expanded={expandedIds.has(entry.id)}
                                isEditing={editId === entry.id}
                                onToggle={() => toggleExpand(entry.id)}
                                onStartEdit={() => startEdit(entry.id, 'experience')}
                                onCancelEdit={cancelEdit}
                                onDelete={() => deleteExperience(entry.id)}
                                summary={
                                  <EntrySum
                                    title={entry.company}
                                    sub={entry.role}
                                    date={entry.dates}
                                  />
                                }
                                editForm={
                                  <ExperienceForm
                                    initial={entry}
                                    onSave={addExperience}
                                    onCancel={cancelEdit}
                                    onChange={(d) =>
                                      setDraftEntry({
                                        sectionType: 'experience',
                                        id: entry.id,
                                        data: d,
                                      })
                                    }
                                  />
                                }
                                viewContent={
                                  <EntryViewContent
                                    bullets={entry.bullets ?? []}
                                    rawText={entry.rawText ?? ''}
                                    placeholder={ph}
                                    onRawChange={(v) => setRawText('experience', entry.id, v)}
                                  />
                                }
                              />
                            ))}

                          {/* projects */}
                          {sectionType === 'projects' &&
                            (profile.projects as ProjectEntry[]).map((entry) => (
                              <EntryListItem
                                key={entry.id}
                                entryId={entry.id}
                                expanded={expandedIds.has(entry.id)}
                                isEditing={editId === entry.id}
                                onToggle={() => toggleExpand(entry.id)}
                                onStartEdit={() => startEdit(entry.id, 'projects')}
                                onCancelEdit={cancelEdit}
                                onDelete={() => deleteProject(entry.id)}
                                summary={
                                  <EntrySum
                                    title={entry.name}
                                    sub={entry.techStack}
                                    date={entry.dates}
                                  />
                                }
                                editForm={
                                  <ProjectForm
                                    initial={entry}
                                    onSave={addProject}
                                    onCancel={cancelEdit}
                                    onChange={(d) =>
                                      setDraftEntry({
                                        sectionType: 'projects',
                                        id: entry.id,
                                        data: d,
                                      })
                                    }
                                  />
                                }
                                viewContent={
                                  <EntryViewContent
                                    bullets={entry.bullets ?? []}
                                    rawText={entry.rawText ?? ''}
                                    placeholder={ph}
                                    onRawChange={(v) => setRawText('projects', entry.id, v)}
                                  />
                                }
                              />
                            ))}

                          {/* skills — flat list */}
                          {sectionType === 'skills' && (
                            <div className="flex flex-col gap-1">
                              {profile.skills.map((entry) => (
                                <div
                                  key={entry.id}
                                  className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#0c1a38] transition-colors"
                                >
                                  {editId === entry.id ? (
                                    <div className="w-full">
                                      <SkillsForm
                                        initial={entry}
                                        onSave={addSkill}
                                        onCancel={cancelEdit}
                                        onChange={(d) =>
                                          setDraftEntry({
                                            sectionType: 'skills',
                                            id: entry.id,
                                            data: d,
                                          })
                                        }
                                      />
                                    </div>
                                  ) : (
                                    <>
                                      <div>
                                        <p className="text-xs font-semibold text-[#94a3b8]">
                                          {entry.category || '—'}
                                        </p>
                                        <p className="text-[11px] text-[#4a7090] mt-0.5">
                                          {entry.technologies}
                                        </p>
                                      </div>
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <PillBtn
                                          variant="ghost"
                                          onClick={() => startEdit(entry.id, 'skills')}
                                        >
                                          edit
                                        </PillBtn>
                                        <PillBtn
                                          variant="danger"
                                          onClick={() => deleteSkill(entry.id)}
                                        >
                                          del
                                        </PillBtn>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </SectionBlock>
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
                        + add section
                      </button>
                      <AnimatePresence>
                        {showSectionPicker && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.97 }}
                            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#08132a] border border-[#1a3050] rounded-xl overflow-hidden shadow-xl z-10 min-w-[140px]"
                          >
                            {availableSections.map((s) => (
                              <button
                                key={s}
                                onClick={() => addSection(s)}
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-[#94a3b8] hover:bg-[#0c1a38] hover:text-porcelain transition-colors cursor-pointer capitalize"
                              >
                                {s}
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
        {sidebarOpen && !isMobile && (
          <div
            onMouseDown={onDividerMouseDown}
            className="w-1 shrink-0 bg-[#0d1a2e] hover:bg-payne-gray/40 active:bg-payne-gray/70 transition-colors cursor-col-resize"
          />
        )}

        {/* ══ RIGHT PANEL ══ */}
        <div
          className={cn(
            'flex-1 flex flex-col overflow-hidden bg-[#060e20] min-w-0',
            mobileTab === 'preview' ? 'flex' : 'hidden md:flex'
          )}
        >
          {/* toolbar */}
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
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* preview scroll */}
            <div className="flex-1 overflow-y-auto p-6 min-w-0 bg-[#030b18]">
              <div className="flex flex-col items-center gap-6 max-w-[820px] mx-auto pb-6">
                {Array.from({ length: pageCount }, (_, i) => (
                  <div
                    key={i}
                    className="w-full shadow-2xl rounded shrink-0 bg-white"
                    style={{ height: 1056 }}
                  >
                    {i > 0 && <div style={{ height: marginPx }} />}
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
                          transform: `translateY(-${i === 0 ? 0 : marginPx + i * contentPerPage}px)`,
                          marginBottom: `-${i === 0 ? 0 : marginPx + i * contentPerPage}px`,
                        }}
                      />
                    </div>
                    <div style={{ height: marginPx }} />
                  </div>
                ))}
              </div>
            </div>

            {/* format sidebar */}
            <AnimatePresence>
              {formatOpen && (
                <FormatSidebar
                  format={format}
                  onFormatChange={(patch) => setFormat((f) => ({ ...f, ...patch }))}
                  onReset={() => setFormat(DEFAULT_FORMAT)}
                  onClose={() => {
                    setFormatOpen(false)
                    setEditMode(false)
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      {/* end flex flex-1 overflow-hidden */}

      {/* ══ PDF PREVIEW MODAL ══ */}
      {pdfPreviewOpen && (
        <PdfPreviewModal
          html={pdfPreviewHtml}
          pageCount={pdfPageCount}
          onPageCountChange={setPdfPageCount}
          onPrint={handlePrint}
          onClose={() => setPdfPreviewOpen(false)}
        />
      )}
    </div>
  )
}

// ─── tiny summary atom (avoids repetition in sections.map) ───────────────────

function EntrySum({ title, sub, date }: { title?: string; sub?: string; date?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-bold text-porcelain">{title || '—'}</p>
      <p className="text-xs text-[#94a3b8]">
        {sub}
        {date && <span className="ml-2 text-payne-gray">{date}</span>}
      </p>
    </div>
  )
}
