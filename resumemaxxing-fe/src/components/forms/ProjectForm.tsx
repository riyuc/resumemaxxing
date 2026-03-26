import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, X } from 'lucide-react'

import type { ProjectEntry } from '@/schemas/profile'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import PillBtn from '@/components/ui/pill-btn'
import EditableBullets from '@/components/ui/editable-bullets'

const ProjectFormSchema = z.object({
  name:      z.string(),
  techStack: z.string(),
  dates:     z.string(),
  bullets:   z.array(z.string()),
  rawText:   z.string(),
})
type ProjectFormValues = z.infer<typeof ProjectFormSchema>

const inputCn = 'bg-[#060e20] border-[#1e3a5f] rounded-lg p-3 h-auto text-xs text-porcelain placeholder:text-[#4a7090] focus-visible:border-payne-gray focus-visible:ring-0 font-jetbrains'
const labelCn = 'text-[10px] text-payne-gray tracking-widest uppercase font-jetbrains'

interface ProjectFormProps {
  initial?: Partial<ProjectEntry>
  onSave: (data: Omit<ProjectEntry, 'id'>) => void
  onCancel: () => void
  onChange?: (draft: Omit<ProjectEntry, 'id'>) => void
}

export function ProjectForm({ initial, onSave, onCancel, onChange }: ProjectFormProps) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(ProjectFormSchema),
    defaultValues: {
      name:      initial?.name      ?? '',
      techStack: initial?.techStack ?? '',
      dates:     initial?.dates     ?? '',
      bullets:   initial?.bullets   ?? [],
      rawText:   initial?.rawText   ?? '',
    },
  })

  useEffect(() => {
    const { unsubscribe } = form.watch((values) => {
      onChange?.(values as ProjectFormValues)
    })
    return unsubscribe
  }, [form, onChange])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="flex flex-col gap-3">

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCn}>project name</FormLabel>
              <FormControl>
                <Input placeholder="AI Transcription Correction" {...field} className={inputCn} />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )} />

          <FormField control={form.control} name="dates" render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCn}>dates</FormLabel>
              <FormControl>
                <Input placeholder="Hackathon, 2025" {...field} className={inputCn} />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="techStack" render={({ field }) => (
          <FormItem>
            <FormLabel className={labelCn}>tech stack</FormLabel>
            <FormControl>
              <Input placeholder="Python, FastAPI, React..." {...field} className={inputCn} />
            </FormControl>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />

        <FormField control={form.control} name="bullets" render={({ field }) => (
          <FormItem>
            <FormControl>
              <EditableBullets bullets={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />

        <FormField control={form.control} name="rawText" render={({ field }) => (
          <FormItem>
            <FormLabel className={labelCn}>casual notes — what it does, how you built it, results</FormLabel>
            <FormControl>
              <textarea
                {...field}
                rows={3}
                placeholder="I built this to solve X problem, used Y approach..."
                className="w-full bg-[#060e20] border border-[#1e3a5f] rounded-lg p-3 text-xs text-porcelain placeholder:text-[#4a7090] focus:outline-none focus:border-payne-gray resize-none font-jetbrains leading-relaxed"
              />
            </FormControl>
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
