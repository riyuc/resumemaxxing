import { useState } from 'react'
import { User, Pencil, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Field } from '@/components/ui/field'
import PillBtn from '@/components/ui/pill-btn'
import type { ProfileData } from '@/types/profile'

interface ContactPanelProps {
  contact: ProfileData['contact']
  onSave: (contact: ProfileData['contact']) => void
  onDraftChange?: (draft: ProfileData['contact'] | null) => void
}

export function ContactPanel({ contact, onSave, onDraftChange }: ContactPanelProps) {
  const [editingContact, setEditingContact] = useState(false)
  const [contactDraft, setContactDraft] = useState(contact)

  const updateDraft = (patch: Partial<ProfileData['contact']>) => {
    setContactDraft((p) => {
      const next = { ...p, ...patch }
      onDraftChange?.(next)
      return next
    })
  }

  const handleSave = () => {
    onSave(contactDraft)
    setEditingContact(false)
    onDraftChange?.(null)
  }

  const handleEdit = () => {
    setContactDraft(contact)
    setEditingContact(true)
    onDraftChange?.(contact)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-payne-gray text-xs tracking-widest">
          <User size={13} />
          <span className="text-[#c8d8f0] font-bold text-xs uppercase">Contact</span>
        </div>
        <div className="flex-1 h-px bg-[#1a3050]" />
        {!editingContact ? (
          <PillBtn variant="ghost" onClick={handleEdit}>
            <Pencil size={11} /> edit
          </PillBtn>
        ) : (
          <div className="flex gap-1.5">
            <PillBtn variant="accent" onClick={handleSave}>
              <Check size={11} /> save
            </PillBtn>
            <PillBtn
              variant="ghost"
              onClick={() => {
                setEditingContact(false)
                onDraftChange?.(null)
              }}
            >
              <X size={11} /> cancel
            </PillBtn>
          </div>
        )}
      </div>
      <div className="border border-[#1a3050] rounded-xl p-4 bg-[#08132a]">
        <AnimatePresence mode="wait">
          {editingContact ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-3"
            >
              <Field
                label="full name"
                value={contactDraft.name}
                onChange={(v) => updateDraft({ name: v })}
                placeholder="Your Name"
              />
              <Field
                label="phone"
                value={contactDraft.phone}
                onChange={(v) => updateDraft({ phone: v })}
                placeholder="+1 (555) 000-0000"
              />
              <Field
                label="email"
                value={contactDraft.email}
                onChange={(v) => updateDraft({ email: v })}
                placeholder="you@email.com"
              />
              <Field
                label="linkedin"
                value={contactDraft.linkedin}
                onChange={(v) => updateDraft({ linkedin: v })}
                placeholder="handle"
              />
              <Field
                label="github"
                value={contactDraft.github}
                onChange={(v) => updateDraft({ github: v })}
                placeholder="handle"
              />
              <Field
                label="portfolio"
                value={contactDraft.portfolio}
                onChange={(v) => updateDraft({ portfolio: v })}
                placeholder="https://..."
              />
            </motion.div>
          ) : (
            <motion.div
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {contact.name ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-bold text-porcelain">{contact.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#94a3b8]">
                    {contact.email && <span>{contact.email}</span>}
                    {contact.linkedin && <span>li/{contact.linkedin}</span>}
                    {contact.github && <span>gh/{contact.github}</span>}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#4a7090] italic">// no contact yet — click edit</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
