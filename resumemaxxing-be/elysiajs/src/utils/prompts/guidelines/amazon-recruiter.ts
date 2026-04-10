import type { GuidelinePack } from '.'

const amazonRecruiter: GuidelinePack = {
  id: 'amazon-recruiter',
  label: 'Amazon Recruiter',
  description: 'Advice distilled from an Amazon technical recruiter on what they look for in engineering resumes',
  rules: `═══ AMAZON RECRUITER GUIDELINES ═══

Education:
- Always include expected graduation date or graduation year — missing dates are a red flag.
- Include GPA only if it is 3.5 or above; omit it if lower (it hurts more than it helps).
- List 4–6 relevant coursework titles that directly map to the target role (e.g., "Distributed Systems, Operating Systems, Machine Learning" for a backend role). Do not list generic courses like "Intro to Programming".
- Place education near the top for new grads (0–2 years experience); move it below experience for candidates with 3+ years.

Skills:
- Group skills into clear categories (Languages, Frameworks, Tools, Cloud, Databases). Keep each category to a single concise line.
- Do NOT list soft skills (communication, teamwork) in the skills section — they belong in bullets if anywhere.
- Do NOT pad the skills section with tools the person only used once. Only list what they can be interviewed on.

Experience bullets:
- Quantify every bullet that implies scale: users impacted, latency reduced, throughput improved, cost saved, time to ship, team size. Use ranges if exact numbers are unknown (e.g., "~30% reduction").
- One bullet = one clear accomplishment. Avoid compound bullets joined by "and" — split them.
- Avoid project management fluff ("Collaborated with cross-functional teams to align stakeholders"). Name the outcome.

Projects:
- Each project should state: what it does, the tech stack used, and one concrete outcome or scale indicator.
- Do not list projects that have no code or no measurable output.
- Hackathon projects are valuable — include placement/award if won.`,
}

export default amazonRecruiter
