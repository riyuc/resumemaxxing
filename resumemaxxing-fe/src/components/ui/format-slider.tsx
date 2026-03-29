import { cn } from '@/lib/utils'

export const FormatSlider = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (v: number) => void
}) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between items-baseline">
      <span className="text-[11px] text-[#8aaac8] font-jetbrains">{label}</span>
      <span className="text-[11px] text-[#c8d8f0] font-jetbrains tabular-nums">
        {value}
        {unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className={cn(
        'w-full h-1 rounded-full appearance-none cursor-pointer bg-[#1a3050] accent-payne-gray'
      )}
    />
  </div>
)
