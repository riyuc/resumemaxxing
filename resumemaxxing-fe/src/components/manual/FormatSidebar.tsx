import { X } from 'lucide-react'
import { motion } from 'motion/react'
import { FormatSlider } from '@/components/ui/format-slider'
import { FONT_OPTIONS, DEFAULT_FORMAT } from '@/utils/profileExport'
import type { ResumeFormat } from '@/utils/profileExport'

interface FormatSidebarProps {
  format: ResumeFormat
  onFormatChange: (patch: Partial<ResumeFormat>) => void
  onReset: () => void
  onClose: () => void
}

export function FormatSidebar({ format, onFormatChange, onReset, onClose }: FormatSidebarProps) {
  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 272, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="shrink-0 border-l border-[#0d1a2e] bg-[#060e20] overflow-hidden flex flex-col"
      style={{ width: 272 }}
    >
      <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-5">
        {/* header */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-jetbrains text-payne-gray tracking-widest">
            // format
          </span>
          <button
            onClick={onClose}
            className="text-[#4a7090] hover:text-[#94a3b8] transition-colors cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>

        {/* typography */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] text-[#4a7090] font-jetbrains tracking-widest uppercase">
            typography
          </span>

          {/* font family */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-[#8aaac8] font-jetbrains">font</span>
            <select
              value={format.fontFamily}
              onChange={(e) => onFormatChange({ fontFamily: e.target.value })}
              className="w-full bg-[#08132a] border border-[#1a3050] text-[#c8d8f0] text-[11px] font-jetbrains rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none focus:border-payne-gray appearance-none"
            >
              {(['monospace', 'serif', 'sans-serif'] as const).map((cat) => (
                <optgroup key={cat} label={cat}>
                  {FONT_OPTIONS.filter((o) => o.category === cat).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <FormatSlider
            label="body size"
            value={format.fontSize}
            min={8}
            max={12}
            step={0.5}
            unit="pt"
            onChange={(v) => onFormatChange({ fontSize: v })}
          />
          <FormatSlider
            label="name size"
            value={format.nameSize}
            min={14}
            max={28}
            step={1}
            unit="pt"
            onChange={(v) => onFormatChange({ nameSize: v })}
          />
          <FormatSlider
            label="bullet size"
            value={format.bulletSize}
            min={7}
            max={11}
            step={0.5}
            unit="pt"
            onChange={(v) => onFormatChange({ bulletSize: v })}
          />
          <FormatSlider
            label="line height"
            value={format.lineHeight}
            min={1.1}
            max={1.8}
            step={0.05}
            unit=""
            onChange={(v) => onFormatChange({ lineHeight: v })}
          />
        </div>

        <div className="h-px bg-[#0d1a2e]" />

        {/* layout */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] text-[#4a7090] font-jetbrains tracking-widest uppercase">
            layout
          </span>
          <FormatSlider
            label="page margin"
            value={format.pageMargin}
            min={0.3}
            max={0.8}
            step={0.05}
            unit="in"
            onChange={(v) => onFormatChange({ pageMargin: v })}
          />
          <FormatSlider
            label="section gap"
            value={format.sectionSpacing}
            min={4}
            max={20}
            step={1}
            unit="px"
            onChange={(v) => onFormatChange({ sectionSpacing: v })}
          />
          <FormatSlider
            label="entry gap"
            value={format.entrySpacing}
            min={2}
            max={12}
            step={1}
            unit="px"
            onChange={(v) => onFormatChange({ entrySpacing: v })}
          />
        </div>

        <div className="h-px bg-[#0d1a2e]" />

        {/* reset */}
        <button
          onClick={onReset}
          className="text-[11px] font-jetbrains text-[#4a7090] hover:text-[#94a3b8] transition-colors cursor-pointer text-left"
        >
          // reset to defaults
        </button>
      </div>
    </motion.div>
  )
}
