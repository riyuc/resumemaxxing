import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, X } from 'lucide-react'

import type { EducationEntry } from '@/schemas/profile'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import PillBtn from '@/components/ui/pill-btn'

const EducationFormSchema = z.object({
  school: z.string(),
  location: z.string(),
  degree: z.string(),
  dates: z.string(),
  coursework: z.string(),
  rawText: z.string(),
})
type EducationFormValues = z.infer<typeof EducationFormSchema>

const inputCn =
  'bg-[#060e20] border-[#1e3a5f] rounded-lg p-3 h-auto text-xs text-porcelain placeholder:text-[#4a7090] focus-visible:border-payne-gray focus-visible:ring-0 font-jetbrains'
const labelCn = 'text-[10px] text-payne-gray tracking-widest uppercase font-jetbrains'

interface EducationFormProps {
  initial?: Partial<EducationEntry>
  onSave: (data: Omit<EducationEntry, 'id'>) => void
  onCancel: () => void
  onChange?: (draft: Omit<EducationEntry, 'id'>) => void
}

export function EducationForm({ initial, onSave, onCancel, onChange }: EducationFormProps) {
  const form = useForm<EducationFormValues>({
    resolver: zodResolver(EducationFormSchema),
    defaultValues: {
      school: initial?.school ?? '',
      location: initial?.location ?? '',
      degree: initial?.degree ?? '',
      dates: initial?.dates ?? '',
      coursework: initial?.coursework ?? '',
      rawText: initial?.rawText ?? '',
    },
  })

  // Notify parent on every keystroke for live preview
  useEffect(() => {
    const { unsubscribe } = form.watch((values) => {
      onChange?.(values as EducationFormValues)
    })
    return unsubscribe
  }, [form, onChange])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="school"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCn}>school</FormLabel>
                <FormControl>
                  <Input placeholder="Concordia University" {...field} className={inputCn} />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCn}>location</FormLabel>
                <FormControl>
                  <Input placeholder="Montreal, QC" {...field} className={inputCn} />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="degree"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCn}>degree</FormLabel>
                <FormControl>
                  <Input placeholder="B.Sc. Computer Science" {...field} className={inputCn} />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dates"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCn}>dates</FormLabel>
                <FormControl>
                  <Input placeholder="Sep 2022 – Dec 2026" {...field} className={inputCn} />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="coursework"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCn}>coursework</FormLabel>
              <FormControl>
                <Input placeholder="OS, Algorithms, AI..." {...field} className={inputCn} />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rawText"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCn}>
                // casual notes — clubs, what you learned, achievements
              </FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  rows={3}
                  placeholder="I was part of the robotics club and placed 2nd at the hackathon..."
                  className="w-full bg-[#060e20] border border-payne-gray/30 rounded-lg px-3 py-2.5 text-xs text-porcelain placeholder:text-[#4a7090] focus:outline-none focus:border-payne-gray resize-none font-jetbrains leading-relaxed"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-1">
          <PillBtn type="submit" variant="accent">
            <Check size={12} /> save
          </PillBtn>
          <PillBtn variant="ghost" onClick={onCancel}>
            <X size={12} /> cancel
          </PillBtn>
        </div>
      </form>
    </Form>
  )
}
