import type { ProfileData, SectionType } from '@/types/profile'

// ─── Resume formatting ────────────────────────────────────────────────────────

export type FontOption = {
  label: string
  value: string // CSS font-family string
  googleFont?: string // Google Fonts URL param (family + variants)
  customLink?: string // Full href for non-Google-Fonts stylesheets
  category: 'monospace' | 'serif' | 'sans-serif'
}

export const FONT_OPTIONS: FontOption[] = [
  // ── Monospace (common in TeX resumes) ──────────────────────────────────────
  {
    label: 'Source Code Pro',
    value: "'Source Code Pro', monospace",
    googleFont: 'Source+Code+Pro:ital,wght@0,400;0,600;0,700;1,400',
    category: 'monospace',
  },
  {
    label: 'JetBrains Mono',
    value: "'JetBrains Mono', monospace",
    googleFont: 'JetBrains+Mono:ital,wght@0,400;0,600;0,700;1,400',
    category: 'monospace',
  },
  {
    label: 'Fira Code',
    value: "'Fira Code', monospace",
    googleFont: 'Fira+Code:wght@400;600;700',
    category: 'monospace',
  },
  {
    label: 'Roboto Mono',
    value: "'Roboto Mono', monospace",
    googleFont: 'Roboto+Mono:ital,wght@0,400;0,600;0,700;1,400',
    category: 'monospace',
  },
  { label: 'Courier New', value: "'Courier New', monospace", category: 'monospace' },

  // ── Serif (classic TeX / academic look) ────────────────────────────────────
  // Computer Modern fonts — exact family names as declared in the CDN CSS
  // CMU Serif = default LaTeX font (no font package in preamble)
  {
    label: 'Computer Modern (default LaTeX)',
    value: "'Computer Modern Serif', serif",
    customLink: 'https://cdn.jsdelivr.net/gh/dreampulse/computer-modern-web-font@master/fonts.css',
    category: 'serif',
  },
  // CMU Sans ≈ \usepackage{lmodern} + \renewcommand*\familydefault{\sfdefault}
  {
    label: 'Computer Modern Sans (lmodern + sfdefault)',
    value: "'Computer Modern Sans', sans-serif",
    customLink: 'https://cdn.jsdelivr.net/gh/dreampulse/computer-modern-web-font@master/fonts.css',
    category: 'sans-serif',
  },
  // CMU Typewriter ≈ \ttdefault in TeX
  {
    label: 'Computer Modern Typewriter',
    value: "'Computer Modern Typewriter', monospace",
    customLink: 'https://cdn.jsdelivr.net/gh/dreampulse/computer-modern-web-font@master/fonts.css',
    category: 'monospace',
  },
  {
    label: 'EB Garamond',
    value: "'EB Garamond', serif",
    googleFont: 'EB+Garamond:ital,wght@0,400;0,600;0,700;1,400',
    category: 'serif',
  },
  {
    label: 'Libre Baskerville',
    value: "'Libre Baskerville', serif",
    googleFont: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400',
    category: 'serif',
  },
  {
    label: 'Crimson Text',
    value: "'Crimson Text', serif",
    googleFont: 'Crimson+Text:ital,wght@0,400;0,600;1,400',
    category: 'serif',
  },
  { label: 'Palatino Linotype', value: "'Palatino Linotype', Palatino, serif", category: 'serif' },
  { label: 'Georgia', value: 'Georgia, serif', category: 'serif' },

  // ── Sans-serif ─────────────────────────────────────────────────────────────
  {
    label: 'Inter',
    value: "'Inter', sans-serif",
    googleFont: 'Inter:wght@400;600;700',
    category: 'sans-serif',
  },
  {
    label: 'Lato',
    value: "'Lato', sans-serif",
    googleFont: 'Lato:ital,wght@0,400;0,700;1,400',
    category: 'sans-serif',
  },
  {
    label: 'Raleway',
    value: "'Raleway', sans-serif",
    googleFont: 'Raleway:ital,wght@0,400;0,600;0,700;1,400',
    category: 'sans-serif',
  },
]

