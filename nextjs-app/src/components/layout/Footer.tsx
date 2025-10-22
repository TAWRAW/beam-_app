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
              <li><a href="/pro/etat-des-lieux" className="hover:text-primary">États des lieux</a></li>
              <li><a href="#" className="hover:text-primary">Représentation en AG</a></li>
              <li><a href="/ressources/contact" className="hover:text-primary">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-primary relative mb-6 text-lg font-semibold after:absolute after:-bottom-2 after:left-0 after:h-[3px] after:w-10 after:bg-primary">Contact</h3>
            <ul className="space-y-4 text-[#ccc]">
              <li className="flex items-start gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg><a href="tel:0775707099" className="hover:text-primary">07 75 70 70 99</a></li>
              <li className="flex items-start gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg><a href="mailto:tom.lemeille@beamô.fr" className="hover:text-primary">tom.lemeille@beamô.fr</a></li>
              <li className="flex items-start gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg><span>27950 Saint-Marcel</span></li>
              <li className="flex items-start gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><span>Sur rendez-vous</span></li>
            </ul>
          </div>

          <div>
            <div className="text-3xl font-bold text-primary">Beamô</div>
            <p className="mt-4 text-[#ccc]">Votre syndic de copropriété local et réactif, à l'écoute de vos besoins.</p>
            <div className="mt-6 flex gap-3">
              {['facebook','linkedin','maps','apple-maps'].map((name) => {
                const href = name === 'linkedin'
                  ? 'https://www.linkedin.com/company/beam%C3%B4/posts/?feedView=all&viewAsMember=true'
                  : name === 'facebook'
                  ? 'https://www.facebook.com/profile.php?id=61582074458665&sk=about'
                  : name === 'maps'
                  ? 'https://maps.app.goo.gl/7ySUYESYdiaxkiNX8'
                  : name === 'apple-maps'
                  ? 'https://maps.apple/p/eA_sgZKxpLkI1Y'
                  : '#'
                const shouldOpenInNewTab = name === 'linkedin' || name === 'facebook' || name === 'maps' || name === 'apple-maps'
                return (
                  <a
                    key={name}
                    href={href}
                    target={shouldOpenInNewTab ? '_blank' : undefined}
                    rel={shouldOpenInNewTab ? 'noopener noreferrer' : undefined}
                    aria-label={name}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#333] text-white transition hover:-translate-y-1 hover:bg-primary hover:text-[#222]"
                  >
                    {name === 'linkedin' ? (
                      // LinkedIn logo SVG
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                        <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zM9 8h3.8v2.2h.05c.53-1 1.82-2.2 3.75-2.2 4 0 4.7 2.63 4.7 6.05V24h-4v-7.1c0-1.7-.03-3.88-2.37-3.88-2.38 0-2.75 1.85-2.75 3.76V24h-4V8z" />
                      </svg>
                    ) : name === 'facebook' ? (
                      // Facebook logo SVG
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    ) : name === 'maps' ? (
                      // Google Maps logo SVG
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                    ) : name === 'apple-maps' ? (
                      // Apple Maps logo SVG
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
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
            <li><a className="hover:text-primary" href="/mentions-legales">Mentions légales</a></li>
            <li><a className="hover:text-primary" href="/politique-de-confidentialite">Politique de confidentialité</a></li>
            <li><a className="hover:text-primary" href="/conditions-utilisation">Conditions d'utilisation</a></li>
            <li><a className="hover:text-primary" href="/sources">Sources</a></li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
