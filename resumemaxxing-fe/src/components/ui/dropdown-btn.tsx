import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from 'motion/react'
import PillBtn from "@/components/ui/pill-btn";
import { cn } from "@/lib/utils";

const DropdownBtn = ({ label, icon, children, align = 'right' }: {
    label: string; icon?: React.ReactNode; children: React.ReactNode; align?: 'left' | 'right';
  }) => {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
  
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, [])
  
    return (
      <div ref={ref} className="relative">
        <PillBtn variant="default" onClick={() => setOpen(o => !o)}>
          {icon}{label}{open ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
        </PillBtn>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className={cn(
                'absolute top-full mt-1.5 z-30 bg-[#08132a] border border-[#1a3050] rounded-xl overflow-hidden shadow-xl min-w-[140px]',
                align === 'right' ? 'right-0' : 'left-0',
              )}
              onClick={() => setOpen(false)}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
  
  const DropItem = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button onClick={onClick}
      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-[#94a3b8] hover:bg-[#0c1a38] hover:text-porcelain transition-colors cursor-pointer font-jetbrains text-left">
      {children}
    </button>
  )

export { DropdownBtn, DropItem }