import { useState } from 'react'
import { GripHorizontal, Link2, X, Pencil, Check, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Field } from '@/components/ui/field'
import PillBtn from '@/components/ui/pill-btn'
import type { FreeBlock } from '@/types/canvas'

export function LinkBlock({
  block, onUpdate, onDelete, onHeaderMouseDown, isDragging,
}: {
  block: FreeBlock
  onUpdate: (patch: Partial<FreeBlock>) => void
  onDelete: () => void
  onHeaderMouseDown: (e: React.MouseEvent) => void
  isDragging: boolean
}) {
  const [editing, setEditing] = useState(!block.url)

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden border transition-shadow duration-200',
        isDragging
          ? 'border-[#2060c8] shadow-[0_8px_40px_rgba(0,0,0,0.6)]'
          : 'border-[#102040] shadow-[0_4px_24px_rgba(0,0,0,0.4)]',
      )}
      style={{ width: 280 }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 select-none"
        style={{ background: '#060f1a', cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={onHeaderMouseDown}
      >
        <GripHorizontal size={12} className="text-[#1a3060] flex-shrink-0" />
        <Link2 size={12} style={{ color: '#6ea8e8' }} />
        <span className="font-jetbrains text-[10px] font-bold tracking-widest flex-1 text-[#6ea8e8]">LINK</span>
        {!editing && (
          <button
            className="text-[#1a3060] hover:text-[#6ea8e8] transition-colors cursor-pointer mr-1"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); setEditing(true) }}
          >
            <Pencil size={10} />
          </button>
        )}
        <button
          className="text-[#1a3060] hover:text-[#ef4444] transition-colors cursor-pointer"
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onDelete() }}
        >
          <X size={11} />
        </button>
      </div>

      <div style={{ background: '#04080f' }} onMouseDown={e => e.stopPropagation()}>
        {editing ? (
          <div className="flex flex-col gap-2 p-3">
            <Field label="url"         value={block.url       ?? ''} onChange={v => onUpdate({ url: v })}       placeholder="https://github.com/..." />
            <Field label="title"       value={block.linkTitle ?? ''} onChange={v => onUpdate({ linkTitle: v })} placeholder="My awesome project" />
            <Field label="description" value={block.linkDesc  ?? ''} onChange={v => onUpdate({ linkDesc: v })}  placeholder="what is this link?" />
            <div className="pt-1">
              <PillBtn variant="accent" onClick={() => setEditing(false)}><Check size={11} /> done</PillBtn>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1 px-3 py-2.5">
            {block.linkTitle && <p className="font-jetbrains text-[12px] text-[#c8daf0] font-semibold">{block.linkTitle}</p>}
            {block.linkDesc  && <p className="font-jetbrains text-[10px] text-[#4a7090] leading-relaxed">{block.linkDesc}</p>}
            {block.url && (
              <a
                href={block.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-jetbrains text-[10px] text-[#456ea8] hover:text-[#6ea8e8] transition-colors mt-0.5 truncate"
              >
                <ExternalLink size={9} className="flex-shrink-0" />
                {block.url}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
