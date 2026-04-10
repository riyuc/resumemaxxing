import { useRef } from 'react'
import { GripHorizontal, ImageIcon, X, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FreeBlock } from '@/types/canvas'

export function ImageBlock({
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
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onUpdate({ src: ev.target?.result as string })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden border transition-shadow duration-200',
        isDragging
          ? 'border-[#a030a0] shadow-[0_8px_40px_rgba(0,0,0,0.6)]'
          : 'border-[#2a1030] shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
      )}
      style={{ width: 300 }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 select-none"
        style={{ background: '#0e0614', cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={onHeaderMouseDown}
      >
        <GripHorizontal size={12} className="text-[#3a1050] shrink-0" />
        <ImageIcon size={12} style={{ color: '#c86ea8' }} />
        <span className="font-jetbrains text-[10px] font-bold tracking-widest flex-1 text-[#c86ea8]">
          IMAGE
        </span>
        {!block.src && (
          <button
            className="text-[#3a1050] hover:text-[#c86ea8] transition-colors cursor-pointer mr-1 font-jetbrains text-[9px]"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              fileRef.current?.click()
            }}
          >
            upload
          </button>
        )}
        {block.src && (
          <button
            className="text-[#3a1050] hover:text-[#c86ea8] transition-colors cursor-pointer mr-1"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onUpdate({ src: undefined })
            }}
          >
            <Trash2 size={10} />
          </button>
        )}
        <button
          className="text-[#3a1050] hover:text-[#ef4444] transition-colors cursor-pointer"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <X size={11} />
        </button>
      </div>

      <div style={{ background: '#080410' }} onMouseDown={(e) => e.stopPropagation()}>
        {block.src ? (
          <div className="flex flex-col">
            <img
              src={block.src}
              alt={block.caption || 'canvas image'}
              className="w-full object-contain max-h-64"
            />
            <input
              value={block.caption ?? ''}
              onChange={(e) => onUpdate({ caption: e.target.value })}
              placeholder="caption (optional)"
              className="w-full bg-transparent px-3 py-2 font-jetbrains text-[10px] text-[#8a5a88] placeholder:text-[#3a1050] focus:outline-none border-t border-[#1a0820]"
            />
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-2 py-8 cursor-pointer group"
            onClick={() => fileRef.current?.click()}
          >
            <ImageIcon
              size={28}
              className="text-[#2a1030] group-hover:text-[#5a2060] transition-colors"
            />
            <p className="font-jetbrains text-[10px] text-[#3a1050] group-hover:text-[#6a3070] transition-colors text-center px-4">
              click to upload or paste an image anywhere on the canvas
            </p>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  )
}
