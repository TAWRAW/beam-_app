"use client";
import Link from 'next/link'
import { useState } from 'react'

// Lightweight inline icons to avoid external vendor chunks
function IconHome(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5Z"/>
    </svg>
  )
}
function IconBuilding(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="8" width="7" height="13" rx="1"/>
      <path d="M6.5 6h0M6.5 10h0M6.5 14h0M6.5 18h0M17.5 11h0M17.5 15h0M17.5 19h0"/>
    </svg>
  )
}
function IconBook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M4 19a2 2 0 0 0 2 2h13"/><path d="M20 22V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v13"/>
      <path d="M6 18a2 2 0 0 1 2-2h12"/>
    </svg>
  )
}
function IconMenu(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M3 6h18M3 12h18M3 18h18"/>
    </svg>
  )
}

export default function MobileQuickNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Bottom quick nav - only phones/tablets */}
      <nav className="fixed inset-x-0 bottom-0 z-50 lg:hidden">
        <div className="mx-auto max-w-[1400px]">
          <div className="bg-white px-4 py-2 shadow-[0_-2px_8px_rgba(0,0,0,0.1)] border-t border-border"
            style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
          >
            <div className="grid grid-cols-4 items-center text-neutral">
              <Link href="/" className="flex flex-col items-center gap-1 py-1" aria-label="Accueil">
                <IconHome className="h-5 w-5" />
                <span className="text-[11px]">Accueil</span>
              </Link>
              <Link href="/offres" className="flex flex-col items-center gap-1 py-1" aria-label="Offres">
                <IconBuilding className="h-5 w-5" />
                <span className="text-[11px]">Offres</span>
              </Link>
              <Link href="/qui-sommes-nous" className="flex flex-col items-center gap-1 py-1" aria-label="Histoire">
                <IconBook className="h-5 w-5" />
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
                <IconMenu className="h-5 w-5" />
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
                <Link href="/apps" className="block rounded px-3 py-3 hover:bg-primary/10" onClick={() => setOpen(false)}>Application</Link>
                <Link href="/ressources/contact" className="block rounded px-3 py-3 hover:bg-primary/10" onClick={() => setOpen(false)}>Nous contacter</Link>
                <Link href="/en-cours" className="block rounded px-3 py-3 hover:bg-primary/10" onClick={() => setOpen(false)}>Extranet</Link>
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
