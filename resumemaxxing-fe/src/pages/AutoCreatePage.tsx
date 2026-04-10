import { useState, useRef, useEffect, useMemo } from 'react'
import { Loader2, RotateCcw, Download, FileText, Wand2 } from 'lucide-react'
import { generateResumeWithAI, toApiProfile } from '@/utils/aiParser'
import {
  generateResumeHtml,
  exportAsTex,
  exportAsMd,
  downloadFile,
  DEFAULT_FORMAT,
} from '@/utils/profileExport'
import { ProfileDataSchema } from '@/schemas/profile'
import type { ProfileData } from '@/types/profile'
import { DropdownBtn, DropItem } from '@/components/ui/dropdown-btn'
import PillBtn from '@/components/ui/pill-btn'
import { cn } from '@/lib/utils'
import { GUIDELINES } from '@/constants/guidelines'

// ─── storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'agentic-resume-profile'
const FORMAT_KEY = 'agentic-resume-format'

function loadProfile(): ProfileData {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    const result = ProfileDataSchema.safeParse(s ? JSON.parse(s) : null)
    return result.success ? result.data : DEFAULT_PROFILE
  } catch {
    return DEFAULT_PROFILE
  }
}

const DEFAULT_PROFILE: ProfileData = {
  contact: { name: '', phone: '', email: '', linkedin: '', github: '', portfolio: '' },
  education: [],
  experience: [],
  projects: [],
  skills: [],
  research: [],
  leadership: [],
  volunteering: [],
  certifications: [],
  awards: [],
}

// ─── JSON syntax highlight ────────────────────────────────────────────────────

function highlightJson(json: string): string {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/("[\w]+")\s*:/g, '<span style="color:#6ea8d0">$1</span>:')
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span style="color:#7ec8a0">$1</span>')
    .replace(/:\s*(\d+(?:\.\d+)?)/g, ': <span style="color:#c89a6e">$1</span>')
    .replace(/:\s*(true|false|null)/g, ': <span style="color:#a07ec8">$1</span>')
}

// ─── page layout constants (mirrors ManualPage) ───────────────────────────────

const PAGE_H = 1056

