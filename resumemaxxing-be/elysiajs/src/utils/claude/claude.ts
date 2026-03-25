import Anthropic from "@anthropic-ai/sdk"

export async function callClaude(
    system: string, 
    userContent: string, 
    anthropic: Anthropic
): Promise<string> {
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