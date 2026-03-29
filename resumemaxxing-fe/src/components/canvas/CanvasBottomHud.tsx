import { useState } from 'react'
import { Plus, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { SECTION_META, FREE_BLOCK_META } from '@/constants/profileCanvas'
import type { SectionType } from '@/types/profile'
import type { FreeBlockType } from '@/types/canvas'

interface CanvasBottomHudProps {
  zoom: number
  setZoom: React.Dispatch<React.SetStateAction<number>>
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  availableSections: SectionType[]
  onAddSection: (type: SectionType) => void
  onAddBlock: (type: FreeBlockType) => void
}

export function CanvasBottomHud({
  zoom,
  setZoom,
  setPan,
  availableSections,
  onAddSection,
  onAddBlock,
}: CanvasBottomHudProps) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="absolute bottom-5 right-5 z-30 flex flex-col items-end gap-3">
      {/* zoom controls */}
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
                  onClick={() => {
                    onAddSection(s)
                    setShowPicker(false)
                  }}
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
              ).map(([blockType, blockMeta]) => (
                <button
                  key={blockType}
                  onClick={() => {
                    onAddBlock(blockType)
                    setShowPicker(false)
                  }}
                  className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg hover:bg-[#0c1a38] transition-colors cursor-pointer"
                >
                  <span style={{ color: blockMeta.color }}>{blockMeta.icon}</span>
                  <div className="text-left">
                    <p className="font-jetbrains text-[11px] text-[#c8d8f0] font-semibold">
                      {blockMeta.label}
                    </p>
                    <p className="font-jetbrains text-[9px] text-[#4a7090]">
                      {blockMeta.description}
                    </p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