export type ResumeFormat = {
  fontFamily: string // CSS font-family value
  fontSize: number // body font size in pt
  lineHeight: number // line height multiplier
  pageMargin: number // page padding in inches
  sectionSpacing: number // margin-bottom between sections (px)
  entrySpacing: number // margin-bottom between entries (px)
  nameSize: number // name heading font size in pt
  bulletSize: number // bullet list item font size in pt
}

// LaTeX 11pt document class size scale (used to derive sub-sizes accurately):
//   \small = 10pt, \large = 12pt, \Large = 14.4pt, \huge = 20.74pt, \Huge = 24.88pt
export const DEFAULT_FORMAT: ResumeFormat = {
  fontFamily: "'Computer Modern Serif', serif",
  fontSize: 11, // \documentclass[letterpaper,11pt]{article}
  lineHeight: 1.35,
  pageMargin: 0.5, // ~0.5in all sides (after margin adjustments in preamble)
  sectionSpacing: 10,
  entrySpacing: 4,
  nameSize: 25, // \Huge at 11pt class = 24.88pt
  bulletSize: 10, // \small at 11pt class = 10pt (used for role, location, bullets, skills)
}

export type ExportSelection = {
  education: string[]
  experience: string[]
  projects: string[]
  skills: string[]
}

function escapeTex(text: string): string {
  return text.replace(/%/g, '\\%').replace(/&/g, '\\&')
}

const TEX_PREAMBLE = String.raw`\documentclass[letterpaper,11pt]{article}

% Source Code Pro — clean monospace similar to JetBrains Mono, works with pdflatex
\usepackage[default]{sourcecodepro}
\usepackage[T1]{fontenc}
\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\input{glyphtounicode}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1in}
\addtolength{\topmargin}{-.5in}
\addtolength{\textheight}{1.0in}

\urlstyle{same}
\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

\titleformat{\section}{
  \vspace{-4pt}\scshape\raggedright\large
}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

\pdfgentounicode=1

\newcommand{\resumeItem}[1]{
  \item\small{
    {#1 \vspace{-2pt}}
  }
}

\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & #2 \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1 & #2 \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubItem}[1]{\resumeItem{#1}\vspace{-4pt}}

\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}

\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}`

