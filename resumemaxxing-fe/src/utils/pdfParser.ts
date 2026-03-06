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

/** Extract all text from a PDF file as a single string */
export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjs = await getPdfjs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
  const lines: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map(item => ('str' in item ? (item as { str: string }).str : ''))
      .join(' ')
    lines.push(pageText)
  }

  return lines.join('\n')
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

  // Build a rawText blob per section (users can clean it up themselves)
  const sectionTexts: Record<string, string> = {}
  for (let i = 0; i < sectionRanges.length; i++) {
    const { type, start } = sectionRanges[i]
    const end = sectionRanges[i + 1]?.start ?? allLines.length
    const body = allLines.slice(start + 1, end).join('\n').trim()
    sectionTexts[type] = body
  }

  // Create single catch-all entries for each detected section so the user
  // can see + edit the extracted text rather than getting nothing
  const education = sectionTexts.education
    ? [{
        id: crypto.randomUUID(),
        school: '', location: '', degree: '', dates: '', coursework: '',
        rawText: sectionTexts.education,
      }]
    : []

  const experience = sectionTexts.experience
    ? [{
        id: crypto.randomUUID(),
        company: '', location: '', role: '', dates: '', bullets: [],
        rawText: sectionTexts.experience,
      }]
    : []

  const projects = sectionTexts.projects
    ? [{
        id: crypto.randomUUID(),
        name: '', techStack: '', dates: '', bullets: [],
        rawText: sectionTexts.projects,
      }]
    : []

  // Skills: try to parse comma-separated or newline-separated items
  const skills = sectionTexts.skills
    ? [{
        id: crypto.randomUUID(),
        category: 'All Skills',
        technologies: sectionTexts.skills.replace(/\n/g, ', '),
      }]
    : []

  return { contact, education, experience, projects, skills }
}
