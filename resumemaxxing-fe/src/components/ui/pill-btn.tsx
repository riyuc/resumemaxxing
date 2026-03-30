import { cn } from '@/lib/utils'

const PillBtn = ({
  children,
  onClick,
  variant = 'default',
  className,
  type = 'button',
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'ghost' | 'danger' | 'accent'
  className?: string
  type?: 'button' | 'submit'
}) => (
  <button
    type={type}
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-jetbrains',
      'transition-all duration-150 cursor-pointer select-none',
      variant === 'default' &&
        'border border-payne-gray text-[#94a3b8] hover:border-[#6a8fa3] hover:text-porcelain',
      variant === 'accent' && 'bg-payne-gray text-white hover:bg-[#5a7d91]',
      variant === 'ghost' && 'text-payne-gray hover:text-porcelain',
      variant === 'danger' && 'text-[#ef4444]/60 hover:text-[#ef4444]',
      className
    )}
  >
    {children}
  </button>
)

export default PillBtn
