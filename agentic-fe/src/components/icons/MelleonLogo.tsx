interface MelleonLogoProps {
  size?: number
  className?: string
}

const MelleonLogo = ({ size = 32, className }: MelleonLogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Terminal window */}
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="6.5" fill="#060e20" stroke="#456677" strokeWidth="1.2" />

      {/* Title bar dots */}
      <circle cx="7"    cy="9" r="1.5" fill="#456677" fillOpacity="0.75" />
      <circle cx="11.8" cy="9" r="1.5" fill="#456677" fillOpacity="0.45" />
      <circle cx="16.6" cy="9" r="1.5" fill="#456677" fillOpacity="0.22" />

      {/* Separator */}
      <line x1="1" y1="13.5" x2="31" y2="13.5" stroke="#1a3050" strokeWidth="0.9" />

      {/* > chevron prompt */}
      <polyline
        points="7,18 12,21 7,24"
        fill="none"
        stroke="#c8d8f0"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* _ cursor block */}
      <rect x="15" y="19.5" width="10" height="3" rx="0.8" fill="#456677" />
    </svg>
  )
}

export default MelleonLogo