export function exportAsTex(profile: ProfileData, selection?: ExportSelection): string {
  const c = profile.contact

  const contactParts: string[] = []
  if (c.phone) contactParts.push(c.phone)
  if (c.email) contactParts.push(`\\href{mailto:${c.email}}{\\underline{${c.email}}}`)
  if (c.linkedin)
    contactParts.push(
      `\\href{https://linkedin.com/in/${c.linkedin}}{\\underline{linkedin.com/in/${c.linkedin}}}`
    )
  if (c.github)
    contactParts.push(`\\href{https://github.com/${c.github}}{\\underline{github.com/${c.github}}}`)
  if (c.portfolio) contactParts.push(`\\href{${c.portfolio}}{\\underline{${c.portfolio}}}`)

  const header = `\\begin{center}
    \\textbf{\\Huge \\scshape ${escapeTex(c.name)}} \\\\ \\vspace{1pt}
    \\small ${contactParts.join(' $|$ ')}
\\end{center}`

  const sections: string[] = []

  // Education
  const eduEntries = profile.education.filter(
    (e) => !selection || selection.education.includes(e.id)
  )
  if (eduEntries.length > 0) {
    const lines = [`\\section{Education}`, `  \\resumeSubHeadingListStart`]
    for (const e of eduEntries) {
      lines.push(`    \\resumeSubheading`)
      lines.push(`      {${escapeTex(e.school)}}{${escapeTex(e.location)}}`)
      lines.push(`      {${escapeTex(e.degree)}}{${escapeTex(e.dates)}}`)
      if (e.coursework) lines.push(`        \\resumeSubItem{${escapeTex(e.coursework)}}`)
    }
    lines.push(`  \\resumeSubHeadingListEnd`)
    sections.push(lines.join('\n'))
  }

  // Experience
  const expEntries = profile.experience.filter(
    (e) => !selection || selection.experience.includes(e.id)
  )
  if (expEntries.length > 0) {
    const lines = [`\\section{Experience}`, `  \\resumeSubHeadingListStart`]
    for (const e of expEntries) {
      lines.push(`    \\resumeSubheading`)
      lines.push(`      {\\textbf{${escapeTex(e.company)}}}{${escapeTex(e.dates)}}`)
      lines.push(`      {${escapeTex(e.role)}}{${escapeTex(e.location)}}`)
      if (e.bullets.length > 0) {
        lines.push(`        \\resumeItemListStart`)
        for (const b of e.bullets) lines.push(`            \\resumeItem{${escapeTex(b)}}`)
        lines.push(`        \\resumeItemListEnd`)
      }
    }
    lines.push(`  \\resumeSubHeadingListEnd`)
    sections.push(lines.join('\n'))
  }

  // Projects
  const projEntries = profile.projects.filter(
    (e) => !selection || selection.projects.includes(e.id)
  )
  if (projEntries.length > 0) {
    const lines = [`\\section{Projects}`, `    \\resumeSubHeadingListStart`]
    for (const e of projEntries) {
      const heading = e.techStack
        ? `\\textbf{${escapeTex(e.name)} $|$} \\normalfont\\emph{${escapeTex(e.techStack)}}`
        : `\\textbf{${escapeTex(e.name)}}`
      lines.push(`        \\resumeProjectHeading`)
      lines.push(`          {${heading}}{${escapeTex(e.dates)}}`)
      if (e.bullets.length > 0) {
        lines.push(`          \\resumeItemListStart`)
        for (const b of e.bullets) lines.push(`            \\resumeItem{${escapeTex(b)}}`)
        lines.push(`        \\resumeItemListEnd`)
      }
    }
    lines.push(`    \\resumeSubHeadingListEnd`)
    sections.push(lines.join('\n'))
  }

  // Skills
  const skillEntries = profile.skills.filter((e) => !selection || selection.skills.includes(e.id))
  if (skillEntries.length > 0) {
    const lines = [
      `\\section{Technical Skills}`,
      ` \\begin{itemize}[leftmargin=0.15in, label={}]`,
      `    \\small{\\item{`,
    ]
    for (const e of skillEntries) {
      lines.push(`     \\textbf{${escapeTex(e.category)}:}{ ${escapeTex(e.technologies)}} \\\\`)
    }
    lines.push(`    }}`)
    lines.push(` \\end{itemize}`)
    sections.push(lines.join('\n'))
  }

  return `${TEX_PREAMBLE}\n\n\\begin{document}\n\n${header}\n\n${sections.join('\n')}\n\\end{document}\n`
}

