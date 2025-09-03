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
    <header className="fixed left-4 right-4 top-4 z-50">
      <div className="mx-auto max-w-[1400px] rounded-full bg-white px-6 py-3 shadow-[0_8px_16px_rgba(0,0,0,0.2),_0_2px_4px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-semibold text-neutral">Beamô</Link>
          <nav className="relative hidden items-center gap-10 md:flex">
            <Link href="/offres" className="text-neutral hover:text-primary">Offres</Link>
            <Link href="#" className="text-neutral hover:text-primary">Histoire</Link>
            <div className="relative">
              <button
                ref={btnRef}
                onClick={() => setOpen((v) => !v)}
                className="text-neutral hover:text-primary"
                aria-haspopup="menu"
                aria-expanded={open}
              >
                Ressources
              </button>
              {open && (
                <div
                  ref={menuRef}
                  role="menu"
                  className="absolute right-0 mt-3 w-56 rounded-2xl border border-black/10 bg-white p-2 shadow-lg"
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
            <Link href="#" className="btn btn-extranet">Extranet</Link>
            <Link href="/ressources/contact" className="btn">Nous Contacter</Link>
          </div>
        </div>
      </div>
    </header>
  )
}
