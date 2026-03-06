import type { ProfileData, SectionType } from '@/types/profile'

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
  if (c.linkedin) contactParts.push(`\\href{https://linkedin.com/in/${c.linkedin}}{\\underline{linkedin.com/in/${c.linkedin}}}`)
  if (c.github) contactParts.push(`\\href{https://github.com/${c.github}}{\\underline{github.com/${c.github}}}`)
  if (c.portfolio) contactParts.push(`\\href{${c.portfolio}}{\\underline{${c.portfolio}}}`)

  const header = `\\begin{center}
    \\textbf{\\Huge \\scshape ${escapeTex(c.name)}} \\\\ \\vspace{1pt}
    \\small ${contactParts.join(' $|$ ')}
\\end{center}`

  const sections: string[] = []

  // Education
  const eduEntries = profile.education.filter(e => !selection || selection.education.includes(e.id))
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
  const expEntries = profile.experience.filter(e => !selection || selection.experience.includes(e.id))
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
  const projEntries = profile.projects.filter(e => !selection || selection.projects.includes(e.id))
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
  const skillEntries = profile.skills.filter(e => !selection || selection.skills.includes(e.id))
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

  const eduEntries = profile.education.filter(e => !selection || selection.education.includes(e.id))
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

  const expEntries = profile.experience.filter(e => !selection || selection.experience.includes(e.id))
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

  const projEntries = profile.projects.filter(e => !selection || selection.projects.includes(e.id))
  if (projEntries.length > 0) {
    lines.push('## Projects', '')
    for (const e of projEntries) {
      const header = [e.name, e.techStack && `*${e.techStack}*`, e.dates && `(${e.dates})`].filter(Boolean).join(' · ')
      lines.push(`### ${header}`, '')
      for (const b of e.bullets) lines.push(`- ${b}`)
      if (!e.bullets.length && e.rawText) lines.push(`> ${e.rawText}`)
      lines.push('')
    }
  }

  const skillEntries = profile.skills.filter(e => !selection || selection.skills.includes(e.id))
  if (skillEntries.length > 0) {
    lines.push('## Technical Skills', '')
    for (const e of skillEntries) lines.push(`- **${e.category}:** ${e.technologies}`)
  }

  return lines.join('\n')
}

// ─── HTML preview (mirrors compiled .tex output) ─────────────────────────────

export type ResumeHtmlOpts = { editable?: boolean }

