import Link from 'next/link'

export default function Header() {
  return (
    <header className="fixed left-4 right-4 top-4 z-50">
      <div className="mx-auto max-w-[1400px] rounded-full bg-white px-6 py-3 shadow-[0_8px_16px_rgba(0,0,0,0.2),_0_2px_4px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-semibold text-neutral">Beamô</Link>
          <nav className="hidden items-center gap-10 md:flex">
            <Link href="/offres" className="text-neutral hover:text-primary">Offres</Link>
            <Link href="#" className="text-neutral hover:text-primary">Histoire</Link>
            <Link href="#" className="text-neutral hover:text-primary">Ressources</Link>
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
