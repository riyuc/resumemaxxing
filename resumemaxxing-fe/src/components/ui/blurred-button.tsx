import { cn } from '@/lib/utils'

interface BlurredButtonProps {
  children: React.ReactNode
  href?: string
  className?: string
  onClick?: () => void
}

const BlurredButton = ({ children, href, className, onClick }: BlurredButtonProps) => {
  const buttonClasses = cn(
    'px-4.5 py-2.5 rounded-full cursor-pointer',
    'bg-radial-[at_50%_75%] from-blue-500 via-sky-500 to-green-100',
    'shadow-lg shadow-sky-300',
    'duration-300 ease-out hover:scale-105',
    'text-white italic text-[14px]',
    className
  )

  if (href) {
    return (
      <a href={href} className={buttonClasses}>
        {children}
      </a>
    )
  }

  return (
    <button onClick={onClick} className={buttonClasses}>
      {children}
    </button>
  )
}

export default BlurredButton
