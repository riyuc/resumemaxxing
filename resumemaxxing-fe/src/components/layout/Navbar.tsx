import { NavLink, Link } from 'react-router'
import MikuLogo from '@/components/icons/MikuLogo'
import BlurredButton from '@/components/ui/blurred-button'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'manifesto', href: '/manifesto' },
  { label: 'features',  href: '/#features' },
  { label: 'ats?',      href: '/#ats' },
  { label: 'profile',   href: '/profile' },
  { label: 'create',    href: '/create' },
]

const Navbar = () => {
  return (
    <nav className="w-full sticky top-0 z-50 border-b border-[#0d1a2e] bg-[#030b18]/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Logo + wordmark */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <MikuLogo size={42} />
          <span className="font-jetbrains text-sm font-semibold text-[#c8d8f0] group-hover:text-white transition-colors tracking-tight">
            i love resumemaxxing
          </span>
        </Link>

        {/* Nav links */}
        <ul className="flex items-center gap-1">
          {NAV_ITEMS.map(item => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-1.5 rounded-md text-xs font-jetbrains transition-colors',
                    isActive
                      ? 'text-[#c8d8f0] bg-[#0d1928]'
                      : 'text-[#6a8aaa] hover:text-[#c8d8f0] hover:bg-[#0a1525]',
                  )
                }
              >
                ~/{item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Auth */}
        <div className="flex items-center gap-1.5">
          {/* <Link
            to="/login"
            className="px-3 py-1.5 text-xs font-jetbrains text-[#6a8aaa] hover:text-[#c8d8f0] transition-colors rounded-md hover:bg-[#0a1525]"
          >
            log in
          </Link> */}
          <BlurredButton href="/create" className="text-xs py-1.5 px-4">
            start building!
          </BlurredButton>
        </div>

      </div>
    </nav>
  )
}

export default Navbar
