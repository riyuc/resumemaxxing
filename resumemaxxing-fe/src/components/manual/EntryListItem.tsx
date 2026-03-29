import { motion, AnimatePresence } from 'motion/react'
import EntryCard from '@/components/ui/entry-card'

interface EntryListItemProps {
  entryId: string
  expanded: boolean
  isEditing: boolean
  onToggle: () => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  summary: React.ReactNode
  editForm: React.ReactNode
  viewContent?: React.ReactNode
}

export function EntryListItem({
  entryId,
  expanded,
  isEditing,
  onToggle,
  onStartEdit,
  onCancelEdit,
  onDelete,
  summary,
  editForm,
  viewContent,
}: EntryListItemProps) {
  const handleEdit = () => {
    if (isEditing) {
      onCancelEdit()
    } else {
      onStartEdit()
    }
  }

  return (
    <div>
      <EntryCard
        expanded={expanded}
        onToggle={onToggle}
        isEditing={isEditing}
        onEdit={handleEdit}
        onDelete={onDelete}
      >
        {summary}
      </EntryCard>
      <AnimatePresence>
        {expanded && (
          <motion.div
            key={entryId + '-expanded'}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {isEditing ? (
              <div className="border border-payne-gray/30 border-t-0 rounded-b-xl p-4 bg-[#060e20]">
                {editForm}
              </div>
            ) : viewContent ? (
              <div className="border border-[#1a3050] border-t-0 rounded-b-xl px-4 pb-4 pt-3 bg-[#08132a] flex flex-col gap-2">
                {viewContent}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
