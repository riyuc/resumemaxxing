const EditableBullets = ({ bullets, onChange }: { bullets: string[]; onChange: (bs: string[]) => void }) => (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] text-payne-gray tracking-widest uppercase">bullets</span>
      <textarea
        value={bullets.join('\n')}
        onChange={e => onChange(e.target.value.split('\n'))}
        rows={Math.max(4, bullets.length + 1)}
        className="w-full bg-[#060e20] border border-[#1e3a5f] rounded px-3 py-2 text-xs text-porcelain placeholder:text-[#4a7090] focus:outline-none focus:border-payne-gray resize-y font-jetbrains leading-relaxed"
        placeholder={"each line is one bullet\n—\npress Enter to add a new bullet"}
      />
    </div>
  )

export default EditableBullets