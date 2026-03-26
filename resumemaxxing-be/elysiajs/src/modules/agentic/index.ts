import { Elysia, t } from 'elysia'
import Anthropic from '@anthropic-ai/sdk'
import {
  PARSE_RESUME_SYSTEM_PROMPT,
  PROFILE_TO_RESUME_SYSTEM_PROMPT,
  TAILOR_RESUME_SYSTEM_PROMPT,
} from '../../utils/prompts/prompts'
import { callClaude } from '../../utils/claude/claude'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// with Elysia we have a few choices for creating controllers
// 1. Use the Elysia instance as the controller itself.
// 2. Have a controller that is decoupled (not related) to HTTP requests or Elysia.
// i'm going with the second approach to have the MVC

const agentic = new Elysia()
  .get('/', () => 'resumemaxxing api')

  // Parse any resume format (LaTeX / PDF text / plain text) → ProfileData
  .post('/parse-resume', async ({ body }) => {
    const json = await callClaude(
      PARSE_RESUME_SYSTEM_PROMPT, body.text, anthropic)
    return JSON.parse(json)
  }, {
    body: t.Object({ text: t.String() }),
  })

  // Full career profile + job description → curated, targeted resume
  .post('/generate-resume', async ({ body }) => {
    const userContent = `<profile>${JSON.stringify(body.profile)}</profile>\n\n<job_description>${body.jobDescription}</job_description>`
    const json = await callClaude(PROFILE_TO_RESUME_SYSTEM_PROMPT, userContent, anthropic)
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
    const json = await callClaude(TAILOR_RESUME_SYSTEM_PROMPT, userContent, anthropic)
    return JSON.parse(json)
  }, {
    body: t.Object({
      resume: t.Any(),
      jobDescription: t.String(),
    }),
  })

export default agentic;