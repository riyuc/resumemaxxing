import { GripHorizontal, StickyNote, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FreeBlock } from '@/types/canvas'

export function NoteBlock({
  block,
  onUpdate,
  onDelete,
  onHeaderMouseDown,
  isDragging,
}: {
  block: FreeBlock
  onUpdate: (patch: Partial<FreeBlock>) => void
  onDelete: () => void
  onHeaderMouseDown: (e: React.MouseEvent) => void
  isDragging: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden border transition-shadow duration-200',
        isDragging
          ? 'border-[#c8a030] shadow-[0_8px_40px_rgba(0,0,0,0.6)]'
          : 'border-[#2a2010] shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
      )}
      style={{ width: 260 }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 select-none"
        style={{ background: '#1a1605', cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={onHeaderMouseDown}
      >
        <GripHorizontal size={12} className="text-[#5a4a10] flex-shrink-0" />
        <StickyNote size={12} style={{ color: '#e8c86e' }} />
        <span className="font-jetbrains text-[10px] font-bold tracking-widest flex-1 text-[#e8c86e]">
          NOTE
        </span>
        <button
          className="text-[#5a4a10] hover:text-[#ef4444] transition-colors cursor-pointer"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <X size={11} />
        </button>
      </div>
      <div style={{ background: '#100e02' }} onMouseDown={(e) => e.stopPropagation()}>
        <textarea
          value={block.content ?? ''}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="write anything..."
          rows={5}
          className="w-full bg-transparent px-3 py-2.5 text-[12px] text-[#d4b84a] placeholder:text-[#4a3a10] focus:outline-none resize-none font-jetbrains leading-relaxed"
        />
      </div>
    </div>
  )
}
