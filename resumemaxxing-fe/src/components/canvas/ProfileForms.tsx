import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Field } from '@/components/ui/field'
import PillBtn from '@/components/ui/pill-btn'
import EditableBullets from '@/components/ui/editable-bullets'
import type {
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  SkillsEntry,
  CertificationEntry,
  AwardEntry,
} from '@/types/profile'

// ─── education ────────────────────────────────────────────────────────────────

export function EducationForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<EducationEntry>
  onSave: (e: Omit<EducationEntry, 'id'>) => void
  onCancel: () => void
}) {
  const [school, setSchool] = useState(initial?.school ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [degree, setDegree] = useState(initial?.degree ?? '')
  const [dates, setDates] = useState(initial?.dates ?? '')
  const [coursework, setCw] = useState(initial?.coursework ?? '')
  const [rawText, setRaw] = useState(initial?.rawText ?? '')
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2">
        <Field
          label="school"
          value={school}
          onChange={setSchool}
          placeholder="Concordia University"
        />
        <Field
          label="location"
          value={location}
          onChange={setLocation}
          placeholder="Montreal, QC"
        />
        <Field
          label="degree"
          value={degree}
          onChange={setDegree}
          placeholder="B.Sc. Computer Science"
        />
        <Field label="dates" value={dates} onChange={setDates} placeholder="2022 – 2026" />
      </div>
      <Field
        label="coursework"
        value={coursework}
        onChange={setCw}
        placeholder="OS, Algorithms, AI..."
      />
      <Field
        label="// tell us about your time here"
        value={rawText}
        onChange={setRaw}
        placeholder="clubs, achievements, what you learned..."
        multiline
      />
      <div className="flex gap-1.5 pt-1">
        <PillBtn
          variant="accent"
          onClick={() => onSave({ school, location, degree, dates, coursework, rawText })}
        >
          <Check size={11} /> save
        </PillBtn>
        <PillBtn variant="ghost" onClick={onCancel}>
          <X size={11} /> cancel
        </PillBtn>
      </div>
    </div>
  )
}

// ─── experience ───────────────────────────────────────────────────────────────

export function ExperienceForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<ExperienceEntry>
  onSave: (e: Omit<ExperienceEntry, 'id'>) => void
  onCancel: () => void
}) {
  const [company, setCompany] = useState(initial?.company ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [role, setRole] = useState(initial?.role ?? '')
  const [dates, setDates] = useState(initial?.dates ?? '')
  const [bullets, setBullets] = useState(initial?.bullets ?? [])
  const [rawText, setRaw] = useState(initial?.rawText ?? '')
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2">
        <Field label="company" value={company} onChange={setCompany} placeholder="Shopify" />
        <Field label="location" value={location} onChange={setLocation} placeholder="Toronto, ON" />
        <Field
          label="role"
          value={role}
          onChange={setRole}
          placeholder="Software Engineering Intern"
        />
        <Field label="dates" value={dates} onChange={setDates} placeholder="May – Dec 2025" />
      </div>
      <EditableBullets bullets={bullets} onChange={setBullets} />
      <Field
        label="// what did you do there?"
        value={rawText}
        onChange={setRaw}
        placeholder="tech used, impact, what you shipped..."
        multiline
      />
      <div className="flex gap-1.5 pt-1">
        <PillBtn
          variant="accent"
          onClick={() => onSave({ company, location, role, dates, bullets, rawText })}
        >
          <Check size={11} /> save
        </PillBtn>
        <PillBtn variant="ghost" onClick={onCancel}>
          <X size={11} /> cancel
        </PillBtn>
      </div>
    </div>
  )
}

// ─── project ──────────────────────────────────────────────────────────────────

