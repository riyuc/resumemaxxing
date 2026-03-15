import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import Anthropic from '@anthropic-ai/sdk'
import {
  PARSE_RESUME_SYSTEM_PROMPT,
  PROFILE_TO_RESUME_SYSTEM_PROMPT,
  TAILOR_RESUME_SYSTEM_PROMPT,
} from './prompts/prompts'
import { openapi, fromTypes } from '@elysiajs/openapi'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function callClaude(system: string, userContent: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system,
    messages: [{ role: 'user', content: userContent }],
  })
  const raw = (message.content[0] as { text: string }).text.trim()
  // Strip markdown code fences if the model wrapped the JSON anyway
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
}

export default new Elysia()
  .use(cors())
  .get('/', () => 'resumemaxxing api')
  .use(openapi())

  // Parse any resume format (LaTeX / PDF text / plain text) → ProfileData
  .post('/parse-resume', async ({ body }) => {
    const json = await callClaude(PARSE_RESUME_SYSTEM_PROMPT, body.text)
    return JSON.parse(json)
  }, {
    body: t.Object({ text: t.String() }),
  })

  // Full career profile + job description → curated, targeted resume
  .post('/generate-resume', async ({ body }) => {
    const userContent = `<profile>${JSON.stringify(body.profile)}</profile>\n\n<job_description>${body.jobDescription}</job_description>`
    const json = await callClaude(PROFILE_TO_RESUME_SYSTEM_PROMPT, userContent)
    return JSON.parse(json)
  }, {
    body: t.Object({
      profile: t.Any(),
      jobDescription: t.String(),
    }),
  })

  // Existing resume + job description → same resume with content tailored to the JD
  .post('/tailor-resume', async ({ body }) => {
    const userContent = `<resume>${JSON.stringify(body.resume)}</resume>\n\n<job_description>${body.jobDescription}</job_description>`
    const json = await callClaude(TAILOR_RESUME_SYSTEM_PROMPT, userContent)
    return JSON.parse(json)
  }, {
    body: t.Object({
      resume: t.Any(),
      jobDescription: t.String(),
    }),
  })