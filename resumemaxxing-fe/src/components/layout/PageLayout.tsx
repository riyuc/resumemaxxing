import { ReactNode } from 'react'

interface PageLayoutProps {
  children: ReactNode
  className?: string
}

/**
 * Reusable page layout component
 * Provides consistent spacing and max-width constraints
 * Can be customized per page if needed
 */
const PageLayout = ({ children, className = '' }: PageLayoutProps) => {
  return (
    <div className={`flex flex-col gap-12 mt-6 ${className}`}>
      {children}
    </div>
  )
}

export default PageLayout

