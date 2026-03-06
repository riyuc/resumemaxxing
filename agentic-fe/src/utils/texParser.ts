import type { ProfileData, EducationEntry, ExperienceEntry, ProjectEntry, SkillsEntry } from '@/types/profile'

function removeTexComments(tex: string): string {
  return tex
    .split('\n')
    .map(line => {
      const idx = line.search(/(?<!\\)%/)
      return idx >= 0 ? line.slice(0, idx) : line
    })
    .join('\n')
}

function extractNextBraceGroup(s: string, from: number): { content: string; end: number } | null {
  let i = from
  while (i < s.length && /[\s\n\r]/.test(s[i])) i++
  if (i >= s.length || s[i] !== '{') return null

  let depth = 0
  let content = ''

  for (; i < s.length; i++) {
    if (s[i] === '{') {
      depth++
      if (depth === 1) continue
    } else if (s[i] === '}') {
      depth--
      if (depth === 0) return { content, end: i + 1 }
    }
    if (depth > 0) content += s[i]
  }

  return null
}

function extractNArgs(s: string, from: number, n: number): { args: string[]; end: number } {
  const args: string[] = []
  let pos = from
  for (let i = 0; i < n; i++) {
    const result = extractNextBraceGroup(s, pos)
    if (!result) break
    args.push(result.content)
    pos = result.end
  }
  return { args, end: pos }
}

function stripLatex(text: string): string {
  return text
    .replace(/\\textbf\{([^{}]*)\}/g, '$1')
    .replace(/\\textit\{([^{}]*)\}/g, '$1')
    .replace(/\\emph\{([^{}]*)\}/g, '$1')
    .replace(/\\normalfont\s*/g, '')
    .replace(/\\small\s*/g, '')
    .replace(/\\Huge\s*/g, '')
    .replace(/\\scshape\s*/g, '')
    .replace(/\$\s*\|\s*\$/g, '|')
    .replace(/\$[^$]*\$/g, '')
    .replace(/\\href\{[^}]+\}\{\\underline\{([^}]+)\}\}/g, '$1')
    .replace(/\\href\{[^}]+\}\{([^}]+)\}/g, '$1')
    .replace(/\\underline\{([^}]+)\}/g, '$1')
    .replace(/\\%/g, '%')
    .replace(/\\&/g, '&')
    .replace(/\\~/g, ' ')
    .replace(/--/g, '–')
    .replace(/\\\\/g, '')
    .replace(/\{([^{}]*)\}/g, '$1')
    .replace(/\\[a-zA-Z]+\*?\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractBullets(content: string): string[] {
  const bullets: string[] = []
  const cmd = '\\resumeItem'
  let searchFrom = 0

  while (true) {
    const cmdIdx = content.indexOf(cmd, searchFrom)
    if (cmdIdx === -1) break

    const afterCmd = cmdIdx + cmd.length
    let checkIdx = afterCmd
    while (checkIdx < content.length && /\s/.test(content[checkIdx])) checkIdx++

    if (content[checkIdx] !== '{') {
      searchFrom = cmdIdx + 1
      continue
    }

    const result = extractNextBraceGroup(content, afterCmd)
    if (!result) { searchFrom = cmdIdx + 1; continue }

    const text = stripLatex(result.content)
    if (text) bullets.push(text)

    searchFrom = result.end
  }

  return bullets
}

function parseEducation(content: string): EducationEntry[] {
  const entries: EducationEntry[] = []
  const cmd = '\\resumeSubheading'
  let searchFrom = 0

  while (true) {
    const cmdIdx = content.indexOf(cmd, searchFrom)
    if (cmdIdx === -1) break

    const { args, end } = extractNArgs(content, cmdIdx + cmd.length, 4)
    if (args.length < 4) { searchFrom = cmdIdx + 1; continue }

    const [school, location, degree, dates] = args.map(stripLatex)

    const nextCmdIdx = content.indexOf(cmd, end)
    const entryContent = content.slice(end, nextCmdIdx >= 0 ? nextCmdIdx : undefined)

    let coursework = ''
    const subItemCmd = '\\resumeSubItem'
    const subItemIdx = entryContent.indexOf(subItemCmd)
    if (subItemIdx >= 0) {
      const subItemResult = extractNextBraceGroup(entryContent, subItemIdx + subItemCmd.length)
      if (subItemResult) coursework = stripLatex(subItemResult.content)
    }

    entries.push({ id: crypto.randomUUID(), school, location, degree, dates, coursework, rawText: '' })
    searchFrom = nextCmdIdx >= 0 ? nextCmdIdx : content.length
  }

  return entries
}

function parseExperience(content: string): ExperienceEntry[] {
  const entries: ExperienceEntry[] = []
  const cmd = '\\resumeSubheading'
  let searchFrom = 0

  while (true) {
    const cmdIdx = content.indexOf(cmd, searchFrom)
    if (cmdIdx === -1) break

    const { args, end } = extractNArgs(content, cmdIdx + cmd.length, 4)
    if (args.length < 4) { searchFrom = cmdIdx + 1; continue }

    const [company, dates, role, location] = args.map(stripLatex)

    const nextCmdIdx = content.indexOf(cmd, end)
    const entryContent = content.slice(end, nextCmdIdx >= 0 ? nextCmdIdx : undefined)
    const bullets = extractBullets(entryContent)

    entries.push({ id: crypto.randomUUID(), company, location, role, dates, bullets, rawText: '' })
    searchFrom = nextCmdIdx >= 0 ? nextCmdIdx : content.length
  }

  return entries
}

function parseProjects(content: string): ProjectEntry[] {
  const entries: ProjectEntry[] = []
  const cmd = '\\resumeProjectHeading'
  let searchFrom = 0

  while (true) {
    const cmdIdx = content.indexOf(cmd, searchFrom)
    if (cmdIdx === -1) break

    const { args, end } = extractNArgs(content, cmdIdx + cmd.length, 2)
    if (args.length < 1) { searchFrom = cmdIdx + 1; continue }

    const header = args[0]
    const dates = stripLatex(args[1] || '')

    let name = ''
    let techStack = ''
    const cleanHeader = stripLatex(header)
    const pipeIdx = cleanHeader.indexOf('|')
    if (pipeIdx >= 0) {
      name = cleanHeader.slice(0, pipeIdx).trim()
      techStack = cleanHeader.slice(pipeIdx + 1).trim()
    } else {
      name = cleanHeader
    }

    const nextCmdIdx = content.indexOf(cmd, end)
    const entryContent = content.slice(end, nextCmdIdx >= 0 ? nextCmdIdx : undefined)
    const bullets = extractBullets(entryContent)

    entries.push({ id: crypto.randomUUID(), name, techStack, dates, bullets, rawText: '' })
    searchFrom = nextCmdIdx >= 0 ? nextCmdIdx : content.length
  }

  return entries
}

function parseSkills(content: string): SkillsEntry[] {
  const entries: SkillsEntry[] = []
  const skillRegex = /\\textbf\{([^}]+)\}(?:\{([^}]*)\}|[ \t]+([^\\\n{]+))/g
  let match

  while ((match = skillRegex.exec(content)) !== null) {
    const category = match[1].replace(/:$/, '').replace(/\\&/g, '&').trim()
    const technologies = (match[2] || match[3] || '').replace(/\\&/g, '&').trim()
    if (category && technologies) {
      entries.push({ id: crypto.randomUUID(), category, technologies })
    }
  }

  return entries
}

