import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, X } from 'lucide-react'

import type { ExperienceEntry } from '@/schemas/profile'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import PillBtn from '@/components/ui/pill-btn'
import EditableBullets from '@/components/ui/editable-bullets'

const ExperienceFormSchema = z.object({
  company:  z.string(),
  location: z.string(),
  role:     z.string(),
  dates:    z.string(),
  bullets:  z.array(z.string()),
  rawText:  z.string(),
})
type ExperienceFormValues = z.infer<typeof ExperienceFormSchema>

const inputCn = 'bg-[#060e20] border-[#1e3a5f] rounded-lg p-3 h-auto text-xs text-porcelain placeholder:text-[#4a7090] focus-visible:border-payne-gray focus-visible:ring-0 font-jetbrains'
const labelCn = 'text-[10px] text-payne-gray tracking-widest uppercase font-jetbrains'

interface ExperienceFormProps {
  initial?: Partial<ExperienceEntry>
  onSave: (data: Omit<ExperienceEntry, 'id'>) => void
  onCancel: () => void
  onChange?: (draft: Omit<ExperienceEntry, 'id'>) => void
}

export function ExperienceForm({ initial, onSave, onCancel, onChange }: ExperienceFormProps) {
  const form = useForm<ExperienceFormValues>({
    resolver: zodResolver(ExperienceFormSchema),
    defaultValues: {
      company:  initial?.company  ?? '',
      location: initial?.location ?? '',
      role:     initial?.role     ?? '',
      dates:    initial?.dates    ?? '',
      bullets:  initial?.bullets  ?? [],
      rawText:  initial?.rawText  ?? '',
    },
  })

  useEffect(() => {
    const { unsubscribe } = form.watch((values) => {
      onChange?.(values as ExperienceFormValues)
    })
    return unsubscribe
  }, [form, onChange])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="flex flex-col gap-3">

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="company" render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCn}>company</FormLabel>
              <FormControl>
                <Input placeholder="Shopify" {...field} className={inputCn} />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )} />

          <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCn}>location</FormLabel>
              <FormControl>
                <Input placeholder="Toronto, ON" {...field} className={inputCn} />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )} />

          <FormField control={form.control} name="role" render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCn}>role</FormLabel>
              <FormControl>
                <Input placeholder="Software Engineering Intern" {...field} className={inputCn} />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )} />

          <FormField control={form.control} name="dates" render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCn}>dates</FormLabel>
              <FormControl>
                <Input placeholder="May 2025 – Dec 2025" {...field} className={inputCn} />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )} />
        </div>

        {/* bullets: field.value is string[], field.onChange accepts string[] */}
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
            <FormLabel className={labelCn}>// casual notes — tech used, impact, what you shipped</FormLabel>
            <FormControl>
              <textarea
                {...field}
                rows={3}
                placeholder="I built a pipeline that reduced latency by 40%..."
                className="w-full bg-[#060e20] border border-payne-gray/30 rounded-lg px-3 py-2.5 text-xs text-porcelain placeholder:text-[#4a7090] focus:outline-none focus:border-payne-gray resize-none font-jetbrains leading-relaxed"
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
