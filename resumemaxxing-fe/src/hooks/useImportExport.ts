import { useState, useRef } from 'react'
import { parseTexResume } from '@/utils/texParser'
import { exportAsTex, exportAsMd, downloadFile } from '@/utils/profileExport'
import { exportCanvas, importCanvas, readJsonFile } from '@/utils/canvasBackup'
import { sectionsFromData } from '@/utils/profileStorage'
import { DEFAULT_PROFILE } from '@/constants/profileCanvas'
import type { ProfileData, SectionType } from '@/types/profile'
import type { FreeBlock } from '@/types/canvas'
import type { PositionMap } from './useCanvasInteraction'

export function useImportExport(
  profile: ProfileData,
  sections: SectionType[],
  positions: PositionMap,
  freeBlocks: FreeBlock[],
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>,
  setSections: React.Dispatch<React.SetStateAction<SectionType[]>>,
  setPositions: React.Dispatch<React.SetStateAction<PositionMap>>,
  setFreeBlocks: React.Dispatch<React.SetStateAction<FreeBlock[]>>
) {
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [pdfImporting, setPdfImporting] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const pdfFileRef = useRef<HTMLInputElement>(null)
  const jsonFileRef = useRef<HTMLInputElement>(null)

  const flashStatus = (status: 'success' | 'error') => {
    setImportStatus(status)
    setTimeout(() => setImportStatus('idle'), 3000)
  }

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
      flashStatus('success')
    } catch {
      flashStatus('error')
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
        flashStatus('success')
      } catch {
        flashStatus('error')
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
      setPositions(pos as PositionMap)
      setFreeBlocks(b)
      flashStatus('success')
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

  return {
    importStatus,
    pdfImporting,
    fileRef,
    pdfFileRef,
    jsonFileRef,
    handlePdfImport,
    handleTexImport,
    handleJsonImport,
    handleExportTex,
    handleExportMd,
    handleExportJson,
  }
}
