import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Plus,
  X,
  Trash2,
  Pencil,
  Upload,
  Download,
  FileText,
  GripHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Link } from 'react-router'
import { parseTexResume } from '@/utils/texParser'
import { exportAsTex, exportAsMd, downloadFile } from '@/utils/profileExport'
import { exportCanvas, importCanvas, readJsonFile } from '@/utils/canvasBackup'
import {
  loadProfile,
  loadSections,
  loadPositions,
  loadFreeBlocks,
  sectionsFromData,
} from '@/utils/profileStorage'
import {
  STORAGE_KEY,
  SECTIONS_KEY,
  POSITIONS_KEY,
  BLOCKS_KEY,
  SECTION_META,
  FREE_BLOCK_META,
  ALL_SECTION_TYPES,
  DEFAULT_PROFILE,
} from '@/constants/profileCanvas'
import type {
  ProfileData,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  SkillsEntry,
  CertificationEntry,
  AwardEntry,
  SectionType,
} from '@/types/profile'
import type { FreeBlock, FreeBlockType } from '@/types/canvas'
import { cn } from '@/lib/utils'
import { DropdownBtn, DropItem } from '@/components/ui/dropdown-btn'
import { EntryRow } from '@/components/canvas/EntryRow'
import { CanvasContextMenu } from '@/components/canvas/CanvasContextMenu'
import { NoteBlock } from '@/components/canvas/NoteBlock'
import { LinkBlock } from '@/components/canvas/LinkBlock'
import { ImageBlock } from '@/components/canvas/ImageBlock'
import {
  EducationForm,
  ExperienceForm,
  ProjectForm,
  SkillsForm,
  CertificationForm,
  AwardForm,
} from '@/components/canvas/ProfileForms'

