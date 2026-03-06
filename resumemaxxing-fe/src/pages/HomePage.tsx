import HeroSection from '@/components/layout/HeroSection'

const HomePage = () => {
  return (
    <div className="flex flex-col gap-12 mt-6">
        {/* Home Page */}
        <main className="max-w-7xl mx-auto px-8 flex-1 w-full">
          <HeroSection />
        </main>
        {/* Showcase */}
        <main className='w-2/3 min-h-[680px]'>
          {/* <Showcase */}
        </main>
    </div>
  )
}

export default HomePage