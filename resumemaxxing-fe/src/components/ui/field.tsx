export const Field = ({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-[9px] text-payne-gray tracking-widest uppercase font-jetbrains">
      {label}
    </span>
    {multiline ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="bg-[#020810] border border-[#1a3050] rounded p-2 text-[11px] text-[#c8d8f0] placeholder:text-[#2a4060] focus:outline-none focus:border-[#456677] resize-none font-jetbrains leading-relaxed"
      />
    ) : (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-[#020810] border border-[#1a3050] rounded p-2 text-[11px] text-[#c8d8f0] placeholder:text-[#2a4060] focus:outline-none focus:border-[#456677] font-jetbrains"
      />
    )}
  </div>
)
