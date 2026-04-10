import type { GuidelinePack } from '.'

const studentForum: GuidelinePack = {
  id: 'student-forum',
  label: "Jake's Resume / Student Forum",
  description: "Resume advice from Jake's Resume template community and CS student forums (ATS-first, single-column, clean formatting)",
  rules: `═══ JAKE'S RESUME / STUDENT FORUM GUIDELINES ═══

Formatting conventions (apply to bullet writing and content decisions):
- Keep to a single page for candidates with fewer than 10 years of experience.
- Use a clean, single-column layout — no tables, no columns, no headers/footers with personal info buried in them.
- Section order: Contact → Education → Experience → Projects → Skills (adjust if the role values research/leadership).

Bullet formula — every bullet must follow X-Y-Z:
  "Accomplished [X] as measured by [Y], by doing [Z]"
  Example: "Reduced API response time by 40% (p95) by introducing Redis caching and query batching"
- X = the result or achievement
- Y = the measurable impact (number, %, user count, time, cost)
- Z = the specific action taken (the how)
- If you cannot state Y, at least state X and Z clearly. A bullet with no result is better than a fabricated metric.

Bullet quality rules:
- Avoid "responsible for" and "worked on" — start with a strong past-tense verb.
- One bullet, one idea. If a bullet has "and" joining two actions, split it.
- Aim for 3–5 bullets per experience entry. 2 is acceptable, 6+ dilutes impact.
- Each bullet should be 1–2 lines max (aim for ~80–120 characters).
- Do NOT start two consecutive bullets with the same verb.

ATS optimization:
- Mirror exact keywords from the job description in bullet text and skills. ATS systems do keyword matching before any human reads the resume.
- Spell out acronyms on first use if the JD uses the full form (e.g., "Kubernetes (K8s)" if the JD says Kubernetes).
- Use standard section titles: "Experience" not "Work History", "Education" not "Academics".

Skills section:
- Format: "Category: item1, item2, item3" — short and scannable.
- Do not repeat skills that appear in bullet text — the section is for quick scanning, not repetition.
- Order categories so the most relevant to the JD come first.

Projects section:
- Every project line should have: name | tech stack | (optional) date
- Bullets for projects follow the same X-Y-Z rule — state what it does, what you built, and why it matters.
- Include a GitHub link or deployment URL if available (handled by portfolio/github contact fields).`,
}

export default studentForum
