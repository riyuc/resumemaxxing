import { useForm } from 'react-hook-form'
import * as z from 'zod'

const AutoCreateResumeSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
})

const AutoCreatePage = () => {
  const handleSubmit = () => {
    console.log('submit form')
  }

  const form = useForm<z.infer<typeof AutoCreateResumeSchema>>({
    defaultValues: {
      title: '',
      description: '',
    },
  })
  return (
    <div className="">
      <form onSubmit={form.handleSubmit(handleSubmit)}></form>
    </div>
  )
}

export default AutoCreatePage
