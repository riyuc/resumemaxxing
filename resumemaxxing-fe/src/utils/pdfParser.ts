import type { ProfileData } from '@/types/profile'

// We load pdfjs lazily to avoid bundling the worker at startup
async function getPdfjs() {
  const pdfjs = await import('pdfjs-dist')
  // Use the bundled worker from the pdfjs-dist package
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()
  return pdfjs
}

/** Extract all text from a PDF file, preserving line structure */
export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjs = await getPdfjs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
  const allLines: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()

    // Group items by y-coordinate (PDF coords are bottom-up; round to a 3px grid
    // to merge items that are on the same visual line despite sub-pixel differences)
    const lineMap = new Map<number, string[]>()
    for (const item of content.items) {
      if (!('str' in item)) continue
      const { str, transform } = item as { str: string; transform: number[] }
      if (!str) continue
      const y = Math.round(transform[5] / 3) * 3
      if (!lineMap.has(y)) lineMap.set(y, [])
      lineMap.get(y)!.push(str)
    }

    // Sort descending (PDF y=0 is bottom of page, so larger y = higher on page)
    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a)
    for (const y of sortedYs) {
      const text = lineMap.get(y)!.join('').trim()
      if (text) allLines.push(text)
    }
  }

  return allLines.join('\n')
}

/** Very light heuristic: extract a name from the first line(s) of the PDF text */
function guessName(lines: string[]): string {
  // The name is almost always the first non-empty line
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length > 2 && trimmed.length < 60 && !/[@|{}\\]/.test(trimmed)) {
      return trimmed
    }
  }
  return ''
}

