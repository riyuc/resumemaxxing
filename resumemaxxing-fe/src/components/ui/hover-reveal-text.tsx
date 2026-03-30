type HoverRevealTextProp = {
  text: string
  className?: string
}

const HoverRevealText = ({ text, className }: HoverRevealTextProp) => {
  return (
    <span
      className={
        `
      group/blur 
      blur-sm filter transition-all 
      duration-moderate-02 
      ease-productive-standard 
      focus-within:text-gray-11 
      focus-within:blur-none 
      hover:text-gray-11 
      hover:blur-none 
      focus:text-gray-11 
      focus:blur-none 
      text-gray-09
      text-sm
      italic
      font-satoshi
    ` + { className }
      }
    >
      {' '}
      {text}
    </span>
  )
}

export default HoverRevealText
