import agentic from '../src/modules/agentic/index'
import { cors } from '@elysiajs/cors'
import { openapi } from '@elysiajs/openapi'

import { Elysia } from 'elysia'

const app = new Elysia()
    .use(openapi())
    .use(agentic)

export default app