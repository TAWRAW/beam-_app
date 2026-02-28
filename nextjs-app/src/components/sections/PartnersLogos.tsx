'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const PARTNERS = [
  {
    src: '/logos/logo-caisse-epargne-normandie.png',
    alt: "Caisse d'Épargne Normandie",
    href: 'https://www.caisse-epargne.fr/normandie/',
  },
  {
    src: '/logos/logo-bge-normandie.png',
    alt: 'BGE Normandie',
    href: 'https://www.bgenormandie.fr/',
    className: 'scale-110', // Agrandit légèrement ce logo
  },
  {
    src: '/logos/logo-estale.png',
    alt: 'Estale',
    href: 'https://www.estale.fr/',
    className: 'scale-75', // Réduit la taille spécifique de ce logo
  },
  {
    src: '/logos/logo-les-audacieux-normands.jpg',
    alt: 'Les Audacieux Normands',
    href: 'https://audacieuxnormands.fr/',
  },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function PartnersLogos() {
  const [partners, setPartners] = useState(PARTNERS)

  useEffect(() => {
    setPartners(shuffle([...PARTNERS]))
  }, [])

  return (
    <section className="border-b border-gray-100 bg-white py-12">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-12 md:justify-around md:gap-8 px-6">
        {partners.map((partner) => (
          <a
            key={partner.src}
            href={partner.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={partner.alt}
            className="flex h-20 w-32 items-center justify-center md:h-24 md:w-48 lg:w-56"
          >
            <Image
              src={partner.src}
              alt={partner.alt}
              className={`max-h-16 w-full object-contain grayscale opacity-60 transition-all duration-300 hover:grayscale-0 hover:opacity-100 md:max-h-20 ${partner.className || ''}`}
              width={224}
              height={80}
            />
          </a>
        ))}
      </div>
    </section>
  )
}
