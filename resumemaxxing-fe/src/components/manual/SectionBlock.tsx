import { Plus, X, Trash2, GraduationCap, Briefcase, Code2, Wrench } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import PillBtn from '@/components/ui/pill-btn'
import type { SectionType } from '@/types/profile'

const SECTION_META: Record<SectionType, { label: string; icon: React.ReactNode }> = {
  education: { label: 'EDUCATION', icon: <GraduationCap size={13} /> },
  experience: { label: 'EXPERIENCE', icon: <Briefcase size={13} /> },
  projects: { label: 'PROJECTS', icon: <Code2 size={13} /> },
  skills: { label: 'SKILLS', icon: <Wrench size={13} /> },
  research: { label: 'RESEARCH', icon: <GraduationCap size={13} /> },
  leadership: { label: 'LEADERSHIP', icon: <Briefcase size={13} /> },
  volunteering: { label: 'VOLUNTEERING', icon: <Briefcase size={13} /> },
  certifications: { label: 'CERTIFICATIONS', icon: <Wrench size={13} /> },
  awards: { label: 'AWARDS', icon: <Wrench size={13} /> },
}

interface SectionBlockProps {
  type: SectionType
  isAdding: boolean
  onToggleAdding: () => void
  onRemove: () => void
  addForm: React.ReactNode
  children: React.ReactNode
  isEmpty: boolean
}

export function SectionBlock({
  type,
  isAdding,
  onToggleAdding,
  onRemove,
  addForm,
  children,
  isEmpty,
}: SectionBlockProps) {
  const meta = SECTION_META[type]

  return (
    <motion.div
      key={type}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col gap-3"
    >
      {/* section header */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-payne-gray text-xs tracking-widest">
          {meta.icon}
          <span className="text-[#c8d8f0] font-bold text-xs">{meta.label}</span>
        </div>
        <div className="flex-1 h-px bg-[#1a3050]" />
        <div className="flex items-center gap-1.5">
          <PillBtn variant="default" onClick={onToggleAdding}>
            {isAdding ? <X size={11} /> : <Plus size={11} />}
            {isAdding ? 'cancel' : 'add'}
          </PillBtn>
          <PillBtn variant="danger" onClick={onRemove}>
            <Trash2 size={11} />
          </PillBtn>
        </div>
      </div>

      {/* add form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border border-payne-gray/30 rounded-xl p-4 bg-[#060e20] mb-2">
              {addForm}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* entries */}
      <div className="flex flex-col gap-2">
        {children}
        {type !== 'skills' && isEmpty && !isAdding && (
          <p className="text-xs text-[#4a7090] italic px-1">// no {type} entries — click [add]</p>
        )}
      </div>
    </motion.div>
  )
}