export function ProjectForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<ProjectEntry>
  onSave: (e: Omit<ProjectEntry, 'id'>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [tech, setTech] = useState(initial?.techStack ?? '')
  const [dates, setDates] = useState(initial?.dates ?? '')
  const [bullets, setBullets] = useState(initial?.bullets ?? [])
  const [rawText, setRaw] = useState(initial?.rawText ?? '')
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2">
        <Field
          label="project name"
          value={name}
          onChange={setName}
          placeholder="AI Resume Builder"
        />
        <Field label="dates" value={dates} onChange={setDates} placeholder="Hackathon, 2025" />
      </div>
      <Field
        label="tech stack"
        value={tech}
        onChange={setTech}
        placeholder="Python, React, Anthropic API..."
      />
      <EditableBullets bullets={bullets} onChange={setBullets} />
      <Field
        label="// describe it casually"
        value={rawText}
        onChange={setRaw}
        placeholder="what it does, how you built it, results..."
        multiline
      />
      <div className="flex gap-1.5 pt-1">
        <PillBtn
          variant="accent"
          onClick={() => onSave({ name, techStack: tech, dates, bullets, rawText })}
        >
          <Check size={11} /> save
        </PillBtn>
        <PillBtn variant="ghost" onClick={onCancel}>
          <X size={11} /> cancel
        </PillBtn>
      </div>
    </div>
  )
}

// ─── skills ───────────────────────────────────────────────────────────────────

export function SkillsForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<SkillsEntry>
  onSave: (e: Omit<SkillsEntry, 'id'>) => void
  onCancel: () => void
}) {
  const [category, setCat] = useState(initial?.category ?? '')
  const [techs, setTechs] = useState(initial?.technologies ?? '')
  return (
    <div className="flex flex-col gap-2.5">
      <Field
        label="category"
        value={category}
        onChange={setCat}
        placeholder="Languages, Frameworks, Cloud..."
      />
      <Field
        label="technologies"
        value={techs}
        onChange={setTechs}
        placeholder="Python, TypeScript, Go..."
      />
      <div className="flex gap-1.5 pt-1">
        <PillBtn variant="accent" onClick={() => onSave({ category, technologies: techs })}>
          <Check size={11} /> save
        </PillBtn>
        <PillBtn variant="ghost" onClick={onCancel}>
          <X size={11} /> cancel
        </PillBtn>
      </div>
    </div>
  )
}

// ─── certification ────────────────────────────────────────────────────────────

export function CertificationForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<CertificationEntry>
  onSave: (e: Omit<CertificationEntry, 'id'>) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [issuer, setIssuer] = useState(initial?.issuer ?? '')
  const [date, setDate] = useState(initial?.date ?? '')
  const [rawText, setRaw] = useState(initial?.rawText ?? '')
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2">
        <Field
          label="title"
          value={title}
          onChange={setTitle}
          placeholder="AWS Certified Developer"
        />
        <Field
          label="issued by"
          value={issuer}
          onChange={setIssuer}
          placeholder="Amazon Web Services"
        />
        <Field label="date" value={date} onChange={setDate} placeholder="2024" />
      </div>
      <Field
        label="notes"
        value={rawText}
        onChange={setRaw}
        placeholder="why you got it, what you learned..."
        multiline
      />
      <div className="flex gap-1.5 pt-1">
        <PillBtn variant="accent" onClick={() => onSave({ title, issuer, date, rawText })}>
          <Check size={11} /> save
        </PillBtn>
        <PillBtn variant="ghost" onClick={onCancel}>
          <X size={11} /> cancel
        </PillBtn>
      </div>
    </div>
  )
}

// ─── award ────────────────────────────────────────────────────────────────────

export function AwardForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<AwardEntry>
  onSave: (e: Omit<AwardEntry, 'id'>) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [issuer, setIssuer] = useState(initial?.issuer ?? '')
  const [date, setDate] = useState(initial?.date ?? '')
  const [desc, setDesc] = useState(initial?.description ?? '')
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2">
        <Field label="award" value={title} onChange={setTitle} placeholder="Dean's List" />
        <Field
          label="issued by"
          value={issuer}
          onChange={setIssuer}
          placeholder="Concordia University"
        />
        <Field label="date" value={date} onChange={setDate} placeholder="Fall 2024" />
      </div>
      <Field
        label="description"
        value={desc}
        onChange={setDesc}
        placeholder="what it was for, why it mattered..."
        multiline
      />
      <div className="flex gap-1.5 pt-1">
        <PillBtn
          variant="accent"
          onClick={() => onSave({ title, issuer, date, description: desc })}
        >
          <Check size={11} /> save
        </PillBtn>
        <PillBtn variant="ghost" onClick={onCancel}>
          <X size={11} /> cancel
        </PillBtn>
      </div>
    </div>
  )
}