const RESUME_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: letter; margin: 0.5in; }
  body {
    font-family: 'Source Code Pro', 'JetBrains Mono', 'Courier New', monospace;
    font-size: 10.5pt;
    line-height: 1.45;
    color: #000;
    background: #fff;
    padding: 0.5in;
    max-width: 8.5in;
    margin: 0 auto;
  }
  a { color: inherit; text-decoration: underline; }

  /* Header */
  .hdr { text-align: center; margin-bottom: 14px; }
  .hdr h1 {
    font-size: 21pt;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-variant: small-caps;
  }
  .hdr .contact {
    font-size: 8.5pt;
    color: #222;
    margin-top: 3px;
  }
  .hdr .contact .sep { margin: 0 5px; color: #666; }

  /* Section */
  section { margin-bottom: 10px; }
  .sec-title {
    font-size: 10.5pt;
    font-weight: 700;
    text-transform: uppercase;
    font-variant: small-caps;
    letter-spacing: 0.04em;
    border-bottom: 1px solid #000;
    padding-bottom: 1px;
    margin-bottom: 5px;
  }

  /* Entry rows (mimics tabularx) */
  .entry { margin-bottom: 5px; }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
  .org   { font-weight: 700; font-size: 10.5pt; }
  .sub   { font-style: italic; font-size: 9pt; margin-top: 0; }
  .date  { font-size: 9pt; white-space: nowrap; }
  .cw    { font-size: 9pt; color: #222; margin-top: 2px; }

  /* Bullets */
  .bullets { margin-top: 3px; padding-left: 18px; }
  .bullets li { font-size: 9pt; margin-bottom: 1.5px; list-style-type: disc; }
  .rawtext {
    font-size: 9pt; color: #555; font-style: italic;
    margin-top: 3px; padding-left: 8px; border-left: 2px solid #ccc;
  }

  /* Skills */
  .sk-row { font-size: 9pt; margin-bottom: 2px; }
  .sk-cat { font-weight: 700; }

  @media print {
    body { padding: 0; }
    a { text-decoration: none; }
  }
`

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function generateResumeHtml(
  profile: ProfileData,
  selection?: ExportSelection,
  opts?: ResumeHtmlOpts,
): string {
  const editable = opts?.editable ?? false
  const c = profile.contact

  // Produces data-attribute string + contenteditable when editable
  const at = (rf: string, rs: string, rid?: string, rbi?: number) =>
    editable
      ? ` data-rf="${rf}" data-rs="${rs}"${rid ? ` data-rid="${rid}"` : ''}${rbi != null ? ` data-rbi="${rbi}"` : ''} contenteditable="true" spellcheck="false"`
      : ''

  const eduEntries   = profile.education.filter(e  => !selection || selection.education.includes(e.id))
  const expEntries   = profile.experience.filter(e => !selection || selection.experience.includes(e.id))
  const projEntries  = profile.projects.filter(e   => !selection || selection.projects.includes(e.id))
  const skillEntries = profile.skills.filter(e     => !selection || selection.skills.includes(e.id))

  const contactParts: string[] = []
  if (c.phone)     contactParts.push(`<span${at('phone', 'contact')}>${esc(c.phone)}</span>`)
  if (c.email)     contactParts.push(`<a href="mailto:${esc(c.email)}"${at('email', 'contact')}>${esc(c.email)}</a>`)
  if (c.linkedin)  contactParts.push(`<a href="https://linkedin.com/in/${esc(c.linkedin)}"${at('linkedin', 'contact')}>linkedin.com/in/${esc(c.linkedin)}</a>`)
  if (c.github)    contactParts.push(`<a href="https://github.com/${esc(c.github)}"${at('github', 'contact')}>github.com/${esc(c.github)}</a>`)
  if (c.portfolio) contactParts.push(`<a href="${esc(c.portfolio)}"${at('portfolio', 'contact')}>${esc(c.portfolio)}</a>`)

  const sec = (title: string, body: string) =>
    `<section><div class="sec-title">${title}</div>${body}</section>`

  const blist = (bs: string[], raw: string, section: string, id: string) => {
    if (bs.length > 0)
      return `<ul class="bullets">${bs.map((b, i) => `<li${at('bullet', section, id, i)}>${esc(b)}</li>`).join('')}</ul>`
    if (raw)
      return `<div class="rawtext">${esc(raw)}</div>`
    return ''
  }

  const eduHtml = eduEntries.length === 0 ? '' : sec('Education', eduEntries.map(e => `
    <div class="entry">
      <div class="row"><span class="org"${at('school', 'education', e.id)}>${esc(e.school)}</span><span class="date"${at('location', 'education', e.id)}>${esc(e.location)}</span></div>
      <div class="row sub"><span${at('degree', 'education', e.id)}>${esc(e.degree)}</span><span${at('dates', 'education', e.id)}>${esc(e.dates)}</span></div>
      ${e.coursework ? `<div class="cw"><b>Relevant Coursework:</b> <span${at('coursework', 'education', e.id)}>${esc(e.coursework.replace(/^Relevant Coursework:\s*/i, ''))}</span></div>` : ''}
    </div>`).join(''))

  const expHtml = expEntries.length === 0 ? '' : sec('Experience', expEntries.map(e => `
    <div class="entry">
      <div class="row"><span class="org"${at('company', 'experience', e.id)}>${esc(e.company)}</span><span class="date"${at('dates', 'experience', e.id)}>${esc(e.dates)}</span></div>
      <div class="row sub"><span${at('role', 'experience', e.id)}>${esc(e.role)}</span><span${at('location', 'experience', e.id)}>${esc(e.location)}</span></div>
      ${blist(e.bullets, e.rawText, 'experience', e.id)}
    </div>`).join(''))

  const projHtml = projEntries.length === 0 ? '' : sec('Projects', projEntries.map(e => `
    <div class="entry">
      <div class="row">
        <span class="org" style="font-size:9.5pt">
          <span${at('name', 'projects', e.id)}>${esc(e.name)}</span>${e.techStack ? ` <span style="font-weight:400;font-style:italic"${at('techStack', 'projects', e.id)}>| ${esc(e.techStack)}</span>` : ''}
        </span>
        <span class="date"${at('dates', 'projects', e.id)}>${esc(e.dates)}</span>
      </div>
      ${blist(e.bullets, e.rawText, 'projects', e.id)}
    </div>`).join(''))

  const skillHtml = skillEntries.length === 0 ? '' : sec('Technical Skills',
    skillEntries.map(e =>
      `<div class="sk-row"><span class="sk-cat"${at('category', 'skills', e.id)}>${esc(e.category)}:</span> <span${at('technologies', 'skills', e.id)}>${esc(e.technologies)}</span></div>`
    ).join(''))

  const editCss = editable ? `
  [data-rf] { cursor: text; border-radius: 2px; outline: none; }
  [data-rf]:hover:not(:focus) { outline: 1px dashed rgba(70,102,119,0.45); }
  [data-rf]:focus { outline: 1.5px solid rgba(70,102,119,0.75); background: rgba(70,102,119,0.05); outline-offset: 1px; }
  * { caret-color: #456677; }` : ''

  // Injected script: syncs field value on focusout; notifies parent of focus state
  const editScript = editable ? `<script>(function(){
  document.addEventListener('focusin',function(e){
    if(e.target.closest('[data-rf]')) window.parent.postMessage({type:'resume-focus'},'*');
  });
  document.addEventListener('focusout',function(e){
    var el=e.target.closest('[data-rf]');
    if(!el)return;
    window.parent.postMessage({type:'resume-input',rf:el.dataset.rf,rs:el.dataset.rs,rid:el.dataset.rid||null,rbi:el.dataset.rbi!=null?+el.dataset.rbi:null,value:el.innerText.trim()},'*');
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Enter'){var el=e.target.closest('[data-rf]');if(el){e.preventDefault();el.blur();}}
    if(e.key==='Escape'){var el=e.target.closest('[data-rf]');if(el)el.blur();}
  });
})();</script>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <style>${RESUME_CSS}${editCss}</style>
</head>
<body>
  <div class="hdr">
    <h1${at('name', 'contact')}>${esc(c.name || 'Your Name')}</h1>
    <div class="contact">${contactParts.join('<span class="sep">|</span>')}</div>
  </div>
  ${eduHtml}${expHtml}${projHtml}${skillHtml}
  ${editScript}
</body>
</html>`
}

export function printResumePdf(html: string) {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { alert('Allow popups to download PDF'); return }
  win.document.open()
  win.document.write(html)
  win.document.close()
  // Wait for fonts to load before printing
  win.onload = () => {
    setTimeout(() => { win.print(); win.close() }, 800)
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