export default function AutoCreatePage() {
  const [profile] = useState<ProfileData>(loadProfile)
  const [jd, setJd] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ProfileData | null>(null)
  const [selectedGuidelines, setSelectedGuidelines] = useState<string[]>(
    GUIDELINES.map((g) => g.id)
  )
  const [mobileTab, setMobileTab] = useState<'profile' | 'main'>('main')

  // ── preview ──
  const format = useMemo(() => {
    try {
      const s = localStorage.getItem(FORMAT_KEY)
      return s ? { ...DEFAULT_FORMAT, ...JSON.parse(s) } : DEFAULT_FORMAT
    } catch {
      return DEFAULT_FORMAT
    }
  }, [])

  const [resumeHtml, setResumeHtml] = useState('')
  const [contentHeight, setContentHeight] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!result) return
    setResumeHtml(generateResumeHtml(result, undefined, { format }))
  }, [result, format])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const resize = () => {
      const h = iframe.contentDocument?.body?.scrollHeight
      if (h) setContentHeight(h)
    }
    iframe.addEventListener('load', resize)
    return () => iframe.removeEventListener('load', resize)
  }, [resumeHtml])

  const marginPx = Math.round(format.pageMargin * 96)
  const contentPerPage = PAGE_H - 2 * marginPx
  const pageCount =
    contentHeight > 0 ? Math.max(1, Math.ceil((contentHeight - marginPx) / contentPerPage)) : 1

  // ── api call ──
  const apiProfile = useMemo(() => toApiProfile(profile), [profile])

  const handleGenerate = async () => {
    if (!jd.trim()) return
    setGenerating(true)
    setError(null)
    try {
      const generated = await generateResumeWithAI(profile, jd, selectedGuidelines)
      setResult(generated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setGenerating(false)
    }
  }

  // ── exports ──
  const handleExportTex = () => {
    if (!result) return
    downloadFile(exportAsTex(result), 'resume.tex', 'text/plain')
  }
  const handleExportMd = () => {
    if (!result) return
    downloadFile(exportAsMd(result), 'resume.md', 'text/markdown')
  }

  // ── profile stats ──
  const entryCount =
    profile.education.length +
    profile.experience.length +
    profile.projects.length +
    profile.skills.length

  const jsonStr = useMemo(() => JSON.stringify(apiProfile, null, 2), [apiProfile])

  return (
    <div
      className="flex flex-col md:flex-row overflow-hidden bg-[#030b18]"
      style={{ height: 'calc(100vh - 56px)' }}
    >
      {/* Mobile tab bar */}
      <div className="md:hidden flex border-b border-[#0d1a2e] shrink-0 bg-[#08132a]">
        {(['main', 'profile'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={cn(
              'flex-1 py-2.5 font-jetbrains text-[11px] transition-colors cursor-pointer',
              mobileTab === tab
                ? 'text-[#c8d8f0] border-b-2 border-payne-gray'
                : 'text-[#4a7090] hover:text-[#6a8aaa]'
            )}
          >
            {tab === 'main' ? '~/ generate' : '// profile.json'}
          </button>
        ))}
      </div>

      {/* ══ LEFT: profile JSON ══ */}
      <div
        className={cn(
          'md:w-[360px] md:shrink-0 flex flex-col border-r border-[#0d1a2e]',
          mobileTab === 'profile' ? 'flex flex-1' : 'hidden md:flex'
        )}
      >
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#0d1a2e] shrink-0 bg-[#08132a]">
          <span className="font-jetbrains text-[11px] text-payne-gray">// profile.json</span>
          <span className="font-jetbrains text-[10px] text-[#2a4060]">
            {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {/* json body */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#030b18]">
          {entryCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <p className="font-jetbrains text-[11px] text-[#2a4060]">no profile data yet</p>
              <p className="font-jetbrains text-[10px] text-[#1a3050]">
                go to /profile to add your career info
              </p>
            </div>
          ) : (
            <pre
              className="font-jetbrains text-[10px] leading-relaxed text-[#4a7090] whitespace-pre-wrap wrap-break-word"
              dangerouslySetInnerHTML={{ __html: highlightJson(jsonStr) }}
            />
          )}
        </div>
      </div>

      {/* ══ RIGHT: JD input or resume preview ══ */}
      <div
        className={cn(
          'flex-1 flex flex-col overflow-hidden min-w-0',
          mobileTab === 'profile' ? 'hidden md:flex' : 'flex'
        )}
      >
        {!result ? (
          /* ── input phase ── */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#0d1a2e] shrink-0 bg-[#08132a]">
              <div className="flex items-center gap-2 text-xs font-jetbrains">
                <span className="text-payne-gray">~/</span>
                <span className="text-[#c8d8f0]">auto-create</span>
              </div>
              {error && <span className="font-jetbrains text-[10px] text-[#ef4444]">{error}</span>}
            </div>

            {/* form */}
            <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-8">
              <div className="w-full max-w-2xl flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <span className="font-jetbrains text-[11px] text-payne-gray tracking-widest">
                    // job description
                  </span>
                  <p className="font-jetbrains text-[10px] text-[#2a4060]">
                    paste the full job posting — claude will pick and rewrite your entries to match
                  </p>
                </div>

                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  rows={16}
                  placeholder="Paste the job description here..."
                  className="w-full bg-[#060e20] border border-[#1a3050] rounded-xl p-4 text-xs text-[#c8d8f0] placeholder:text-[#2a4060] focus:outline-none focus:border-payne-gray resize-none leading-relaxed font-jetbrains transition-colors"
                />

                {/* guidelines selector */}
                <div className="flex flex-col gap-2">
                  <span className="font-jetbrains text-[10px] text-[#2a4060]">
                    // guidelines — select which advice to apply
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {GUIDELINES.map((g) => {
                      const active = selectedGuidelines.includes(g.id)
                      return (
                        <button
                          key={g.id}
                          onClick={() =>
                            setSelectedGuidelines((prev) =>
                              active ? prev.filter((id) => id !== g.id) : [...prev, g.id]
                            )
                          }
                          title={g.description}
                          className={cn(
                            'font-jetbrains text-[10px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer',
                            active
                              ? 'bg-[#0d1a2e] border-[#2a4f70] text-[#6ea8d0]'
                              : 'bg-transparent border-[#0d1a2e] text-[#2a4060] hover:border-[#1a3050] hover:text-[#3a6080]'
                          )}
                        >
                          {active ? '✓ ' : ''}
                          {g.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <PillBtn
                    variant={jd.trim() && !generating && entryCount > 0 ? 'accent' : 'default'}
                    onClick={
                      !jd.trim() || generating || entryCount === 0 ? undefined : handleGenerate
                    }
                  >
                    {generating ? (
                      <>
                        <Loader2 size={11} className="animate-spin" />
                        generating...
                      </>
                    ) : (
                      <>
                        <Wand2 size={11} />
                        generate resume
                      </>
                    )}
                  </PillBtn>

                  {entryCount === 0 && (
                    <span className="font-jetbrains text-[10px] text-[#2a4060]">
                      add profile data first
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── preview phase ── */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#0d1a2e] shrink-0 bg-[#08132a]">
              <div className="flex items-center gap-2 text-xs font-jetbrains">
                <span className="text-payne-gray">~/</span>
                <span className="text-[#c8d8f0]">auto-create</span>
                <span className="text-payne-gray">/</span>
                <span className="text-[#7ec8a0]">generated</span>
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse ml-1"
                  title="live"
                />
                <span className="font-jetbrains text-[11px] ml-1 text-[#4a7090]">
                  {pageCount} {pageCount === 1 ? 'page' : 'pages'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <PillBtn
                  variant="default"
                  onClick={() => {
                    setResult(null)
                    setError(null)
                  }}
                >
                  <RotateCcw size={11} /> regenerate
                </PillBtn>
                <DropdownBtn label="export" icon={<Download size={11} />} align="right">
                  <DropItem onClick={handleExportTex}>
                    <FileText size={12} className="text-payne-gray" /> download .tex
                  </DropItem>
                  <DropItem onClick={handleExportMd}>
                    <FileText size={12} className="text-payne-gray" /> download .md
                  </DropItem>
                </DropdownBtn>
              </div>
            </div>

            {/* resume pages */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#030b18]">
              <div
                className={cn(
                  'flex flex-col items-center gap-6 max-w-[820px] mx-auto pb-6',
                  generating && 'opacity-50 pointer-events-none'
                )}
              >
                {Array.from({ length: pageCount }, (_, i) => (
                  <div
                    key={i}
                    className="w-full shadow-2xl rounded shrink-0 bg-white"
                    style={{ height: PAGE_H }}
                  >
                    {i > 0 && <div style={{ height: marginPx }} />}
                    <div
                      style={{
                        height: i === 0 ? marginPx + contentPerPage : contentPerPage,
                        overflow: 'hidden',
                      }}
                    >
                      <iframe
                        ref={i === 0 ? iframeRef : undefined}
                        srcDoc={resumeHtml}
                        title={`Resume Page ${i + 1}`}
                        sandbox="allow-scripts allow-same-origin"
                        className="w-full border-0 overflow-hidden bg-white block"
                        style={{
                          height: Math.max(contentHeight || contentPerPage, contentPerPage),
                          transform: `translateY(-${i === 0 ? 0 : marginPx + i * contentPerPage}px)`,
                          marginBottom: `-${i === 0 ? 0 : marginPx + i * contentPerPage}px`,
                        }}
                      />
                    </div>
                    <div style={{ height: marginPx }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
