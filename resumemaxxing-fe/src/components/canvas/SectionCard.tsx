import { motion, AnimatePresence } from 'motion/react'
import { Plus, X, Pencil, Trash2, GripHorizontal, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SECTION_META } from '@/constants/profileCanvas'
import { EntryRow } from './EntryRow'
import {
  EducationForm,
  ExperienceForm,
  ProjectForm,
  SkillsForm,
  CertificationForm,
  AwardForm,
} from './ProfileForms'
import type { ProfileData, SectionType, ExperienceEntry } from '@/types/profile'
import type { SaveHandlers } from '@/hooks/useProfileCrud'

interface SectionCardProps {
  type: SectionType
  profile: ProfileData
  position: { x: number; y: number }
  isDragging: boolean
  isExpanded: boolean
  isAdding: boolean
  editingEntry: { type: SectionType; id: string } | null
  expandedIds: Set<string>
  saveHandlers: SaveHandlers
  onHeaderMouseDown: (e: React.MouseEvent) => void
  onRemove: () => void
  onStartAdd: () => void
  onCancelAdd: () => void
  onStartEdit: (id: string) => void
  onCancelEdit: () => void
  onDeleteEntry: (id: string) => void
  onToggleExpand: (id: string) => void
}

export function SectionCard({
  type,
  profile,
  position,
  isDragging,
  isExpanded,
  isAdding,
  editingEntry,
  expandedIds,
  saveHandlers,
  onHeaderMouseDown,
  onRemove,
  onStartAdd,
  onCancelAdd,
  onStartEdit,
  onCancelEdit,
  onDeleteEntry,
  onToggleExpand,
}: SectionCardProps) {
  const meta = SECTION_META[type]
  const editingId = editingEntry?.id

  const entries = (profile[type] as Array<{ id: string }>) ?? []

  return (
    <motion.div
      data-card
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: 300,
        zIndex: isDragging ? 100 : 1,
      }}
    >
      <div
        className={cn(
          'rounded-xl overflow-hidden border transition-shadow duration-200',
          isDragging
            ? 'border-[#2a4870] shadow-[0_8px_40px_rgba(0,0,0,0.6)]'
            : 'border-[#1a3050] shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
        )}
      >
        {/* header */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 select-none"
          style={{
            background: '#0a1628',
            cursor: isDragging ? 'grabbing' : 'grab',
            borderBottom: isExpanded ? '1px solid #1a3050' : 'none',
          }}
          onMouseDown={onHeaderMouseDown}
        >
          <GripHorizontal size={12} className="text-[#2a4060] flex-shrink-0" />
          <span style={{ color: meta.color }} className="flex-shrink-0">
            {meta.icon}
          </span>
          <span
            className="font-jetbrains text-[10px] font-bold tracking-widest flex-1"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
          <span className="font-jetbrains text-[9px] text-[#2a4060]">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </span>
          {isExpanded ? (
            <ChevronUp size={11} className="text-[#456677]" />
          ) : (
            <ChevronDown size={11} className="text-[#456677]" />
          )}
          <button
            className="text-[#2a4060] hover:text-[#ef4444] transition-colors cursor-pointer ml-1"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          >
            <X size={11} />
          </button>
        </div>

        {/* body */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
              style={{ background: '#060e20' }}
            >
              <div className="flex flex-col gap-0" onMouseDown={(e) => e.stopPropagation()}>
                {/* skills */}
                {type === 'skills' &&
                  profile.skills.map((entry) => (
                    <div key={entry.id} className="border-b border-[#0d1a2e]">
                      {editingId === entry.id ? (
                        <div className="p-3">
                          <SkillsForm
                            initial={entry}
                            onSave={saveHandlers.skills}
                            onCancel={onCancelEdit}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between px-3 py-2 group hover:bg-[#080f1e]">
                          <div>
                            <p className="font-jetbrains text-[11px] text-[#94a3b8] font-semibold">
                              {entry.category || '—'}
                            </p>
                            <p className="font-jetbrains text-[10px] text-[#4a7090] mt-0.5 leading-relaxed">
                              {entry.technologies}
                            </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                onStartEdit(entry.id)
                              }}
                              className="text-[#456677] hover:text-[#94a3b8] cursor-pointer"
                            >
                              <Pencil size={10} />
                            </button>
                            <button
                              onClick={() => onDeleteEntry(entry.id)}
                              className="text-[#456677] hover:text-[#ef4444] cursor-pointer"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                {/* education */}
                {type === 'education' &&
                  profile.education.map((entry) => (
                    <EntryRow
                      key={entry.id}
                      title={entry.school}
                      sub={entry.degree}
                      date={entry.dates}
                      expanded={expandedIds.has(entry.id)}
                      onToggle={() => onToggleExpand(entry.id)}
                      onEdit={() => onStartEdit(entry.id)}
                      onDelete={() => onDeleteEntry(entry.id)}
                    >
                      {editingId === entry.id ? (
                        <div className="p-3 border-t border-[#0d1a2e]">
                          <EducationForm
                            initial={entry}
                            onSave={saveHandlers.education}
                            onCancel={onCancelEdit}
                          />
                        </div>
                      ) : (
                        entry.coursework && (
                          <p className="px-3 pb-2 font-jetbrains text-[10px] text-[#4a7090]">
                            coursework: {entry.coursework}
                          </p>
                        )
                      )}
                    </EntryRow>
                  ))}

                {/* experience / research / leadership / volunteering */}
                {(type === 'experience' ||
                  type === 'research' ||
                  type === 'leadership' ||
                  type === 'volunteering') &&
                  (profile[type] as ExperienceEntry[]).map((entry) => (
                    <EntryRow
                      key={entry.id}
                      title={entry.company}
                      sub={entry.role}
                      date={entry.dates}
                      expanded={expandedIds.has(entry.id)}
                      onToggle={() => onToggleExpand(entry.id)}
                      onEdit={() => onStartEdit(entry.id)}
                      onDelete={() => onDeleteEntry(entry.id)}
                    >
                      {editingId === entry.id ? (
                        <div className="p-3 border-t border-[#0d1a2e]">
                          <ExperienceForm
                            initial={entry}
                            onSave={saveHandlers[type] as (e: Omit<ExperienceEntry, 'id'>) => void}
                            onCancel={onCancelEdit}
                          />
                        </div>
                      ) : entry.bullets.length > 0 ? (
                        <ul className="px-3 pb-2 flex flex-col gap-0.5">
                          {entry.bullets.slice(0, 2).map((b, i) => (
                            <li
                              key={i}
                              className="font-jetbrains text-[10px] text-[#4a7090] flex gap-1.5"
                            >
                              <span className="text-[#456677] flex-shrink-0">◆</span>
                              {b}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </EntryRow>
                  ))}

                {/* projects */}
                {type === 'projects' &&
                  profile.projects.map((entry) => (
                    <EntryRow
                      key={entry.id}
                      title={entry.name}
                      sub={entry.techStack}
                      date={entry.dates}
                      expanded={expandedIds.has(entry.id)}
                      onToggle={() => onToggleExpand(entry.id)}
                      onEdit={() => onStartEdit(entry.id)}
                      onDelete={() => onDeleteEntry(entry.id)}
                    >
                      {editingId === entry.id ? (
                        <div className="p-3 border-t border-[#0d1a2e]">
                          <ProjectForm
                            initial={entry}
                            onSave={saveHandlers.projects}
                            onCancel={onCancelEdit}
                          />
                        </div>
                      ) : entry.bullets.length > 0 ? (
                        <ul className="px-3 pb-2 flex flex-col gap-0.5">
                          {entry.bullets.slice(0, 2).map((b, i) => (
                            <li
                              key={i}
                              className="font-jetbrains text-[10px] text-[#4a7090] flex gap-1.5"
                            >
                              <span className="text-[#456677] flex-shrink-0">◆</span>
                              {b}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </EntryRow>
                  ))}

                {/* certifications */}
                {type === 'certifications' &&
                  profile.certifications.map((entry) => (
                    <EntryRow
                      key={entry.id}
                      title={entry.title}
                      sub={entry.issuer}
                      date={entry.date}
                      expanded={expandedIds.has(entry.id)}
                      onToggle={() => onToggleExpand(entry.id)}
                      onEdit={() => onStartEdit(entry.id)}
                      onDelete={() => onDeleteEntry(entry.id)}
                    >
                      {editingId === entry.id && (
                        <div className="p-3 border-t border-[#0d1a2e]">
                          <CertificationForm
                            initial={entry}
                            onSave={saveHandlers.certifications}
                            onCancel={onCancelEdit}
                          />
                        </div>
                      )}
                    </EntryRow>
                  ))}

                {/* awards */}
                {type === 'awards' &&
                  profile.awards.map((entry) => (
                    <EntryRow
                      key={entry.id}
                      title={entry.title}
                      sub={entry.issuer}
                      date={entry.date}
                      expanded={expandedIds.has(entry.id)}
                      onToggle={() => onToggleExpand(entry.id)}
                      onEdit={() => onStartEdit(entry.id)}
                      onDelete={() => onDeleteEntry(entry.id)}
                    >
                      {editingId === entry.id && (
                        <div className="p-3 border-t border-[#0d1a2e]">
                          <AwardForm
                            initial={entry}
                            onSave={saveHandlers.awards}
                            onCancel={onCancelEdit}
                          />
                        </div>
                      )}
                    </EntryRow>
                  ))}

                {/* add form */}
                {isAdding && (
                  <div className="p-3 border-t border-[#0d1a2e]">
                    {type === 'education' && (
                      <EducationForm onSave={saveHandlers.education} onCancel={onCancelAdd} />
                    )}
                    {type === 'experience' && (
                      <ExperienceForm onSave={saveHandlers.experience} onCancel={onCancelAdd} />
                    )}
                    {type === 'projects' && (
                      <ProjectForm onSave={saveHandlers.projects} onCancel={onCancelAdd} />
                    )}
                    {type === 'skills' && (
                      <SkillsForm onSave={saveHandlers.skills} onCancel={onCancelAdd} />
                    )}
                    {type === 'research' && (
                      <ExperienceForm onSave={saveHandlers.research} onCancel={onCancelAdd} />
                    )}
                    {type === 'leadership' && (
                      <ExperienceForm onSave={saveHandlers.leadership} onCancel={onCancelAdd} />
                    )}
                    {type === 'volunteering' && (
                      <ExperienceForm onSave={saveHandlers.volunteering} onCancel={onCancelAdd} />
                    )}
                    {type === 'certifications' && (
                      <CertificationForm
                        onSave={saveHandlers.certifications}
                        onCancel={onCancelAdd}
                      />
                    )}
                    {type === 'awards' && (
                      <AwardForm onSave={saveHandlers.awards} onCancel={onCancelAdd} />
                    )}
                  </div>
                )}

                {/* add button */}
                {!isAdding && (
                  <button
                    className="w-full flex items-center gap-1.5 px-3 py-2 font-jetbrains text-[10px] text-[#2a4060] hover:text-[#456677] hover:bg-[#080f1e] transition-colors cursor-pointer border-t border-[#0d1a2e]"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={onStartAdd}
                  >
                    <Plus size={10} /> add entry
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