/** Parse raw PDF text into partial ProfileData (best-effort) */
export function parsePdfText(rawText: string): Partial<ProfileData> {
  const allLines = rawText.split(/\n/).map(l => l.trim()).filter(Boolean)

  // Name
  const name = guessName(allLines)

  // Email, phone, linkedin, github from first ~10 lines
  let email = '', phone = '', linkedin = '', github = '', portfolio = ''
  const contactBlock = allLines.slice(0, 10).join(' ')

  const emailMatch = contactBlock.match(/[\w.+-]+@[\w-]+\.\w+/)
  if (emailMatch) email = emailMatch[0]

  const phoneMatch = contactBlock.match(/\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)
  if (phoneMatch) phone = phoneMatch[0]

  const linkedinMatch = contactBlock.match(/linkedin\.com\/in\/([\w-]+)/i)
  if (linkedinMatch) linkedin = linkedinMatch[1]

  const githubMatch = contactBlock.match(/github\.com\/([\w-]+)/i)
  if (githubMatch) github = githubMatch[1]

  const portfolioMatch = contactBlock.match(/https?:\/\/[\w.-]+\.\w+(?:\/[\w./?=#%-]*)*/i)
  if (portfolioMatch && !portfolioMatch[0].includes('linkedin') && !portfolioMatch[0].includes('github')) {
    portfolio = portfolioMatch[0]
  }

  const contact = { name, phone, email, linkedin, github, portfolio }

  // Section header detection — very rough, returns the rest as rawText in each entry
  // This gives users something to work with rather than empty entries
  const SECTION_PATTERNS: Record<string, RegExp> = {
    education:  /^(education|academic)/i,
    experience: /^(experience|work experience|employment|professional)/i,
    projects:   /^(projects|personal projects|technical projects)/i,
    skills:     /^(skills|technical skills|technologies|languages)/i,
  }

  const sectionRanges: Array<{ type: string; start: number }> = []
  allLines.forEach((line, idx) => {
    for (const [type, pattern] of Object.entries(SECTION_PATTERNS)) {
      if (pattern.test(line) && line.length < 40) {
        sectionRanges.push({ type, start: idx })
        break
      }
    }
  })

  // Collect lines per section
  const sectionLines: Record<string, string[]> = {}
  for (let i = 0; i < sectionRanges.length; i++) {
    const { type, start } = sectionRanges[i]
    const end = sectionRanges[i + 1]?.start ?? allLines.length
    sectionLines[type] = allLines.slice(start + 1, end).filter(Boolean)
  }

  // Detect bullet lines (start with common bullet markers)
  const isBullet = (s: string) => /^[\u2022\u25cf\u25aa\-\*]/.test(s.trim())
  // Detect date-like strings — requires a range or year span
  const DATE_RE = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\b.{0,25}(\d{4}|Present|Current)\b/i
  const hasDate = (s: string) => DATE_RE.test(s)
  // Split a line like "Acme Corp   Jan 2022 – May 2023" into prefix + dates
  const splitDateLine = (s: string): { prefix: string; dates: string } => {
    const m = DATE_RE.exec(s)
    if (!m) return { prefix: s, dates: '' }
    return { prefix: s.slice(0, m.index).trim(), dates: m[0].trim() }
  }
  // Strip trailing "City, Province/State" location appended from same-row PDF merge
  const LOCATION_RE = /,?\s+([A-Za-z][a-zA-Z\s]+,\s*[A-Z]{2})$/
  const stripLocation = (s: string): { text: string; location: string } => {
    const m = LOCATION_RE.exec(s)
    if (!m) return { text: s, location: '' }
    return { text: s.slice(0, m.index).trim(), location: m[1].trim() }
  }

  // Parse education entries
  const education = (() => {
    const lines = sectionLines.education ?? []
    if (!lines.length) return []
    const entries: { id: string; school: string; location: string; degree: string; dates: string; coursework: string; rawText: string }[] = []
    let school = '', degree = '', location = '', dates = '', coursework = ''
    for (const line of lines) {
      if (/relevant coursework/i.test(line)) { coursework = line.replace(/relevant coursework[:\s]*/i, ''); continue }
      if (/^(b\.|m\.|ph\.?d|bachelor|master|doctor|b\.?sc|m\.?sc|b\.?eng|m\.?eng|b\.?a|m\.?a)/i.test(line)) { degree = line; continue }
      if (hasDate(line)) {
        const { prefix, dates: d } = splitDateLine(line)
        dates = d
        if (prefix && !school) { const { text, location: loc } = stripLocation(prefix); school = text; if (loc) location = loc }
        continue
      }
      if (!school) { const { text, location: loc } = stripLocation(line); school = text; if (loc) location = loc; continue }
      if (!location && line.length < 50) location = line
    }
    if (school || degree) entries.push({ id: crypto.randomUUID(), school, location, degree, dates, coursework, rawText: '' })
    return entries
  })()

  // Parse experience entries
  const experience = (() => {
    const lines = sectionLines.experience ?? []
    if (!lines.length) return []
    const entries: { id: string; company: string; location: string; role: string; dates: string; bullets: string[]; rawText: string }[] = []
    let company = '', role = '', location = '', dates = '', bullets: string[] = []
    const flush = () => {
      if (company || role) entries.push({ id: crypto.randomUUID(), company, location, role, dates, bullets, rawText: '' })
      company = ''; role = ''; location = ''; dates = ''; bullets = []
    }
    for (const line of lines) {
      // Bullet or lowercase continuation of previous bullet (wrapped line)
      if (isBullet(line)) {
        bullets.push(line.replace(/^[\u2022\u25cf\u25aa\-\*]\s*/, '').trim())
        continue
      }
      if (bullets.length > 0 && /^[a-z]/.test(line)) {
        bullets[bullets.length - 1] += ' ' + line
        continue
      }
      // Line containing a date range — may also have company prefix on the same line
      if (hasDate(line)) {
        const { prefix, dates: d } = splitDateLine(line)
        if (prefix && company) {
          // New company+date header → flush current entry and start fresh
          flush(); company = prefix; dates = d
        } else if (prefix) {
          company = prefix; dates = d
        } else {
          dates = d
        }
        continue
      }
      // Non-bullet, non-date line
      if (!company) { company = line; continue }
      if (!role) {
        // Strip trailing location merged from same PDF row (e.g. "Role Title    Toronto, ON")
        const { text, location: loc } = stripLocation(line)
        role = text; if (loc) location = loc
        continue
      }
      // Another header line after role is set → new entry
      flush(); company = line
    }
    flush()
    return entries
  })()

  // Parse projects
  const projects = (() => {
    const lines = sectionLines.projects ?? []
    if (!lines.length) return []
    const entries: { id: string; name: string; techStack: string; dates: string; bullets: string[]; rawText: string }[] = []
    let name = '', techStack = '', dates = '', bullets: string[] = []
    const flush = () => {
      if (name) entries.push({ id: crypto.randomUUID(), name, techStack, dates, bullets, rawText: '' })
      name = ''; techStack = ''; dates = ''; bullets = []
    }
    for (const line of lines) {
      if (isBullet(line)) { bullets.push(line.replace(/^[\u2022\u25cf\u25aa\-\*]\s*/, '').trim()); continue }
      if (bullets.length > 0 && /^[a-z]/.test(line)) { bullets[bullets.length - 1] += ' ' + line; continue }
      if (hasDate(line)) { const { prefix, dates: d } = splitDateLine(line); dates = d; if (prefix && !name) name = prefix; continue }
      // Pipe-separated "Name | Tech Stack"
      if (line.includes('|')) { if (name) flush(); const [n, t] = line.split('|'); name = n.trim(); techStack = t?.trim() ?? ''; continue }
      if (!name) { name = line; continue }
      if (!techStack && bullets.length === 0) { techStack = line; continue }
      flush(); name = line
    }
    flush()
    return entries
  })()

  // Skills: split into category rows
  const skills = (() => {
    const lines = sectionLines.skills ?? []
    if (!lines.length) return []
    return lines
      .filter(l => l.includes(':') || l.length > 3)
      .map(l => {
        const colonIdx = l.indexOf(':')
        if (colonIdx > 0 && colonIdx < 30) {
          return { id: crypto.randomUUID(), category: l.slice(0, colonIdx).trim(), technologies: l.slice(colonIdx + 1).trim() }
        }
        return { id: crypto.randomUUID(), category: 'Skills', technologies: l }
      })
  })()

  return { contact, education, experience, projects, skills }
}
