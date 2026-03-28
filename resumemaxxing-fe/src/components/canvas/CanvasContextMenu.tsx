import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { SECTION_META, FREE_BLOCK_META } from '@/constants/profileCanvas'
import type { SectionType } from '@/types/profile'
import type { FreeBlockType } from '@/types/canvas'

interface CanvasContextMenuProps {
  screenX: number
  screenY: number
  availableSections: SectionType[]
  onAddSection: (type: SectionType) => void
  onAddBlock: (type: FreeBlockType) => void
  onClose: () => void
}

export function CanvasContextMenu({
  screenX,
  screenY,
  availableSections,
  onAddSection,
  onAddBlock,
  onClose,
}: CanvasContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // close on outside click or Escape
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // clamp so menu doesn't overflow viewport
  const menuW = 220
  const menuH = 380 // approximate
  const x = Math.min(screenX, window.innerWidth - menuW - 8)
  const y = Math.min(screenY, window.innerHeight - menuH - 8)

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.1 }}
      style={{ position: 'fixed', left: x, top: y, width: menuW, zIndex: 9999 }}
      className="bg-[#08132a] border border-[#1a3050] rounded-xl shadow-2xl overflow-hidden py-1"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* sections */}
      <p className="font-jetbrains text-[9px] text-[#2a4060] tracking-widest uppercase px-3 pt-2 pb-1.5">
        // resume sections
      </p>
      {availableSections.length === 0 ? (
        <p className="font-jetbrains text-[10px] text-[#2a4060] px-3 py-1.5">all sections added</p>
      ) : (
        availableSections.map((s) => (
          <button
            key={s}
            onClick={() => {
              onAddSection(s)
              onClose()
            }}
            className="flex items-center gap-2.5 w-full px-3 py-1.5 hover:bg-[#0c1a38] transition-colors cursor-pointer text-left"
          >
            <span style={{ color: SECTION_META[s].color }} className="flex-shrink-0">
              {SECTION_META[s].icon}
            </span>
            <span className="font-jetbrains text-[11px] text-[#c8d8f0]">
              {SECTION_META[s].label}
            </span>
          </button>
        ))
      )}

      <div className="my-1 border-t border-[#1a3050]" />

      {/* free blocks */}
      <p className="font-jetbrains text-[9px] text-[#2a4060] tracking-widest uppercase px-3 pt-1.5 pb-1.5">
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
          onClick={() => {
            onAddBlock(type)
            onClose()
          }}
          className="flex items-center gap-2.5 w-full px-3 py-1.5 hover:bg-[#0c1a38] transition-colors cursor-pointer text-left"
        >
          <span style={{ color: meta.color }} className="flex-shrink-0">
            {meta.icon}
          </span>
          <span className="font-jetbrains text-[11px] text-[#c8d8f0]">{meta.label}</span>
        </button>
      ))}
    </motion.div>
  )
}
