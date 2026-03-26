export type FreeBlockType = 'note' | 'link' | 'image'

export interface FreeBlock {
  id: string
  type: FreeBlockType
  x: number
  y: number
  // note
  content?: string
  // link
  url?: string
  linkTitle?: string
  linkDesc?: string
  // image
  src?: string
  caption?: string
}
