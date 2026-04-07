import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ScanText, GraduationCap, Github, Menu, X } from 'lucide-react'

export default function Navbar() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { to: '/', label: 'Detector', icon: ScanText },
    { to: '/training', label: 'Training Mode', icon: GraduationCap },
  ]

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur shadow-sm border-b border-slate-100' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-bold text-slate-900">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-purple-600 rounded-lg flex items-center justify-center">
            <ScanText size={16} className="text-white" />
          </div>
          <span className="text-lg">AI<span className="gradient-text">Detector</span></span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === to
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
          <a
            href="https://github.com/AbhishekDondapati/ai-detector"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 btn-ghost text-sm"
          >
            <Github size={15} />
            GitHub
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          className="sm:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                location.pathname === to
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon size={15} /> {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