export function parseTexResume(tex: string): ProfileData {
  const cleaned = removeTexComments(tex)

  const result: ProfileData = {
    contact: { name: '', phone: '', email: '', linkedin: '', github: '', portfolio: '' },
    education: [],
    experience: [],
    projects: [],
    skills: [],
  }

  const nameMatch = cleaned.match(/\\textbf\{\\Huge\s+\\scshape\s+([^}]+)\}/)
  if (nameMatch) result.contact.name = nameMatch[1].trim()

  const phoneMatch = cleaned.match(/\\small\s+([+\d\s()\-]+)\s*\$\s*\|\s*\$/)
  if (phoneMatch) result.contact.phone = phoneMatch[1].trim()

  const emailMatch = cleaned.match(/\\href\{mailto:([^}]+)\}/)
  if (emailMatch) result.contact.email = emailMatch[1].trim()

  const linkedinMatch = cleaned.match(/\\href\{https?:\/\/linkedin\.com\/in\/([^}]+)\}/)
  if (linkedinMatch) result.contact.linkedin = linkedinMatch[1].trim()

  const githubMatch = cleaned.match(/\\href\{https?:\/\/github\.com\/([^}]+)\}/)
  if (githubMatch) result.contact.github = githubMatch[1].trim()

  const hrefRegex = /\\href\{(https?:\/\/[^}]+)\}/g
  let hrefMatch
  while ((hrefMatch = hrefRegex.exec(cleaned)) !== null) {
    const url = hrefMatch[1]
    if (!url.includes('linkedin') && !url.includes('github')) {
      result.contact.portfolio = url
    }
  }

  const parts = cleaned.split(/\\section\{([^}]+)\}/)
  for (let i = 1; i < parts.length; i += 2) {
    const sectionName = parts[i].toLowerCase().trim()
    const sectionContent = parts[i + 1] || ''

    if (sectionName === 'education') {
      result.education = parseEducation(sectionContent)
    } else if (sectionName === 'experience') {
      result.experience = parseExperience(sectionContent)
    } else if (sectionName === 'projects') {
      result.projects = parseProjects(sectionContent)
    } else if (sectionName === 'technical skills') {
      result.skills = parseSkills(sectionContent)
    }
  }

  return result
}
