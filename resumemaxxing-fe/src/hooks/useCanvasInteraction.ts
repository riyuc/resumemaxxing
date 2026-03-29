import { useState, useRef, useEffect } from 'react'
import { loadPositions } from '@/utils/profileStorage'
import { POSITIONS_KEY } from '@/constants/profileCanvas'
import type { SectionType } from '@/types/profile'
import type { FreeBlock } from '@/types/canvas'

export type PositionMap = Record<SectionType, { x: number; y: number }>

export function useCanvasInteraction(
  setFreeBlocks: React.Dispatch<React.SetStateAction<FreeBlock[]>>
) {
  const [pan, setPan] = useState({ x: 80, y: 80 })
  const [zoom, setZoom] = useState(1)
  const [positions, setPositions] = useState<PositionMap>(loadPositions)
  const [draggingCard, setDraggingCard] = useState<SectionType | null>(null)
  const [draggingBlock, setDraggingBlock] = useState<string | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<SectionType>>(new Set())
  const [contextMenu, setContextMenu] = useState<{
    screenX: number
    screenY: number
    canvasX: number
    canvasY: number
  } | null>(null)
  const [isPanning, setIsPanning] = useState(false)

  const canvasRef = useRef<HTMLDivElement>(null)
  const panDrag = useRef<{
    startX: number
    startY: number
    startPanX: number
    startPanY: number
  } | null>(null)
  const cardDrag = useRef<{
    type: SectionType
    startX: number
    startY: number
    cardX: number
    cardY: number
    moved: boolean
  } | null>(null)
  const blockDrag = useRef<{
    id: string
    startX: number
    startY: number
    blockX: number
    blockY: number
    moved: boolean
  } | null>(null)

  // persist positions
  useEffect(() => {
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions))
  }, [positions])

  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-card]')) return
    panDrag.current = { startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y }
    setIsPanning(true)
  }

  const onCanvasContextMenu = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-card]')) return
    e.preventDefault()
    const rect = canvasRef.current!.getBoundingClientRect()
    setContextMenu({
      screenX: e.clientX,
      screenY: e.clientY,
      canvasX: (e.clientX - rect.left - pan.x) / zoom,
      canvasY: (e.clientY - rect.top - pan.y) / zoom,
    })
  }

  const onCardHeaderMouseDown = (e: React.MouseEvent, type: SectionType) => {
    e.stopPropagation()
    cardDrag.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      cardX: positions[type].x,
      cardY: positions[type].y,
      moved: false,
    }
    setDraggingCard(type)
  }

  const onBlockHeaderMouseDown = (e: React.MouseEvent, block: FreeBlock) => {
    e.stopPropagation()
    blockDrag.current = {
      id: block.id,
      startX: e.clientX,
      startY: e.clientY,
      blockX: block.x,
      blockY: block.y,
      moved: false,
    }
    setDraggingBlock(block.id)
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (panDrag.current) {
        const dx = e.clientX - panDrag.current.startX
        const dy = e.clientY - panDrag.current.startY
        setPan({ x: panDrag.current.startPanX + dx, y: panDrag.current.startPanY + dy })
      }
      if (cardDrag.current) {
        const dx = (e.clientX - cardDrag.current.startX) / zoom
        const dy = (e.clientY - cardDrag.current.startY) / zoom
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) cardDrag.current.moved = true
        if (cardDrag.current.moved) {
          const type = cardDrag.current.type
          setPositions((prev) => ({
            ...prev,
            [type]: { x: cardDrag.current!.cardX + dx, y: cardDrag.current!.cardY + dy },
          }))
        }
      }
      if (blockDrag.current) {
        const dx = (e.clientX - blockDrag.current.startX) / zoom
        const dy = (e.clientY - blockDrag.current.startY) / zoom
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) blockDrag.current.moved = true
        if (blockDrag.current.moved) {
          const id = blockDrag.current.id
          setFreeBlocks((prev) =>
            prev.map((b) =>
              b.id === id
                ? { ...b, x: blockDrag.current!.blockX + dx, y: blockDrag.current!.blockY + dy }
                : b
            )
          )
        }
      }
    }
    const onUp = () => {
      if (cardDrag.current && !cardDrag.current.moved) {
        const type = cardDrag.current.type
        setExpandedCards((prev) => {
          const next = new Set(prev)
          if (next.has(type)) next.delete(type)
          else next.add(type)
          return next
        })
      }
      panDrag.current = null
      cardDrag.current = null
      blockDrag.current = null
      setDraggingCard(null)
      setDraggingBlock(null)
      setIsPanning(false)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [zoom, setFreeBlocks])

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.08 : 0.93
    const newZoom = Math.max(0.25, Math.min(2.5, zoom * factor))
    const rect = canvasRef.current!.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    setPan((p) => ({
      x: cx - (cx - p.x) * (newZoom / zoom),
      y: cy - (cy - p.y) * (newZoom / zoom),
    }))
    setZoom(newZoom)
  }

  return {
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
  }
}
