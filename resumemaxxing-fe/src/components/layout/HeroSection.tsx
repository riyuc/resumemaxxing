import { motion } from 'motion/react'
import { Link } from 'react-router'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: 'easeOut' as const },
})

const HeroSection = () => {
  return (
    <div className="flex flex-col gap-10 max-w-2xl font-jetbrains">

      {/* Headline */}
      <div className="flex flex-col gap-1">
        <motion.div {...fade(0)} className="flex items-center gap-2 text-[#4a7090] text-xs mb-3">
          <span>$</span>
          <span className="text-[#c8d8f0]">AI god pls --help --me</span>
        </motion.div>

        <motion.h1 {...fade(0.1)} className="text-3xl md:text-4xl font-bold text-[#e8f0fc] tracking-tight leading-tight">
          Resume-maxxing,
        </motion.h1>
        <motion.p {...fade(0.2)} className="text-lg text-[#6a8aaa] italic tracking-tight">
          &nbsp;&nbsp;cause it's tough out there...
        </motion.p>
      </div>

      {/* Content block */}
      <motion.div {...fade(0.35)} className="flex flex-col gap-6 text-sm">

        <div className="flex flex-col gap-2">
          <p className="text-[#4a7090] text-xs"> &gt;&gt; why I built this:</p>
          <p className="text-[#c8d8f0]">
            tl;dr — all the other resume builders sucked
            <span className="blur-sm hover:blur-none focus:blur-none transition-all duration-300 ml-3 text-[#6a8aaa] italic cursor-default">
              (yeah I said it)
            </span>
          </p>
          <div className="flex flex-col gap-1.5 pl-4 border-l border-[#1a3050] text-[#8aaac8]">
            <p>— they all looked like someone prompted once and push it out there</p>
            <p>— wtf am I paying for? <span className="blur-sm hover:blur-none focus:blur-none transition-all duration-300 ml-1 text-[#6a8aaa] italic cursor-default">
              (not everything has to be a saas...)
            </span></p>
            <p>— why can't I just set up once use it forever?</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[#4a7090] text-xs">&gt;&gt; I only do 3 things in recruiting season:</p>
          <div className="flex flex-col gap-3 pl-4 border-l border-[#1a3050] text-[#8aaac8]">
            <div className="flex flex-col gap-1.5">
              <p className="text-[#c8d8f0]">1&#41;  I have a resume,</p>
              <p className="pl-6">— and I want to tweak it to fit a specific JD
                <span className="blur-sm hover:blur-none focus:blur-none transition-all duration-300 ml-1 text-[#6a8aaa] italic cursor-default">
                (some has it but they sucked...)
                </span>
              </p>
              <p className="pl-6">— or try a completely different layout</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-[#c8d8f0]">2&#41;  I want to experiment,</p>
              <p className="pl-6">— when I see interesting resume advice online</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-[#c8d8f0]">3&#41;  I don't want to start from scratch every time</p>
            </div>
          </div>
        </div>

      </motion.div>

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