export default function ProfilePage() {
  // ── profile state ──
  const [profile, setProfile] = useState<ProfileData>(loadProfile)
  const [sections, setSections] = useState<SectionType[]>(() => {
    const stored = loadSections()
    return stored.length ? stored : sectionsFromData(loadProfile())
  })

  // ── canvas state ──
  const [pan, setPan] = useState({ x: 80, y: 80 })
  const [zoom, setZoom] = useState(1)
  const [positions, setPositions] = useState(loadPositions)

  // ── free blocks ──
  const [freeBlocks, setFreeBlocks] = useState<FreeBlock[]>(loadFreeBlocks)
  const [draggingBlock, setDraggingBlock] = useState<string | null>(null)

  // ── ui state ──
  const [addingIn, setAddingIn] = useState<SectionType | null>(null)
  const [editingEntry, setEditingEntry] = useState<{ type: SectionType; id: string } | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<SectionType>>(new Set())
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showPicker, setShowPicker] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    screenX: number
    screenY: number
    canvasX: number
    canvasY: number
  } | null>(null)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [pdfImporting, setPdfImporting] = useState(false)
  const [draggingCard, setDraggingCard] = useState<SectionType | null>(null)

  // ── refs ──
  const fileRef = useRef<HTMLInputElement>(null)
  const pdfFileRef = useRef<HTMLInputElement>(null)
  const jsonFileRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const panDrag = useRef<{
    startX: number
    startY: number
    startPanX: number
    startPanY: number
  } | null>(null)
  const cardDrag = useRef<{
    type: SectionType
    startX: number
    startY: number
    cardX: number
    cardY: number
    moved: boolean
  } | null>(null)
  const blockDrag = useRef<{
    id: string
    startX: number
    startY: number
    blockX: number
    blockY: number
    moved: boolean
  } | null>(null)

  // ── persist ──
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }, [profile])
  useEffect(() => {
    localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections))
  }, [sections])
  useEffect(() => {
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions))
  }, [positions])
  useEffect(() => {
    localStorage.setItem(BLOCKS_KEY, JSON.stringify(freeBlocks))
  }, [freeBlocks])

  // ── canvas mouse handlers ──
  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-card]')) return
    panDrag.current = { startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y }
  }

  const onCanvasContextMenu = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-card]')) return
    e.preventDefault()
    const rect = canvasRef.current!.getBoundingClientRect()
    setContextMenu({
      screenX: e.clientX,
      screenY: e.clientY,
      canvasX: (e.clientX - rect.left - pan.x) / zoom,
      canvasY: (e.clientY - rect.top - pan.y) / zoom,
    })
  }

  const onCardHeaderMouseDown = (e: React.MouseEvent, type: SectionType) => {
    e.stopPropagation()
    cardDrag.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      cardX: positions[type].x,
      cardY: positions[type].y,
      moved: false,
    }
    setDraggingCard(type)
  }

  const onBlockHeaderMouseDown = (e: React.MouseEvent, block: FreeBlock) => {
    e.stopPropagation()
    blockDrag.current = {
      id: block.id,
      startX: e.clientX,
      startY: e.clientY,
      blockX: block.x,
      blockY: block.y,
      moved: false,
    }
    setDraggingBlock(block.id)
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
          setPositions((prev) => ({
            ...prev,
            [type]: { x: cardDrag.current!.cardX + dx, y: cardDrag.current!.cardY + dy },
          }))
        }
      }
      if (blockDrag.current) {
        const dx = (e.clientX - blockDrag.current.startX) / zoom
        const dy = (e.clientY - blockDrag.current.startY) / zoom
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) blockDrag.current.moved = true
        if (blockDrag.current.moved) {
          const id = blockDrag.current.id
          setFreeBlocks((prev) =>
            prev.map((b) =>
              b.id === id
                ? { ...b, x: blockDrag.current!.blockX + dx, y: blockDrag.current!.blockY + dy }
                : b
            )
          )
        }
      }
    }
    const onUp = () => {
      if (cardDrag.current && !cardDrag.current.moved) {
        const type = cardDrag.current.type
        setExpandedCards((prev) => {
          const next = new Set(prev)
          if (next.has(type)) next.delete(type)
          else next.add(type)
          return next
        })
      }
      panDrag.current = null
      cardDrag.current = null
      blockDrag.current = null
      setDraggingCard(null)
      setDraggingBlock(null)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [zoom])

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.08 : 0.93
    const newZoom = Math.max(0.25, Math.min(2.5, zoom * factor))
    const rect = canvasRef.current!.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    setPan((p) => ({
      x: cx - (cx - p.x) * (newZoom / zoom),
      y: cy - (cy - p.y) * (newZoom / zoom),
    }))
    setZoom(newZoom)
  }

  // ── clipboard paste for images ──
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (!file) continue
          const reader = new FileReader()
          reader.onload = (ev) => {
            const src = ev.target?.result as string
            const rect = canvasRef.current?.getBoundingClientRect()
            const cx = rect ? (rect.width / 2 - pan.x) / zoom : 200
            const cy = rect ? (rect.height / 2 - pan.y) / zoom : 200
            setFreeBlocks((prev) => [
              ...prev,
              { id: crypto.randomUUID(), type: 'image', x: cx, y: cy, src },
            ])
          }
          reader.readAsDataURL(file)
          break
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [pan, zoom])

  // ── section management ──
  const addSection = (type: SectionType, at?: { x: number; y: number }) => {
    if (!sections.includes(type)) {
      setSections((prev) => [...prev, type])
      if (at) setPositions((prev) => ({ ...prev, [type]: at }))
    }
    setShowPicker(false)
    setExpandedCards((prev) => new Set(prev).add(type))
    setAddingIn(type)
  }
  const removeSection = (type: SectionType) => {
    setSections((prev) => prev.filter((s) => s !== type))
    setProfile((p) => ({ ...p, [type]: [] }))
    if (addingIn === type) setAddingIn(null)
  }

  // ── free block management ──
  const addFreeBlock = (type: FreeBlockType, at?: { x: number; y: number }) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    const cx = at?.x ?? (rect ? (rect.width / 2 - pan.x) / zoom : 200)
    const cy = at?.y ?? (rect ? (rect.height / 2 - pan.y) / zoom : 200)
    const base = { id: crypto.randomUUID(), type, x: cx, y: cy }
    const block: FreeBlock =
      type === 'note'
        ? { ...base, content: '' }
        : type === 'link'
          ? { ...base, url: '', linkTitle: '', linkDesc: '' }
          : { ...base }
    setFreeBlocks((prev) => [...prev, block])
    setShowPicker(false)
  }
  const updateFreeBlock = (id: string, patch: Partial<FreeBlock>) =>
    setFreeBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  const deleteFreeBlock = (id: string) => setFreeBlocks((prev) => prev.filter((b) => b.id !== id))

  // ── CRUD ──
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
    [editingEntry]
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
    [editingEntry]
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
    [editingEntry]
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
    [editingEntry]
  )

  const makeExpCrud = (key: 'research' | 'leadership' | 'volunteering') => ({
    add: (entry: Omit<ExperienceEntry, 'id'>) => {
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
    del: (id: string) =>
      setProfile((p) => ({
        ...p,
        [key]: (p[key] as ExperienceEntry[]).filter((e) => e.id !== id),
      })),
  })
  const { add: addResearch, del: deleteResearch } = makeExpCrud('research')
  const { add: addLeadership, del: deleteLeadership } = makeExpCrud('leadership')
  const { add: addVolunteering, del: deleteVolunteering } = makeExpCrud('volunteering')

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
    [editingEntry]
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
    [editingEntry]
  )

  // ── import/export ──
  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfImporting(true)
    try {
      const { extractTextFromPdf, parsePdfText } = await import('@/utils/pdfParser')
      const text = await extractTextFromPdf(file)
      const parsed = parsePdfText(text)
      setProfile((prev) => ({
        ...DEFAULT_PROFILE,
        ...prev,
        ...parsed,
        contact: { ...prev.contact, ...parsed.contact },
      }))
      setSections((prev) => {
        const m = [...prev]
        sectionsFromData({ ...DEFAULT_PROFILE, ...parsed }).forEach((s) => {
          if (!m.includes(s)) m.push(s)
        })
        return m
      })
      setImportStatus('success')
      setTimeout(() => setImportStatus('idle'), 3000)
    } catch {
      setImportStatus('error')
      setTimeout(() => setImportStatus('idle'), 3000)
    } finally {
      setPdfImporting(false)
      e.target.value = ''
    }
  }

  const handleTexImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = parseTexResume(ev.target?.result as string)
        setProfile(parsed)
        setSections((prev) => {
          const m = [...prev]
          sectionsFromData(parsed).forEach((s) => {
            if (!m.includes(s)) m.push(s)
          })
          return m
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

  const handleJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const raw = await readJsonFile(file)
      const result = importCanvas(raw)
      if (!result.ok) {
        setImportStatus('error')
        alert(`Import failed: ${result.error}`)
        return
      }
      const { profile: p, sections: s, positions: pos, blocks: b } = result.data
      setProfile(p)
      setSections(s)
      setPositions(pos)
      setFreeBlocks(b)
      setImportStatus('success')
      setTimeout(() => setImportStatus('idle'), 3000)
    } catch (err) {
      setImportStatus('error')
      alert(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setTimeout(() => setImportStatus('idle'), 3000)
    } finally {
      e.target.value = ''
    }
  }

  const handleExportTex = () =>
    downloadFile(
      exportAsTex(profile),
      `${profile.contact.name?.replace(/\s+/g, '_') || 'resume'}_resume.tex`,
      'text/plain'
    )
  const handleExportMd = () =>
    downloadFile(
      exportAsMd(profile),
      `${profile.contact.name?.replace(/\s+/g, '_') || 'resume'}_resume.md`,
      'text/markdown'
    )
  const handleExportJson = () => exportCanvas(profile, sections, positions, freeBlocks)

  // ── helpers ──
  const getEntries = (type: SectionType) => (profile[type] as unknown[]) ?? []
  const editingId = editingEntry?.id
  const availableSections = ALL_SECTION_TYPES.filter((s) => !sections.includes(s))
  const dotSize = Math.max(24 * zoom, 8)
  const dotStyle: React.CSSProperties = {
    backgroundImage: `radial-gradient(circle, rgba(26,48,80,0.9) 1px, transparent 1px)`,
    backgroundSize: `${dotSize}px ${dotSize}px`,
    backgroundPosition: `${pan.x % dotSize}px ${pan.y % dotSize}px`,
  }

  const toggleEntryExpand = (id: string) =>
    setExpandedIds((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="relative w-full overflow-hidden bg-[#030b18]"
      style={{ height: 'calc(100vh - 56px)' }}
    >
      {/* dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={dotStyle} />

      {/* top HUD */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-3 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3">
          <div className="flex flex-col leading-none">
            <span className="font-jetbrains text-[10px] text-[#456677] tracking-[0.3em] uppercase">
              your
            </span>
            <span className="font-jetbrains text-lg font-bold text-[#e8f0fc] tracking-tight leading-none">
              life.
            </span>
          </div>
          <div className="w-px h-8 bg-[#1a3050]" />
          <p className="font-jetbrains text-[10px] text-[#4a7090] max-w-[200px] leading-relaxed hidden md:block">
            everything you've ever done — your source of truth
          </p>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <AnimatePresence>
            {importStatus !== 'idle' && (
              <motion.span
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  'text-[11px] font-jetbrains',
                  importStatus === 'success' ? 'text-[#4ade80]' : 'text-[#ef4444]'
                )}
              >
                {importStatus === 'success' ? '✓ imported' : '✗ parse error'}
              </motion.span>
            )}
          </AnimatePresence>
          <DropdownBtn label="import" icon={<Upload size={11} />} align="right">
            <DropItem onClick={() => jsonFileRef.current?.click()}>
              <Upload size={11} /> canvas backup (.json)
            </DropItem>
            <DropItem onClick={() => fileRef.current?.click()}>
              <Upload size={11} /> .tex resume
            </DropItem>
            <DropItem onClick={() => pdfFileRef.current?.click()}>
              <Upload size={11} /> {pdfImporting ? 'parsing...' : '.pdf resume'}
            </DropItem>
          </DropdownBtn>
          <DropdownBtn label="export" icon={<Download size={11} />} align="right">
            <DropItem onClick={handleExportJson}>
              <Download size={11} /> canvas backup (.json)
            </DropItem>
            <DropItem onClick={handleExportTex}>
              <Download size={11} /> .tex resume
            </DropItem>
            <DropItem onClick={handleExportMd}>
              <FileText size={11} /> .md resume
            </DropItem>
          </DropdownBtn>
          <Link
            to="/create"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-jetbrains bg-[#456677] text-white hover:bg-[#5a7d91] transition-all"
          >
            create resume ↗
          </Link>
          <input
            ref={jsonFileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleJsonImport}
          />
          <input
            ref={fileRef}
            type="file"
            accept=".tex"
            className="hidden"
            onChange={handleTexImport}
          />
          <input
            ref={pdfFileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handlePdfImport}
          />
        </div>
      </div>

      {/* canvas */}
      <div
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor: panDrag.current ? 'grabbing' : 'grab' }}
        onMouseDown={onCanvasMouseDown}
        onWheel={onWheel}
        onContextMenu={onCanvasContextMenu}
      >
        <div
          style={{
            position: 'absolute',
            transformOrigin: '0 0',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            willChange: 'transform',
          }}
        >
          {/* section cards */}
          {sections.map((type) => {
            const meta = SECTION_META[type]
            const entries = getEntries(type)
            const expanded = expandedCards.has(type)
            const isAdding = addingIn === type

            const expSaveHandlers: Record<string, (e: Omit<ExperienceEntry, 'id'>) => void> = {
              experience: addExperience,
              research: addResearch,
              leadership: addLeadership,
              volunteering: addVolunteering,
            }
            const expDelHandlers: Record<string, (id: string) => void> = {
              experience: (id) =>
                setProfile((p) => ({ ...p, experience: p.experience.filter((e) => e.id !== id) })),
              research: deleteResearch,
              leadership: deleteLeadership,
              volunteering: deleteVolunteering,
            }

            return (
              <motion.div
                key={type}
                data-card
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  position: 'absolute',
                  left: positions[type].x,
                  top: positions[type].y,
                  width: 300,
                  zIndex: draggingCard === type ? 100 : 1,
                }}
              >
                <div
                  className={cn(
                    'rounded-xl overflow-hidden border transition-shadow duration-200',
                    draggingCard === type
                      ? 'border-[#2a4870] shadow-[0_8px_40px_rgba(0,0,0,0.6)]'
                      : 'border-[#1a3050] shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
                  )}
                >
                  {/* header */}
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 select-none"
                    style={{
                      background: '#0a1628',
                      cursor: draggingCard === type ? 'grabbing' : 'grab',
                      borderBottom: expanded ? '1px solid #1a3050' : 'none',
                    }}
                    onMouseDown={(e) => onCardHeaderMouseDown(e, type)}
                  >
                    <GripHorizontal size={12} className="text-[#2a4060] flex-shrink-0" />
                    <span style={{ color: meta.color }} className="flex-shrink-0">
                      {meta.icon}
                    </span>
                    <span
                      className="font-jetbrains text-[10px] font-bold tracking-widest flex-1"
                      style={{ color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    <span className="font-jetbrains text-[9px] text-[#2a4060]">
                      {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                    </span>
                    {expanded ? (
                      <ChevronUp size={11} className="text-[#456677]" />
                    ) : (
                      <ChevronDown size={11} className="text-[#456677]" />
                    )}
                    <button
                      className="text-[#2a4060] hover:text-[#ef4444] transition-colors cursor-pointer ml-1"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation()
                        removeSection(type)
                      }}
                    >
                      <X size={11} />
                    </button>
                  </div>

                  {/* body */}
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
                        <div
                          className="flex flex-col gap-0"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          {/* skills */}
                          {type === 'skills' &&
                            profile.skills.map((entry) => (
                              <div key={entry.id} className="border-b border-[#0d1a2e]">
                                {editingId === entry.id ? (
                                  <div className="p-3">
                                    <SkillsForm
                                      initial={entry}
                                      onSave={addSkill}
                                      onCancel={() => setEditingEntry(null)}
                                    />
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between px-3 py-2 group hover:bg-[#080f1e]">
                                    <div>
                                      <p className="font-jetbrains text-[11px] text-[#94a3b8] font-semibold">
                                        {entry.category || '—'}
                                      </p>
                                      <p className="font-jetbrains text-[10px] text-[#4a7090] mt-0.5 leading-relaxed">
                                        {entry.technologies}
                                      </p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => {
                                          setEditingEntry({ type: 'skills', id: entry.id })
                                          setAddingIn(null)
                                        }}
                                        className="text-[#456677] hover:text-[#94a3b8] cursor-pointer"
                                      >
                                        <Pencil size={10} />
                                      </button>
                                      <button
                                        onClick={() =>
                                          setProfile((p) => ({
                                            ...p,
                                            skills: p.skills.filter((e) => e.id !== entry.id),
                                          }))
                                        }
                                        className="text-[#456677] hover:text-[#ef4444] cursor-pointer"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}

                          {/* education */}
                          {type === 'education' &&
                            profile.education.map((entry) => (
                              <EntryRow
                                key={entry.id}
                                title={entry.school}
                                sub={entry.degree}
                                date={entry.dates}
                                expanded={expandedIds.has(entry.id)}
                                onToggle={() => toggleEntryExpand(entry.id)}
                                onEdit={() => {
                                  setEditingEntry({ type: 'education', id: entry.id })
                                  setAddingIn(null)
                                }}
                                onDelete={() =>
                                  setProfile((p) => ({
                                    ...p,
                                    education: p.education.filter((e) => e.id !== entry.id),
                                  }))
                                }
                              >
                                {editingId === entry.id ? (
                                  <div className="p-3 border-t border-[#0d1a2e]">
                                    <EducationForm
                                      initial={entry}
                                      onSave={addEducation}
                                      onCancel={() => setEditingEntry(null)}
                                    />
                                  </div>
                                ) : (
                                  entry.coursework && (
                                    <p className="px-3 pb-2 font-jetbrains text-[10px] text-[#4a7090]">
                                      coursework: {entry.coursework}
                                    </p>
                                  )
                                )}
                              </EntryRow>
                            ))}

                          {/* experience / research / leadership / volunteering */}
                          {(type === 'experience' ||
                            type === 'research' ||
                            type === 'leadership' ||
                            type === 'volunteering') &&
                            (profile[type] as ExperienceEntry[]).map((entry) => (
                              <EntryRow
                                key={entry.id}
                                title={entry.company}
                                sub={entry.role}
                                date={entry.dates}
                                expanded={expandedIds.has(entry.id)}
                                onToggle={() => toggleEntryExpand(entry.id)}
                                onEdit={() => {
                                  setEditingEntry({ type, id: entry.id })
                                  setAddingIn(null)
                                }}
                                onDelete={() => expDelHandlers[type](entry.id)}
                              >
                                {editingId === entry.id ? (
                                  <div className="p-3 border-t border-[#0d1a2e]">
                                    <ExperienceForm
                                      initial={entry}
                                      onSave={expSaveHandlers[type]}
                                      onCancel={() => setEditingEntry(null)}
                                    />
                                  </div>
                                ) : entry.bullets.length > 0 ? (
                                  <ul className="px-3 pb-2 flex flex-col gap-0.5">
                                    {entry.bullets.slice(0, 2).map((b, i) => (
                                      <li
                                        key={i}
                                        className="font-jetbrains text-[10px] text-[#4a7090] flex gap-1.5"
                                      >
                                        <span className="text-[#456677] flex-shrink-0">◆</span>
                                        {b}
                                      </li>
                                    ))}
                                  </ul>
                                ) : null}
                              </EntryRow>
                            ))}

                          {/* projects */}
                          {type === 'projects' &&
                            profile.projects.map((entry) => (
                              <EntryRow
                                key={entry.id}
                                title={entry.name}
                                sub={entry.techStack}
                                date={entry.dates}
                                expanded={expandedIds.has(entry.id)}
                                onToggle={() => toggleEntryExpand(entry.id)}
                                onEdit={() => {
                                  setEditingEntry({ type: 'projects', id: entry.id })
                                  setAddingIn(null)
                                }}
                                onDelete={() =>
                                  setProfile((p) => ({
                                    ...p,
                                    projects: p.projects.filter((e) => e.id !== entry.id),
                                  }))
                                }
                              >
                                {editingId === entry.id ? (
                                  <div className="p-3 border-t border-[#0d1a2e]">
                                    <ProjectForm
                                      initial={entry}
                                      onSave={addProject}
                                      onCancel={() => setEditingEntry(null)}
                                    />
                                  </div>
                                ) : entry.bullets.length > 0 ? (
                                  <ul className="px-3 pb-2 flex flex-col gap-0.5">
                                    {entry.bullets.slice(0, 2).map((b, i) => (
                                      <li
                                        key={i}
                                        className="font-jetbrains text-[10px] text-[#4a7090] flex gap-1.5"
                                      >
                                        <span className="text-[#456677] flex-shrink-0">◆</span>
                                        {b}
                                      </li>
                                    ))}
                                  </ul>
                                ) : null}
                              </EntryRow>
                            ))}

                          {/* certifications */}
                          {type === 'certifications' &&
                            profile.certifications.map((entry) => (
                              <EntryRow
                                key={entry.id}
                                title={entry.title}
                                sub={entry.issuer}
                                date={entry.date}
                                expanded={expandedIds.has(entry.id)}
                                onToggle={() => toggleEntryExpand(entry.id)}
                                onEdit={() => {
                                  setEditingEntry({ type: 'certifications', id: entry.id })
                                  setAddingIn(null)
                                }}
                                onDelete={() =>
                                  setProfile((p) => ({
                                    ...p,
                                    certifications: p.certifications.filter(
                                      (e) => e.id !== entry.id
                                    ),
                                  }))
                                }
                              >
                                {editingId === entry.id && (
                                  <div className="p-3 border-t border-[#0d1a2e]">
                                    <CertificationForm
                                      initial={entry}
                                      onSave={addCertification}
                                      onCancel={() => setEditingEntry(null)}
                                    />
                                  </div>
                                )}
                              </EntryRow>
                            ))}

                          {/* awards */}
                          {type === 'awards' &&
                            profile.awards.map((entry) => (
                              <EntryRow
                                key={entry.id}
                                title={entry.title}
                                sub={entry.issuer}
                                date={entry.date}
                                expanded={expandedIds.has(entry.id)}
                                onToggle={() => toggleEntryExpand(entry.id)}
                                onEdit={() => {
                                  setEditingEntry({ type: 'awards', id: entry.id })
                                  setAddingIn(null)
                                }}
                                onDelete={() =>
                                  setProfile((p) => ({
                                    ...p,
                                    awards: p.awards.filter((e) => e.id !== entry.id),
                                  }))
                                }
                              >
                                {editingId === entry.id && (
                                  <div className="p-3 border-t border-[#0d1a2e]">
                                    <AwardForm
                                      initial={entry}
                                      onSave={addAward}
                                      onCancel={() => setEditingEntry(null)}
                                    />
                                  </div>
                                )}
                              </EntryRow>
                            ))}

                          {/* add form */}
                          {isAdding && (
                            <div className="p-3 border-t border-[#0d1a2e]">
                              {type === 'education' && (
                                <EducationForm
                                  onSave={addEducation}
                                  onCancel={() => setAddingIn(null)}
                                />
                              )}
                              {type === 'experience' && (
                                <ExperienceForm
                                  onSave={addExperience}
                                  onCancel={() => setAddingIn(null)}
                                />
                              )}
                              {type === 'projects' && (
                                <ProjectForm
                                  onSave={addProject}
                                  onCancel={() => setAddingIn(null)}
                                />
                              )}
                              {type === 'skills' && (
                                <SkillsForm onSave={addSkill} onCancel={() => setAddingIn(null)} />
                              )}
                              {type === 'research' && (
                                <ExperienceForm
                                  onSave={addResearch}
                                  onCancel={() => setAddingIn(null)}
                                />
                              )}
                              {type === 'leadership' && (
                                <ExperienceForm
                                  onSave={addLeadership}
                                  onCancel={() => setAddingIn(null)}
                                />
                              )}
                              {type === 'volunteering' && (
                                <ExperienceForm
                                  onSave={addVolunteering}
                                  onCancel={() => setAddingIn(null)}
                                />
                              )}
                              {type === 'certifications' && (
                                <CertificationForm
                                  onSave={addCertification}
                                  onCancel={() => setAddingIn(null)}
                                />
                              )}
                              {type === 'awards' && (
                                <AwardForm onSave={addAward} onCancel={() => setAddingIn(null)} />
                              )}
                            </div>
                          )}

                          {/* add button */}
                          {!isAdding && (
                            <button
                              className="w-full flex items-center gap-1.5 px-3 py-2 font-jetbrains text-[10px] text-[#2a4060] hover:text-[#456677] hover:bg-[#080f1e] transition-colors cursor-pointer border-t border-[#0d1a2e]"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={() => {
                                setAddingIn(type)
                                setEditingEntry(null)
                              }}
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

          {/* free blocks */}
          {freeBlocks.map((block) => (
            <motion.div
              key={block.id}
              data-card
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                position: 'absolute',
                left: block.x,
                top: block.y,
                zIndex: draggingBlock === block.id ? 100 : 2,
              }}
            >
              {block.type === 'note' && (
                <NoteBlock
                  block={block}
                  onUpdate={(p) => updateFreeBlock(block.id, p)}
                  onDelete={() => deleteFreeBlock(block.id)}
                  onHeaderMouseDown={(e) => onBlockHeaderMouseDown(e, block)}
                  isDragging={draggingBlock === block.id}
                />
              )}
              {block.type === 'link' && (
                <LinkBlock
                  block={block}
                  onUpdate={(p) => updateFreeBlock(block.id, p)}
                  onDelete={() => deleteFreeBlock(block.id)}
                  onHeaderMouseDown={(e) => onBlockHeaderMouseDown(e, block)}
                  isDragging={draggingBlock === block.id}
                />
              )}
              {block.type === 'image' && (
                <ImageBlock
                  block={block}
                  onUpdate={(p) => updateFreeBlock(block.id, p)}
                  onDelete={() => deleteFreeBlock(block.id)}
                  onHeaderMouseDown={(e) => onBlockHeaderMouseDown(e, block)}
                  isDragging={draggingBlock === block.id}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* bottom-right HUD */}
      <div className="absolute bottom-5 right-5 z-30 flex flex-col items-end gap-3">
        {/* zoom */}
        <div className="flex items-center gap-1.5 bg-[#08132a]/90 border border-[#1a3050] rounded-full px-3 py-1.5 backdrop-blur-sm">
          <button
            onClick={() => setZoom((z) => Math.max(0.25, z * 0.85))}
            className="text-[#456677] hover:text-[#94a3b8] transition-colors cursor-pointer"
          >
            <span className="font-jetbrains text-lg leading-none">−</span>
          </button>
          <span className="font-jetbrains text-[10px] text-[#4a7090] w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z * 1.15))}
            className="text-[#456677] hover:text-[#94a3b8] transition-colors cursor-pointer"
          >
            <span className="font-jetbrains text-lg leading-none">+</span>
          </button>
          <div className="w-px h-3 bg-[#1a3050] mx-0.5" />
          <button
            onClick={() => {
              setPan({ x: 80, y: 80 })
              setZoom(1)
            }}
            className="text-[#456677] hover:text-[#94a3b8] transition-colors cursor-pointer"
          >
            <RotateCcw size={11} />
          </button>
        </div>

        {/* add picker */}
        <div className="relative">
          <button
            onClick={() => setShowPicker((p) => !p)}
            className="flex items-center gap-2 bg-[#456677] hover:bg-[#5a7d91] text-white rounded-full px-4 py-2 font-jetbrains text-[11px] font-semibold transition-all shadow-lg cursor-pointer"
          >
            <Plus size={13} /> add to canvas
          </button>

          <AnimatePresence>
            {showPicker && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                className="absolute bottom-full mb-2 right-0 bg-[#08132a] border border-[#1a3050] rounded-xl shadow-2xl p-2 w-64"
              >
                <p className="font-jetbrains text-[9px] text-[#2a4060] tracking-widest uppercase px-2 pb-1.5">
                  // resume sections
                </p>
                {availableSections.map((s) => (
                  <button
                    key={s}
                    onClick={() => addSection(s)}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg hover:bg-[#0c1a38] transition-colors cursor-pointer"
                  >
                    <span style={{ color: SECTION_META[s].color }}>{SECTION_META[s].icon}</span>
                    <div className="text-left">
                      <p className="font-jetbrains text-[11px] text-[#c8d8f0] font-semibold">
                        {SECTION_META[s].label}
                      </p>
                      <p className="font-jetbrains text-[9px] text-[#4a7090]">
                        {SECTION_META[s].description}
                      </p>
                    </div>
                  </button>
                ))}
                {availableSections.length === 0 && (
                  <p className="font-jetbrains text-[10px] text-[#2a4060] px-2.5 py-1.5">
                    all sections added
                  </p>
                )}

                <div className="my-2 border-t border-[#1a3050]" />

                <p className="font-jetbrains text-[9px] text-[#2a4060] tracking-widest uppercase px-2 pb-1.5">
                  // freeform blocks
                </p>
                {(
                  Object.entries(FREE_BLOCK_META) as [
                    FreeBlockType,
                    (typeof FREE_BLOCK_META)[FreeBlockType],
                  ][]
                ).map(([type, meta]) => (
                  <button
                    key={type}
                    onClick={() => addFreeBlock(type)}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg hover:bg-[#0c1a38] transition-colors cursor-pointer"
                  >
                    <span style={{ color: meta.color }}>{meta.icon}</span>
                    <div className="text-left">
                      <p className="font-jetbrains text-[11px] text-[#c8d8f0] font-semibold">
                        {meta.label}
                      </p>
                      <p className="font-jetbrains text-[9px] text-[#4a7090]">{meta.description}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* context menu */}
      <AnimatePresence>
        {contextMenu && (
          <CanvasContextMenu
            screenX={contextMenu.screenX}
            screenY={contextMenu.screenY}
            availableSections={availableSections}
            onAddSection={(type) =>
              addSection(type, { x: contextMenu.canvasX, y: contextMenu.canvasY })
            }
            onAddBlock={(type) =>
              addFreeBlock(type, { x: contextMenu.canvasX, y: contextMenu.canvasY })
            }
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