export function exportAsMd(profile: ProfileData, selection?: ExportSelection): string {
  const c = profile.contact
  const lines: string[] = []

  lines.push(`# ${c.name}`, '')

  const contact: string[] = []
  if (c.phone) contact.push(c.phone)
  if (c.email) contact.push(`[${c.email}](mailto:${c.email})`)
  if (c.linkedin) contact.push(`[linkedin/${c.linkedin}](https://linkedin.com/in/${c.linkedin})`)
  if (c.github) contact.push(`[github/${c.github}](https://github.com/${c.github})`)
  if (c.portfolio) contact.push(`[${c.portfolio}](${c.portfolio})`)
  lines.push(contact.join(' · '), '')

  const eduEntries = profile.education.filter(
    (e) => !selection || selection.education.includes(e.id)
  )
  if (eduEntries.length > 0) {
    lines.push('## Education', '')
    for (const e of eduEntries) {
      lines.push(`### ${e.school} — ${e.degree}`)
      lines.push(`*${[e.location, e.dates].filter(Boolean).join(' · ')}*`, '')
      if (e.coursework) lines.push(`- ${e.coursework}`)
      if (e.rawText) lines.push('', `> ${e.rawText}`)
      lines.push('')
    }
  }

  const expEntries = profile.experience.filter(
    (e) => !selection || selection.experience.includes(e.id)
  )
  if (expEntries.length > 0) {
    lines.push('## Experience', '')
    for (const e of expEntries) {
      lines.push(`### ${e.company} — ${e.role}`)
      lines.push(`*${[e.location, e.dates].filter(Boolean).join(' · ')}*`, '')
      for (const b of e.bullets) lines.push(`- ${b}`)
      if (!e.bullets.length && e.rawText) lines.push(`> ${e.rawText}`)
      lines.push('')
    }
  }

  const projEntries = profile.projects.filter(
    (e) => !selection || selection.projects.includes(e.id)
  )
  if (projEntries.length > 0) {
    lines.push('## Projects', '')
    for (const e of projEntries) {
      const header = [e.name, e.techStack && `*${e.techStack}*`, e.dates && `(${e.dates})`]
        .filter(Boolean)
        .join(' · ')
      lines.push(`### ${header}`, '')
      for (const b of e.bullets) lines.push(`- ${b}`)
      if (!e.bullets.length && e.rawText) lines.push(`> ${e.rawText}`)
      lines.push('')
    }
  }

  const skillEntries = profile.skills.filter((e) => !selection || selection.skills.includes(e.id))
  if (skillEntries.length > 0) {
    lines.push('## Technical Skills', '')
    for (const e of skillEntries) lines.push(`- **${e.category}:** ${e.technologies}`)
  }

  return lines.join('\n')
}

// ─── HTML preview (mirrors compiled .tex output) ─────────────────────────────

export type ResumeHtmlOpts = { editable?: boolean; format?: ResumeFormat }

function makeFontImport(fmt: ResumeFormat): string {
  const fontOpt = FONT_OPTIONS.find((f) => f.value === fmt.fontFamily)
  if (fontOpt?.customLink) return `@import url('${fontOpt.customLink}');`
  if (fontOpt?.googleFont)
    return `@import url('https://fonts.googleapis.com/css2?family=${fontOpt.googleFont}&display=swap');`
  return ''
}

