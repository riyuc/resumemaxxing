import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { loadProfile, loadSections, loadFreeBlocks, sectionsFromData } from '@/utils/profileStorage'
import { STORAGE_KEY, SECTIONS_KEY, BLOCKS_KEY, ALL_SECTION_TYPES } from '@/constants/profileCanvas'
import type { ProfileData, SectionType } from '@/types/profile'
import type { FreeBlock, FreeBlockType } from '@/types/canvas'
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction'
import { useProfileCrud } from '@/hooks/useProfileCrud'
import { useImportExport } from '@/hooks/useImportExport'
import { SectionCard } from '@/components/canvas/SectionCard'
import { CanvasTopHud } from '@/components/canvas/CanvasTopHud'
import { CanvasBottomHud } from '@/components/canvas/CanvasBottomHud'
import { CanvasContextMenu } from '@/components/canvas/CanvasContextMenu'
import { NoteBlock } from '@/components/canvas/NoteBlock'
import { LinkBlock } from '@/components/canvas/LinkBlock'
import { ImageBlock } from '@/components/canvas/ImageBlock'

export default function ProfilePage() {
  // ── core data ──
  const [profile, setProfile] = useState<ProfileData>(loadProfile)
  const [sections, setSections] = useState<SectionType[]>(() => {
    const stored = loadSections()
    return stored.length ? stored : sectionsFromData(loadProfile())
  })
  const [freeBlocks, setFreeBlocks] = useState<FreeBlock[]>(loadFreeBlocks)

  // ── hooks ──
  const {
    pan,
    setPan,
    zoom,
    setZoom,
    positions,
    setPositions,
    draggingCard,
    draggingBlock,
    isPanning,
    expandedCards,
    setExpandedCards,
    contextMenu,
    setContextMenu,
    canvasRef,
    onCanvasMouseDown,
    onCanvasContextMenu,
    onCardHeaderMouseDown,
    onBlockHeaderMouseDown,
    onWheel,
  } = useCanvasInteraction(setFreeBlocks)

  const {
    addingIn,
    setAddingIn,
    editingEntry,
    setEditingEntry,
    expandedIds,
    toggleEntryExpand,
    deleteEntry,
    removeSection,
    saveHandlers,
  } = useProfileCrud(setProfile, setSections)

  const {
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
  } = useImportExport(
    profile,
    sections,
    positions,
    freeBlocks,
    setProfile,
    setSections,
    setPositions,
    setFreeBlocks
  )

  // ── persist ──
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }, [profile])
  useEffect(() => {
    localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections))
  }, [sections])
  useEffect(() => {
    localStorage.setItem(BLOCKS_KEY, JSON.stringify(freeBlocks))
  }, [freeBlocks])

  // ── clipboard paste for images ──
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (!file) continue
          const reader = new FileReader()
          reader.onload = (ev) => {
            const src = ev.target?.result as string
            const rect = canvasRef.current?.getBoundingClientRect()
            const cx = rect ? (rect.width / 2 - pan.x) / zoom : 200
            const cy = rect ? (rect.height / 2 - pan.y) / zoom : 200
            setFreeBlocks((prev) => [
              ...prev,
              { id: crypto.randomUUID(), type: 'image', x: cx, y: cy, src },
            ])
          }
          reader.readAsDataURL(file)
          break
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [pan, zoom, canvasRef])

  // ── section management ──
  const addSection = (type: SectionType, at?: { x: number; y: number }) => {
    if (!sections.includes(type)) {
      setSections((prev) => [...prev, type])
      if (at) setPositions((prev) => ({ ...prev, [type]: at }))
    }
    setExpandedCards((prev) => new Set(prev).add(type))
    setAddingIn(type)
  }

  const addFreeBlock = (type: FreeBlockType, at?: { x: number; y: number }) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    const cx = at?.x ?? (rect ? (rect.width / 2 - pan.x) / zoom : 200)
    const cy = at?.y ?? (rect ? (rect.height / 2 - pan.y) / zoom : 200)
    const base = { id: crypto.randomUUID(), type, x: cx, y: cy }
    const block: FreeBlock =
      type === 'note'
        ? { ...base, content: '' }
        : type === 'link'
          ? { ...base, url: '', linkTitle: '', linkDesc: '' }
          : { ...base }
    setFreeBlocks((prev) => [...prev, block])
  }

  const updateFreeBlock = (id: string, patch: Partial<FreeBlock>) =>
    setFreeBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))

  const deleteFreeBlock = (id: string) => setFreeBlocks((prev) => prev.filter((b) => b.id !== id))

  // ── derived ──
  const availableSections = ALL_SECTION_TYPES.filter((s) => !sections.includes(s))
  const dotSize = Math.max(24 * zoom, 8)
  const dotStyle: React.CSSProperties = {
    backgroundImage: `radial-gradient(circle, rgba(26,48,80,0.9) 1px, transparent 1px)`,
    backgroundSize: `${dotSize}px ${dotSize}px`,
    backgroundPosition: `${pan.x % dotSize}px ${pan.y % dotSize}px`,
  }

  return (
    <div
      className="relative w-full overflow-hidden bg-[#030b18]"
      style={{ height: 'calc(100vh - 56px)' }}
    >
      {/* dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={dotStyle} />

      {/* top HUD */}
      <CanvasTopHud
        importStatus={importStatus}
        pdfImporting={pdfImporting}
        fileRef={fileRef}
        pdfFileRef={pdfFileRef}
        jsonFileRef={jsonFileRef}
        onPdfImport={handlePdfImport}
        onTexImport={handleTexImport}
        onJsonImport={handleJsonImport}
        onExportTex={handleExportTex}
        onExportMd={handleExportMd}
        onExportJson={handleExportJson}
      />

      {/* canvas */}
      <div
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={onCanvasMouseDown}
        onWheel={onWheel}
        onContextMenu={onCanvasContextMenu}
      >
        <div
          style={{
            position: 'absolute',
            transformOrigin: '0 0',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            willChange: 'transform',
          }}
        >
          {/* section cards */}
          {sections.map((type) => (
            <SectionCard
              key={type}
              type={type}
              profile={profile}
              position={positions[type]}
              isDragging={draggingCard === type}
              isExpanded={expandedCards.has(type)}
              isAdding={addingIn === type}
              editingEntry={editingEntry}
              expandedIds={expandedIds}
              saveHandlers={saveHandlers}
              onHeaderMouseDown={(e) => onCardHeaderMouseDown(e, type)}
              onRemove={() => removeSection(type)}
              onStartAdd={() => {
                setAddingIn(type)
                setEditingEntry(null)
              }}
              onCancelAdd={() => setAddingIn(null)}
              onStartEdit={(id) => {
                setEditingEntry({ type, id })
                setAddingIn(null)
              }}
              onCancelEdit={() => setEditingEntry(null)}
              onDeleteEntry={(id) => deleteEntry(type, id)}
              onToggleExpand={toggleEntryExpand}
            />
          ))}

          {/* free blocks */}
          {freeBlocks.map((block) => (
            <motion.div
              key={block.id}
              data-card
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                position: 'absolute',
                left: block.x,
                top: block.y,
                zIndex: draggingBlock === block.id ? 100 : 2,
              }}
            >
              {block.type === 'note' && (
                <NoteBlock
                  block={block}
                  onUpdate={(p) => updateFreeBlock(block.id, p)}
                  onDelete={() => deleteFreeBlock(block.id)}
                  onHeaderMouseDown={(e) => onBlockHeaderMouseDown(e, block)}
                  isDragging={draggingBlock === block.id}
                />
              )}
              {block.type === 'link' && (
                <LinkBlock
                  block={block}
                  onUpdate={(p) => updateFreeBlock(block.id, p)}
                  onDelete={() => deleteFreeBlock(block.id)}
                  onHeaderMouseDown={(e) => onBlockHeaderMouseDown(e, block)}
                  isDragging={draggingBlock === block.id}
                />
              )}
              {block.type === 'image' && (
                <ImageBlock
                  block={block}
                  onUpdate={(p) => updateFreeBlock(block.id, p)}
                  onDelete={() => deleteFreeBlock(block.id)}
                  onHeaderMouseDown={(e) => onBlockHeaderMouseDown(e, block)}
                  isDragging={draggingBlock === block.id}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* bottom HUD */}
      <CanvasBottomHud
        zoom={zoom}
        setZoom={setZoom}
        setPan={setPan}
        availableSections={availableSections}
        onAddSection={addSection}
        onAddBlock={addFreeBlock}
      />

      {/* context menu */}
      <AnimatePresence>
        {contextMenu && (
          <CanvasContextMenu
            screenX={contextMenu.screenX}
            screenY={contextMenu.screenY}
            availableSections={availableSections}
            onAddSection={(type) =>
              addSection(type, { x: contextMenu.canvasX, y: contextMenu.canvasY })
            }
            onAddBlock={(type) =>
              addFreeBlock(type, { x: contextMenu.canvasX, y: contextMenu.canvasY })
            }
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
