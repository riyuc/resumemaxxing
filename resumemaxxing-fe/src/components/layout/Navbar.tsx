import { useState } from 'react'
import { NavLink, Link } from 'react-router'
import { Menu, X } from 'lucide-react'
import MikuLogo from '@/components/icons/MikuLogo'
import BlurredButton from '@/components/ui/blurred-button'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'manifesto', href: '/manifesto' },
  { label: 'profile', href: '/profile' },
  { label: 'create', href: '/create' },
  { label: 'auto-create', href: '/auto-create' },
]

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="w-full sticky top-0 z-50 border-b border-[#0d1a2e] bg-[#030b18]/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo + wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group"
          onClick={() => setMobileOpen(false)}
        >
          <MikuLogo size={42} />
          <span className="font-jetbrains text-sm font-semibold text-[#c8d8f0] group-hover:text-white transition-colors tracking-tight">
            i love resumemaxxing
          </span>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-1.5 rounded-md text-xs font-jetbrains transition-colors',
                    isActive
                      ? 'text-[#c8d8f0] bg-[#0d1928]'
                      : 'text-[#6a8aaa] hover:text-[#c8d8f0] hover:bg-[#0a1525]'
                  )
                }
              >
                ~/{item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-1.5">
          <BlurredButton href="/create" className="text-xs py-1.5 px-4">
            start building!
          </BlurredButton>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-[#6a8aaa] hover:text-[#c8d8f0] transition-colors p-1.5 cursor-pointer"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#0d1a2e] bg-[#030b18] px-4 py-3 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'block px-3 py-2.5 rounded-md text-sm font-jetbrains transition-colors',
                  isActive
                    ? 'text-[#c8d8f0] bg-[#0d1928]'
                    : 'text-[#6a8aaa] hover:text-[#c8d8f0] hover:bg-[#0a1525]'
                )
              }
            >
              ~/{item.label}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-[#0d1a2e] mt-1">
            <BlurredButton href="/create" className="text-sm py-2 px-5 block text-center">
              start building!
            </BlurredButton>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
