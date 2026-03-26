import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, X } from 'lucide-react'

import type { SkillsEntry } from '@/schemas/profile'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import PillBtn from '@/components/ui/pill-btn'

const SkillsFormSchema = z.object({
  category:     z.string(),
  technologies: z.string(),
})
type SkillsFormValues = z.infer<typeof SkillsFormSchema>

const inputCn = 'bg-[#060e20] border-[#1e3a5f] rounded-lg p-3 h-auto text-xs text-porcelain placeholder:text-[#4a7090] focus-visible:border-payne-gray focus-visible:ring-0 font-jetbrains'
const labelCn = 'text-[10px] text-payne-gray tracking-widest uppercase font-jetbrains'

interface SkillsFormProps {
  initial?: Partial<SkillsEntry>
  onSave: (data: Omit<SkillsEntry, 'id'>) => void
  onCancel: () => void
  onChange?: (draft: Omit<SkillsEntry, 'id'>) => void
}

export function SkillsForm({ initial, onSave, onCancel, onChange }: SkillsFormProps) {
  const form = useForm<SkillsFormValues>({
    resolver: zodResolver(SkillsFormSchema),
    defaultValues: {
      category:     initial?.category     ?? '',
      technologies: initial?.technologies ?? '',
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSave)}
        onChange={() => onChange?.(form.getValues())}
        className="flex flex-col gap-3"
      >
        <FormField control={form.control} name="category" render={({ field }) => (
          <FormItem>
            <FormLabel className={labelCn}>category</FormLabel>
            <FormControl>
              <Input placeholder="Languages, Frameworks..." {...field} className={inputCn} />
            </FormControl>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />

        <FormField control={form.control} name="technologies" render={({ field }) => (
          <FormItem>
            <FormLabel className={labelCn}>technologies</FormLabel>
            <FormControl>
              <Input placeholder="Python, TypeScript, Go..." {...field} className={inputCn} />
            </FormControl>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />

        <div className="flex gap-2 pt-1">
          <PillBtn type="submit" variant="accent"><Check size={12} /> save</PillBtn>
          <PillBtn variant="ghost" onClick={onCancel}><X size={12} /> cancel</PillBtn>
        </div>

      </form>
    </Form>
  )
}
