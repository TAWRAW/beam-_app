"use client";
import Link from 'next/link'
import { Home, Building2, BookOpen, Menu } from 'lucide-react'
import { useState } from 'react'

export default function MobileQuickNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Bottom quick nav - only phones/tablets */}
      <nav className="fixed inset-x-0 bottom-2 z-50 lg:hidden">
        <div className="mx-auto max-w-[1400px] px-3">
          <div className="rounded-full bg-white/95 px-4 py-2 shadow-[0_8px_16px_rgba(0,0,0,0.2),_0_2px_4px_rgba(0,0,0,0.1)] backdrop-blur supports-[backdrop-filter]:bg-white/80"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) * 1)' }}
          >
            <div className="grid grid-cols-4 items-center text-neutral">
              <Link href="/" className="flex flex-col items-center gap-1 py-1" aria-label="Accueil">
                <Home className="h-5 w-5" />
                <span className="text-[11px]">Accueil</span>
              </Link>
              <Link href="/offres" className="flex flex-col items-center gap-1 py-1" aria-label="Offres">
                <Building2 className="h-5 w-5" />
                <span className="text-[11px]">Offres</span>
              </Link>
              <Link href="#" className="flex flex-col items-center gap-1 py-1" aria-label="Histoire">
                <BookOpen className="h-5 w-5" />
                <span className="text-[11px]">Histoire</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex flex-col items-center gap-1 py-1"
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-label="Plus"
              >
                <Menu className="h-5 w-5" />
                <span className="text-[11px]">Plus</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Simple bottom sheet menu */}
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1400px] px-3">
            <div className="rounded-t-2xl border border-black/10 bg-white p-4 shadow-xl">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-300" />
              <div className="grid gap-2">
                <Link href="/ressources/contact" className="block rounded px-3 py-3 hover:bg-primary/10" onClick={() => setOpen(false)}>Nous contacter</Link>
                <Link href="#" className="block rounded px-3 py-3 hover:bg-primary/10" onClick={() => setOpen(false)}>Extranet</Link>
                <Link href="/ressources" className="block rounded px-3 py-3 hover:bg-primary/10" onClick={() => setOpen(false)}>Ressources</Link>
              </div>
              <div className="mt-3 text-right">
                <button className="btn btn-extranet" onClick={() => setOpen(false)}>Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

