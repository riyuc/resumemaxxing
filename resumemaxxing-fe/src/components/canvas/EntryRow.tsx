import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export function EntryRow({
  title,
  sub,
  date,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  children,
}: {
  title: string
  sub: string
  date: string
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  children?: React.ReactNode
}) {
  return (
    <div className="border-b border-[#0d1a2e] last:border-b-0">
      <div
        className="flex items-start gap-2 px-3 py-2.5 group hover:bg-[#080f1e] cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0 py-0.5">
          <p className="font-jetbrains text-[11px] text-[#94a3b8] font-semibold leading-snug">
            {title || '—'}
          </p>
          <p className="font-jetbrains text-[10px] text-[#4a7090] leading-snug mt-0.5">
            {sub}
            {date && <span className="block text-[#3a6080] mt-0.5">{date}</span>}
          </p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="text-payne-gray hover:text-[#94a3b8] cursor-pointer"
          >
            <Pencil size={10} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="text-payne-gray hover:text-[#ef4444] cursor-pointer"
          >
            <Trash2 size={10} />
          </button>
        </div>
        {expanded ? (
          <ChevronUp size={10} className="text-[#2a4060] shrink-0" />
        ) : (
          <ChevronDown size={10} className="text-[#2a4060] shrink-0" />
        )}
      </div>
      <AnimatePresence>
        {expanded && children && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
