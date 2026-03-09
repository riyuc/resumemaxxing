import { motion } from 'motion/react'
import { Link } from 'react-router'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: 'easeOut' as const },
})

const HeroSection = () => {
  return (
    <div className="flex flex-col gap-8 max-w-2xl font-jetbrains">

      {/* Command + response */}
      <motion.div {...fade(0)} className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          <span className="text-[#4a7090]">$</span>
          <span className="text-[#6a8aaa]">AI</span>
          <span className="text-[#8aaac8]">god</span>
          <span className="text-[#c8d8f0] font-bold">pls</span>
          <span className="text-payne-gray">--help</span>
          <span className="text-payne-gray">--me</span>
        </div>
        <div className="flex flex-col gap-0.5 pl-4 border-l border-[#1a3050] text-xs">
          <p className="text-[#4a7090]">&gt; prayer received!</p>
        </div>
      </motion.div>

      {/* Title */}
      <motion.div {...fade(0.25)} className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold text-[#e8f0fc] tracking-widest uppercase">
          Resume-maxxing
        </h1>
        <p className="text-xs text-[#4a7090] tracking-wider">
          // cause it's tough out there
        </p>
      </motion.div>

      <motion.div {...fade(0.3)} className="border-t border-[#1a3050]" />

      {/* Capabilities */}
      <motion.div {...fade(0.4)} className="flex flex-col gap-3">
        <p className="text-[#4a7090] text-xs tracking-widest">WHAT IT DOES</p>
        <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-sm">
          <span className="text-payne-gray">tailor</span>
          <span className="text-[#8aaac8]">fit your resume to any JD, in seconds</span>
          <span className="text-payne-gray">layouts</span>
          <span className="text-[#8aaac8]">easily adjust formatting like it's google docs.</span>
          <span className="text-payne-gray">memory</span>
          <span className="text-[#8aaac8]">
            set up once — reuse forever, no subscriptions
            <span className="blur-sm hover:blur-none focus:blur-none transition-all duration-300 ml-1 text-[#6a8aaa] italic cursor-default">
              (not everything has to be a saas...)
            </span> 
          </span>
          <span className="text-payne-gray">experiment</span>
          <span className="text-[#8aaac8]">test resume advice from the internet instantly</span>
        </div>
      </motion.div>

      <motion.div {...fade(0.45)} className="border-t border-[#1a3050]" />

      {/* CTAs */}
      <motion.div {...fade(0.55)} className="flex items-center gap-3 flex-wrap">
        <Link
          to="/profile"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-payne-gray text-sm text-[#c8d8f0] hover:bg-[#0d1928] hover:border-[#6a8aaa] transition-all font-jetbrains"
        >
          <span className="text-payne-gray">›</span> set up profile
        </Link>
        <Link
          to="/create"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-payne-gray text-sm text-white hover:bg-[#5a7d91] transition-all font-jetbrains"
        >
          <span>›</span> build my resume
        </Link>
      </motion.div>

      {/* Terminal prompt */}
      <motion.div {...fade(0.7)} className="flex items-center gap-2 text-xs text-[#2a4a6a]">
        <span>$</span>
        <span className="inline-block w-2 h-3.5 bg-[#2a4a6a] animate-pulse rounded-sm" />
      </motion.div>

    </div>
  )
}

export default HeroSection
