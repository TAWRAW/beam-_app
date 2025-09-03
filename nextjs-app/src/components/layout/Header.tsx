"use client";
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export default function Header() {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!open) return
      const t = e.target as Node
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return
      setOpen(false)
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [open])

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white shadow-[0_6px_12px_rgba(0,0,0,0.08)]">
      <div className="mx-auto max-w-[1400px] px-6 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-semibold text-neutral">Beamô</Link>
          <nav className="relative hidden items-center gap-10 md:flex">
            <Link href="/offres" className="text-neutral hover:text-primary">Offres</Link>
            <Link href="#" className="text-neutral hover:text-primary">Histoire</Link>
            <div className="relative">
              <button
                ref={btnRef}
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center gap-1 text-neutral hover:text-primary"
                aria-haspopup="menu"
                aria-expanded={open}
              >
                Ressources
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {open && (
                <div
                  ref={menuRef}
                  role="menu"
                  className="absolute left-0 top-full mt-3 w-56 rounded-2xl border border-black/10 bg-white p-2 shadow-lg"
                >
                  <Link
                    href="/ressources"
                    className="block rounded px-3 py-2 text-sm text-neutral hover:bg-primary/10"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                  >
                    Articles
                  </Link>
                  <Link
                    href="/ressources/application"
                    className="block rounded px-3 py-2 text-sm text-neutral hover:bg-primary/10"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                  >
                    Application
                  </Link>
                </div>
              )}
            </div>
          </nav>
          <div className="nav-buttons flex items-center gap-2">
            <Link href="#" className="btn btn-extranet text-sm md:text-base px-3 py-1.5 md:px-4 md:py-2">Extranet</Link>
            <Link href="/ressources/contact" className="btn text-sm md:text-base px-3 py-1.5 md:px-4 md:py-2">
              <span className="inline md:hidden">Contacter</span>
              <span className="hidden md:inline">Nous Contacter</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
