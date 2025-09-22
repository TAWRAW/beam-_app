import Link from 'next/link'
import { cities } from '@/lib/cities'

export default function Footer() {
  return (
    <footer className="bg-[#222] text-white">
      <div className="h-2 bg-primary" />
      <div className="mx-auto max-w-[1400px] px-6 py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <h3 className="text-primary relative mb-6 text-lg font-semibold after:absolute after:-bottom-2 after:left-0 after:h-[3px] after:w-10 after:bg-primary">Nos offres</h3>
            <ul className="space-y-3 text-[#ccc]">
              <li><a href="/offres#syndic" className="hover:text-primary">Syndic de copropriété</a></li>
              {cities.filter((c) => c.showInFooter !== false).map((c) => {
                const prep = c.displayPrep ?? c.prep ?? 'à'
                const name = c.displayName ?? c.name
                return (
                  <li key={c.slug}>
                    <Link href={`/ville/${c.slug}`} className="hover:text-primary">
                      {`Syndic de copropriété ${prep} ${name}`}
                    </Link>
                  </li>
                )
              })}
              <li><a href="/comment-changer-syndic" className="hover:text-primary">Comment changer de syndic</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-primary relative mb-6 text-lg font-semibold after:absolute after:-bottom-2 after:left-0 after:h-[3px] after:w-10 after:bg-primary">À propos</h3>
            <ul className="space-y-3 text-[#ccc]">
              <li><a href="/qui-sommes-nous" className="hover:text-primary">Notre histoire</a></li>
              <li><a href="#" className="hover:text-primary">Notre équipe</a></li>
              <li><a href="#" className="hover:text-primary">Notre approche</a></li>
              <li><a href="#" className="hover:text-primary">Actualités</a></li>
              <li><a href="#" className="hover:text-primary">Vitrine</a></li>
            </ul>
            <h4 className="text-primary relative mb-6 mt-8 text-lg font-semibold after:absolute after:-bottom-2 after:left-0 after:h-[3px] after:w-10 after:bg-primary">Pour les professionnels</h4>
            <ul className="space-y-3 text-[#ccc]">
              <li><a href="#" className="hover:text-primary">États des lieux</a></li>
              <li><a href="#" className="hover:text-primary">Représentation en AG</a></li>
              <li><a href="/ressources/contact" className="hover:text-primary">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-primary relative mb-6 text-lg font-semibold after:absolute after:-bottom-2 after:left-0 after:h-[3px] after:w-10 after:bg-primary">Contact</h3>
            <ul className="space-y-4 text-[#ccc]">
              <li className="flex items-start gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg><a href="tel:0775707099" className="hover:text-primary">07 75 70 70 99</a></li>
              <li className="flex items-start gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg><a href="mailto:tom.lemeille@beamo.fr" className="hover:text-primary">tom.lemeille@beamo.fr</a></li>
              <li className="flex items-start gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg><span>27950 Saint-Marcel</span></li>
              <li className="flex items-start gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><span>Sur rendez-vous</span></li>
            </ul>
          </div>

          <div>
            <div className="text-3xl font-bold text-primary">Beamô</div>
            <p className="mt-4 text-[#ccc]">Votre syndic de copropriété local et réactif, à l'écoute de vos besoins.</p>
            <div className="mt-6 flex gap-3">
              {['facebook','twitter','linkedin','instagram'].map((name) => {
                const href = name === 'linkedin'
                  ? 'https://www.linkedin.com/company/beam%C3%B4/posts/?feedView=all&viewAsMember=true'
                  : '#'
                return (
                  <a
                    key={name}
                    href={href}
                    target={name === 'linkedin' ? '_blank' : undefined}
                    rel={name === 'linkedin' ? 'noopener noreferrer' : undefined}
                    aria-label={name}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#333] text-white transition hover:-translate-y-1 hover:bg-primary hover:text-[#222]"
                  >
                    {name === 'linkedin' ? (
                      // LinkedIn logo SVG
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                        <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zM9 8h3.8v2.2h.05c.53-1 1.82-2.2 3.75-2.2 4 0 4.7 2.63 4.7 6.05V24h-4v-7.1c0-1.7-.03-3.88-2.37-3.88-2.38 0-2.75 1.85-2.75 3.76V24h-4V8z" />
                      </svg>
                    ) : (
                      <span className="sr-only">{name}</span>
                    )}
                  </a>
                )
              })}
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[#444] pt-6 text-sm text-[#999]">
          <p>© {new Date().getFullYear()} Beamô — Tous droits réservés.</p>
          <ul className="flex flex-wrap gap-6">
            <li><a className="hover:text-primary" href="#">Mentions légales</a></li>
            <li><a className="hover:text-primary" href="/politique-de-confidentialite">Politique de confidentialité</a></li>
            <li><a className="hover:text-primary" href="#">Conditions d'utilisation</a></li>
            <li><a className="hover:text-primary" href="#">Sources</a></li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