/* eslint-disable no-useless-escape */
function makeResumeCss(fmt: ResumeFormat): string {
  const fontImport = makeFontImport(fmt)
  const m = fmt.pageMargin
  // LaTeX 11pt class size scale (proportional to base fontSize):
  //   \small = fontSize*(10/11)   \large = fontSize*(12/11)   \Huge = fontSize*(24.88/11)
  const smallPt = ((fmt.fontSize * 10) / 11).toFixed(2) // \small
  const largePt = ((fmt.fontSize * 12) / 11).toFixed(2) // \large  (section titles)

  // For Computer Modern Serif: load the actual small-caps face (cmunsc.woff) so
  // the browser uses real glyphs rather than synthesizing uppercase-only fake small-caps.
  // In LaTeX, \textbf{\Huge \scshape Name} uses cmcsc (regular-weight SC face) because
  // CM has no bold-SC variant — so h1 is rendered at normal weight with SC glyphs.
  const isCMSerif =
    fmt.fontFamily.includes('Computer Modern Serif') && !fmt.fontFamily.includes('Sans')
  const cmScFontFace = isCMSerif
    ? `
@font-face {
  font-family: 'Computer Modern Serif SC';
  src: url('https://cdn.jsdelivr.net/gh/dreampulse/computer-modern-web-font@master/font/Serif/cmunsc.woff') format('woff');
  font-weight: normal;
  font-style: normal;
}`
    : ''
  const h1FontFamily = isCMSerif
    ? "'Computer Modern Serif SC', 'Computer Modern Serif', serif"
    : fmt.fontFamily
  const h1FontWeight = isCMSerif ? 'normal' : '700'

  return `${fontImport}${cmScFontFace}

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { overflow: hidden; }
  @page { size: letter; margin: ${m}in; }
  body {
    font-family: ${fmt.fontFamily};
    font-size: ${fmt.fontSize}pt;
    line-height: ${fmt.lineHeight};
    color: #000;
    background: #fff;
    padding: ${m}in ${m}in 0;
    max-width: 8.5in;
    margin: 0 auto;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    font-feature-settings: 'kern' 1, 'liga' 1;
  }
  a { color: inherit; text-decoration: underline; }

  /*
   * Header:  \textbf{\Huge \scshape Name} \\ \vspace{1pt} \small contact
   * \Huge at 11pt class = 24.88pt (nameSize default = 25)
   * CM has no bold-SC face → LaTeX falls back to regular-weight SC (cmunsc.woff)
   * No extra letter-spacing — \scshape does not add tracking in LaTeX
   */
  .hdr { text-align: center; margin-bottom: 12px; }
  .hdr h1 {
    font-size: ${fmt.nameSize}pt;
    font-weight: ${h1FontWeight};
    font-family: ${h1FontFamily};
    /* no letter-spacing: LaTeX \scshape adds none */
  }
  /* \small contact line, \vspace{1pt} gap */
  .hdr .contact { font-size: ${smallPt}pt; color: #111; margin-top: 2px; }
  /* $|$ separator: thin math space each side, rendered as | */
  .hdr .contact .sep { margin: 0 4px; }

  /*
   * Section: \vspace{-4pt}\scshape\raggedright\large + \titlerule\vspace{-5pt}
   * \large at 11pt = 12pt, font-weight 400 (NOT bold), small-caps, no tracking
   * titlerule = full-width 0.4pt rule below title
   */
  section { margin-bottom: ${fmt.sectionSpacing}px; }
  .sec-title {
    font-size: ${largePt}pt;
    font-weight: ${isCMSerif ? 'normal' : '600'};
    font-family: ${isCMSerif ? "'Computer Modern Serif SC', 'Computer Modern Serif', serif" : fmt.fontFamily};
    /* no letter-spacing */
    border-bottom: 0.4pt solid #000;
    padding-bottom: 0;
    margin-bottom: 4px;
    margin-top: 2px;
  }

  /*
   * \resumeSubHeadingListStart = \begin{itemize}[leftmargin=0.15in, label={}]
   * All entries are indented 0.15in from left margin
   */
  .entries { padding-left: 0.15in; }

  /*
   * \resumeSubheading row 1: \textbf{#1} & #2
   * Both args are normalsize (no \small) → fontSize pt
   * #1 is bold, #2 is normal weight
   */
  .entry { margin-bottom: ${fmt.entrySpacing}px; }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
  .org  { font-weight: 700; font-size: ${fmt.fontSize}pt; }  /* \textbf{company/school} */
  .r1   { font-size: ${fmt.fontSize}pt; white-space: nowrap; font-weight: 400; } /* right col row 1: normalsize */

  /*
   * \resumeSubheading row 2: \textit{\small #3} & \textit{\small #4}
   * Both: \small (smallPt) + \textit (italic)
   */
  .sub  { font-style: italic; font-size: ${smallPt}pt; margin-top: 1px; }

  /* Relevant coursework line — \small */
  .cw   { font-size: ${smallPt}pt; color: #111; margin-top: 1px; }

  /*
   * \resumeProjectHeading: \small#1 & #2  ← \small applies to ENTIRE row
   * name = \textbf, techStack = \normalfont\emph (normal weight, italic)
   * dates (#2) also \small since the whole row is inside \small
   */
  .proj-row .org { font-size: ${smallPt}pt; }
  .proj-row .r1  { font-size: ${smallPt}pt; }

  /*
   * \resumeItem: \item\small{#1}
   * \small, normal weight, list-style disc
   * \begin{itemize} default: leftmargin ~2.5em at \small size
   */
  .bullets { margin-top: 1px; padding-left: 1.5em; }
  .bullets li { font-size: ${fmt.bulletSize}pt; margin-bottom: 0; list-style-type: disc; line-height: ${fmt.lineHeight}; }
  .rawtext {
    font-size: ${smallPt}pt; color: #555; font-style: italic;
    margin-top: 2px; padding-left: 8px; border-left: 2px solid #ccc;
  }

  /*
   * Technical Skills: \begin{itemize}[leftmargin=0.15in, label={}]
   *   \small{\item{ \textbf{cat}: techs \\ }}
   */
  .sk-list { padding-left: 0.15in; }
  .sk-row  { font-size: ${smallPt}pt; margin-bottom: 1px; }
  .sk-cat  { font-weight: 700; }

  @media print {
    body { padding: 0; }
    a { text-decoration: none; }
  }
`
}
/* eslint-enable no-useless-escape */

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Like esc() but allows whitelisted inline formatting tags (<b>, <i>, <u>, <strong>, <em>).
 * Use for text content fields that may contain user-applied bold/italic from contenteditable.
 */
