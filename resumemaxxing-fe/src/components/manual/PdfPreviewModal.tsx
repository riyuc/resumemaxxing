import { useRef, useCallback } from 'react'
import { Printer, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import PillBtn from '@/components/ui/pill-btn'

interface PdfPreviewModalProps {
  html: string
  pageCount: number
  onPageCountChange: (n: number) => void
  onPrint: () => void
  onClose: () => void
}

export function PdfPreviewModal({
  html,
  pageCount,
  onPageCountChange,
  onPrint,
  onClose,
}: PdfPreviewModalProps) {
  const ifrRef = useRef<HTMLIFrameElement>(null)

  const handleLoad = useCallback(() => {
    const h = ifrRef.current?.contentDocument?.body?.scrollHeight
    if (h && ifrRef.current) {
      ifrRef.current.style.height = `${h}px`
      onPageCountChange(Math.max(1, Math.ceil(h / 1056)))
    }
  }, [onPageCountChange])

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col items-center overflow-y-auto py-8 px-4">
      {/* toolbar */}
      <div className="sticky top-0 z-10 w-full max-w-[880px] flex items-center justify-between px-4 py-2.5 bg-[#030b18] border border-[#1a3050] rounded-xl mb-5 shadow-xl">
        <div className="flex items-center gap-3 text-xs">
          <Printer size={13} className="text-payne-gray" />
          <span className="text-[#c8d8f0]">PDF Preview</span>
          <span
            className={cn('font-jetbrains', pageCount > 1 ? 'text-[#ef4444]' : 'text-[#4ade80]')}
          >
            {pageCount > 1 ? `⚠ ${pageCount} pages` : '✓ 1 page'}
          </span>
        </div>
        <div className="flex gap-2">
          <PillBtn variant="accent" onClick={onPrint}>
            <Printer size={11} /> print / save PDF
          </PillBtn>
          <PillBtn variant="ghost" onClick={onClose}>
            <X size={11} /> close
          </PillBtn>
        </div>
      </div>
      {/* page view */}
      <div className="w-full max-w-[880px] relative shadow-2xl">
        <iframe
          ref={ifrRef}
          srcDoc={html}
          title="PDF Preview"
          sandbox="allow-same-origin"
          className="w-full border-0 bg-white"
          style={{ minHeight: '1056px', overflow: 'hidden' }}
          onLoad={handleLoad}
        />
        {/* page-break overlays */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: pageCount - 1 }, (_, i) => (
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
  )
}
