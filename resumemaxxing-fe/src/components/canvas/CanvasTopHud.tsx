import { Upload, Download, FileText, CircleQuestionMark } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { DropdownBtn, DropItem } from '@/components/ui/dropdown-btn'

interface CanvasTopHudProps {
  importStatus: 'idle' | 'success' | 'error'
  pdfImporting: boolean
  fileRef: React.RefObject<HTMLInputElement | null>
  pdfFileRef: React.RefObject<HTMLInputElement | null>
  jsonFileRef: React.RefObject<HTMLInputElement | null>
  onPdfImport: (e: React.ChangeEvent<HTMLInputElement>) => void
  onTexImport: (e: React.ChangeEvent<HTMLInputElement>) => void
  onJsonImport: (e: React.ChangeEvent<HTMLInputElement>) => void
  onExportTex: () => void
  onExportMd: () => void
  onExportJson: () => void
}

export function CanvasTopHud({
  importStatus,
  pdfImporting,
  fileRef,
  pdfFileRef,
  jsonFileRef,
  onPdfImport,
  onTexImport,
  onJsonImport,
  onExportTex,
  onExportMd,
  onExportJson,
}: CanvasTopHudProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-3 pointer-events-none">
      {/* branding + hint */}
      <div className="pointer-events-auto flex items-center gap-2">
        <div className="flex flex-col leading-none">
          <span className="font-jetbrains text-[10px] text-payne-gray tracking-[0.3em] uppercase">
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
        <div className="relative group">
          <CircleQuestionMark className="text-[#4a7090] hover:cursor-pointer" width={16} />
          <div className="absolute invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity">
            <div className="min-h-[30px] min-w-[320px] rounded-lg p-2 text-[10px] text-[#4a7090] bg-[#0a1628] leading-3">
              <p>
                Document everything you have done that you think is relevant to creating a resume.
              </p>
              <p>Doesn't need to be polished, can be notes, pictures, freeforms, etc..</p>
            </div>
          </div>
        </div>
      </div>

      {/* controls */}
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
          <DropItem onClick={onExportJson}>
            <Download size={11} /> canvas backup (.json)
          </DropItem>
          <DropItem onClick={onExportTex}>
            <Download size={11} /> .tex resume
          </DropItem>
          <DropItem onClick={onExportMd}>
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
          onChange={onJsonImport}
        />
        <input ref={fileRef} type="file" accept=".tex" className="hidden" onChange={onTexImport} />
        <input
          ref={pdfFileRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={onPdfImport}
        />
      </div>
    </div>
  )
}