function safeHtml(s: string): string {
  const escaped = s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  return escaped.replace(/&lt;(\/?)(b|i|u|strong|em)&gt;/gi, '<$1$2>')
}

export function generateResumeHtml(
  profile: ProfileData,
  selection?: ExportSelection,
  opts?: ResumeHtmlOpts
): string {
  const editable = opts?.editable ?? false
  const fmt = opts?.format ?? DEFAULT_FORMAT
  const c = profile.contact

  // Produces data-attribute string + contenteditable when editable
  const at = (rf: string, rs: string, rid?: string, rbi?: number) =>
    editable
      ? ` data-rf="${rf}" data-rs="${rs}"${rid ? ` data-rid="${rid}"` : ''}${rbi != null ? ` data-rbi="${rbi}"` : ''} contenteditable="true" spellcheck="false"`
      : ''

  const eduEntries = profile.education.filter(
    (e) => !selection || selection.education.includes(e.id)
  )
  const expEntries = profile.experience.filter(
    (e) => !selection || selection.experience.includes(e.id)
  )
  const projEntries = profile.projects.filter(
    (e) => !selection || selection.projects.includes(e.id)
  )
  const skillEntries = profile.skills.filter((e) => !selection || selection.skills.includes(e.id))

  const contactParts: string[] = []
  if (c.phone) contactParts.push(`<span${at('phone', 'contact')}>${safeHtml(c.phone)}</span>`)
  if (c.email)
    contactParts.push(
      `<a href="mailto:${esc(c.email)}"${at('email', 'contact')}>${safeHtml(c.email)}</a>`
    )
  if (c.linkedin)
    contactParts.push(
      `<a href="https://linkedin.com/in/${esc(c.linkedin)}"${at('linkedin', 'contact')}>linkedin.com/in/${safeHtml(c.linkedin)}</a>`
    )
  if (c.github)
    contactParts.push(
      `<a href="https://github.com/${esc(c.github)}"${at('github', 'contact')}>github.com/${safeHtml(c.github)}</a>`
    )
  if (c.portfolio)
    contactParts.push(
      `<a href="${esc(c.portfolio)}"${at('portfolio', 'contact')}>${safeHtml(c.portfolio)}</a>`
    )

  const sec = (title: string, body: string) =>
    `<section><div class="sec-title">${title}</div>${body}</section>`

  const blist = (bs: string[], raw: string, section: string, id: string) => {
    if (bs.length > 0)
      return `<ul class="bullets">${bs.map((b, i) => `<li${at('bullet', section, id, i)}>${safeHtml(b)}</li>`).join('')}</ul>`
    if (raw) return `<div class="rawtext">${safeHtml(raw)}</div>`
    return ''
  }
  // Education: \resumeSubheading{school}{location}{degree}{dates}
  //   row1: \textbf{school}(normalsize) & location(normalsize)
  //   row2: \textit{\small degree} & \textit{\small dates}
  const eduHtml =
    eduEntries.length === 0
      ? ''
      : sec(
          'Education',
          `<div class="entries">${eduEntries
            .map(
              (e) => `
    <div class="entry">
      <div class="row">
        <span class="org"${at('school', 'education', e.id)}>${safeHtml(e.school)}</span>
        <span class="r1"${at('location', 'education', e.id)}>${safeHtml(e.location)}</span>
      </div>
      <div class="row sub">
        <span${at('degree', 'education', e.id)}>${safeHtml(e.degree)}</span>
        <span${at('dates', 'education', e.id)}>${safeHtml(e.dates)}</span>
      </div>
      ${e.coursework ? `<div class="cw"><b>Relevant Coursework:</b> <span${at('coursework', 'education', e.id)}>${safeHtml(e.coursework.replace(/^Relevant Coursework:\s*/i, ''))}</span></div>` : ''}
    </div>`
            )
            .join('')}</div>`
        )

  // Experience: \resumeSubheading{company}{dates}{role}{location}
  //   row1: \textbf{company}(normalsize) & dates(normalsize)
  //   row2: \textit{\small role} & \textit{\small location}
  const expHtml =
    expEntries.length === 0
      ? ''
      : sec(
          'Experience',
          `<div class="entries">${expEntries
            .map(
              (e) => `
    <div class="entry">
      <div class="row">
        <span class="org"${at('company', 'experience', e.id)}>${safeHtml(e.company)}</span>
        <span class="r1"${at('dates', 'experience', e.id)}>${safeHtml(e.dates)}</span>
      </div>
      <div class="row sub">
        <span${at('role', 'experience', e.id)}>${safeHtml(e.role)}</span>
        <span${at('location', 'experience', e.id)}>${safeHtml(e.location)}</span>
      </div>
      ${blist(e.bullets, e.rawText, 'experience', e.id)}
    </div>`
            )
            .join('')}</div>`
        )

  // Projects: \resumeProjectHeading{\textbf{name} $|$ \normalfont\emph{tech}}{dates}
  //   \small applies to ENTIRE row → both name/tech and dates are \small (smallPt)
  const projHtml =
    projEntries.length === 0
      ? ''
      : sec(
          'Projects',
          `<div class="entries">${projEntries
            .map(
              (e) => `
    <div class="entry">
      <div class="row proj-row">
        <span class="org"${at('name', 'projects', e.id)}>${safeHtml(e.name)}${e.techStack ? ` <span style="font-weight:400;font-style:italic"${at('techStack', 'projects', e.id)}>| ${safeHtml(e.techStack)}</span>` : ''}</span>
        <span class="r1"${at('dates', 'projects', e.id)}>${safeHtml(e.dates)}</span>
      </div>
      ${blist(e.bullets, e.rawText, 'projects', e.id)}
    </div>`
            )
            .join('')}</div>`
        )

  // Skills: \begin{itemize}[leftmargin=0.15in,label={}] \small \textbf{cat}: techs
  const skillHtml =
    skillEntries.length === 0
      ? ''
      : sec(
          'Technical Skills',
          `<div class="sk-list">${skillEntries
            .map(
              (e) =>
                `<div class="sk-row"><span class="sk-cat"${at('category', 'skills', e.id)}>${safeHtml(e.category)}:</span> <span${at('technologies', 'skills', e.id)}>${safeHtml(e.technologies)}</span></div>`
            )
            .join('')}</div>`
        )

  const resumeCss = makeResumeCss(fmt)
  const editCss = editable
    ? `
  [data-rf] { cursor: text; border-radius: 2px; outline: none; }
  [data-rf]:hover:not(:focus) { outline: 1px dashed rgba(70,102,119,0.45); }
  [data-rf]:focus { outline: 1.5px solid rgba(70,102,119,0.75); background: rgba(70,102,119,0.05); outline-offset: 1px; }
  * { caret-color: #456677; }`
    : ''

  // Injected script: syncs field value on focusout; notifies parent of focus state
  const editScript = editable
    ? `<script>(function(){
  document.addEventListener('focusin',function(e){
    if(e.target.closest('[data-rf]')) window.parent.postMessage({type:'resume-focus'},'*');
  });
  document.addEventListener('focusout',function(e){
    var el=e.target.closest('[data-rf]');
    if(!el)return;
    window.parent.postMessage({type:'resume-input',rf:el.dataset.rf,rs:el.dataset.rs,rid:el.dataset.rid||null,rbi:el.dataset.rbi!=null?+el.dataset.rbi:null,value:el.innerHTML.trim()},'*');
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Enter'){var el=e.target.closest('[data-rf]');if(el){e.preventDefault();el.blur();}}
    if(e.key==='Escape'){var el=e.target.closest('[data-rf]');if(el)el.blur();}
  });
})();</script>`
    : ''

  // Page-break avoidance script — always injected (not editable-only).
  // Runs after fonts load, inserts zero-height spacers before elements that straddle
  // a page boundary, then posts the new body height so React can update pageCount.
  //
  // Page boundaries (from iframe top):  M + C*k   for k = 1, 2, ...
  //   M = body padding-top (= pageMargin * 96 px)
  //   C = content per page (= 1056 − 2*M px)
  //
  // Elements handled:
  //   .bullets li  — prevent mid-sentence bullet splits
  //   .sec-title   — prevent orphan section headings (push if within 50px of a break)
  const _M = Math.round(fmt.pageMargin * 96)
  const _C = 1056 - 2 * _M
  const breakScript = `<script>(function(){
  var M=${_M},C=${_C};
  function bps(){var a=[],y=M+C,max=document.body.scrollHeight+C;while(y<max){a.push(y);y+=C;}return a;}
  function run(){
    var chg,g=0;
    do{
      chg=false;
      var bs=bps();
      var els=Array.from(document.querySelectorAll('.bullets li,.sec-title'));
      for(var i=0;i<els.length;i++){
        var el=els[i],isSec=el.classList.contains('sec-title');
        var t=el.getBoundingClientRect().top,b=el.getBoundingClientRect().bottom;
        for(var j=0;j<bs.length;j++){
          // For sec-title: also push if ending within 50px of a break (orphan prevention)
          if(t<bs[j]&&b+(isSec?50:0)>bs[j]){
            var sp=document.createElement('div');
            sp.style.height=(bs[j]-t)+'px';
            el.parentNode.insertBefore(sp,el);
            chg=true;break;
          }
        }
        if(chg)break;
      }
    }while(chg&&++g<20);
    window.parent.postMessage({type:'resume-height',height:document.body.scrollHeight},'*');
  }
  function onReady(){if(document.fonts&&document.fonts.ready){document.fonts.ready.then(run).catch(run);}else{setTimeout(run,150);}}
  if(document.readyState==='complete'){onReady();}else{window.addEventListener('load',onReady);}
})();</script>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>${resumeCss}${editCss}</style>
</head>
<body>
  <div class="hdr">
    <h1${at('name', 'contact')}>${safeHtml(c.name || 'Your Name')}</h1>
    <div class="contact">${contactParts.join('<span class="sep">|</span>')}</div>
  </div>
  ${eduHtml}${expHtml}${projHtml}${skillHtml}
  ${breakScript}
  ${editScript}
</body>
</html>`
}

export function printResumePdf(html: string) {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) {
    alert('Allow popups to download PDF')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
  // Wait for fonts to load before printing
  win.onload = () => {
    setTimeout(() => {
      win.print()
      win.close()
    }, 800)
  }
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const ALL_SECTION_TYPES: SectionType[] = ['education', 'experience', 'projects', 'skills']
