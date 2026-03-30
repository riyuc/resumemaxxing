interface MikuLogoProps {
  size?: number
  className?: string
}

const MikuLogo = ({ size = 42, className }: MikuLogoProps) => {
  return (
    <picture>
      <source
        width={size}
        height={size}
        srcSet="/miku100.webp"
        className={className}
        type="image/webp"
      ></source>
      <img width={size} height={size} src="/miku100.webp"></img>
    </picture>
  )
}

export default MikuLogo
