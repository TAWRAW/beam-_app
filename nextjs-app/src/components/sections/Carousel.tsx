import Link from 'next/link'
import { Button } from '@/components/ui/button'

type CarouselProps = {
  title?: string
  subtitle?: string
  cityLabel?: string
  cityPrep?: string
  showCta?: boolean
}

export default function Carousel({ title, subtitle, cityLabel, cityPrep, showCta = false }: CarouselProps) {
  const hasCity = Boolean(cityLabel)
  return (
    // Cancel the global header spacer so the hero starts at the very top (mobile + desktop)
    <section className="relative -mt-20 md:-mt-24">
      {/* Full-viewport hero on desktop, comfortable height on mobile */}
      <div className="relative w-full overflow-hidden hero-viewport">
        <video
          muted
          loop
          playsInline
          autoPlay
          id="background-video"
          className="absolute inset-0 h-full w-full object-cover blur-sm"
        >
          <source src="/outils/images/video_drone.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
        {/* Centered copy; larger, responsive typography */}
        <div className="relative z-10 mx-auto flex h-full max-w-5xl items-center px-4 sm:px-6 text-white">
          <div>
            <h2 className="drop-shadow text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold leading-tight break-words">
              {hasCity ? (
                <>
                  <span className="text-primary">Syndic {cityPrep ?? 'à'} {cityLabel}</span> : votre syndic de copropriété local et efficace.
                </>
              ) : (
                <>
                  {title ?? (
                    <><span className="text-primary">Syndic de copropriété</span> local et efficace.</>
                  )}
                </>
              )}
            </h2>
            <h2 className="mt-4 drop-shadow text-xl sm:text-2xl md:text-4xl lg:text-5xl font-semibold">{subtitle ?? 'Une réponse en 48h garantie.'}</h2>
          </div>
        </div>
        {/* CTA Devis - Onglet Desktop (bas) - visible quand pas de navbar mobile (lg+) */}
        {showCta && (
          <div className="absolute right-8 lg:right-16 bottom-0 z-20 hidden lg:block">
            <Link
              href="/devis"
              className="relative block bg-[#FFC300] hover:bg-[#e6b000] border border-b-0 border-black rounded-t-lg px-4 pt-3 pb-4 text-center transition-colors"
            >
              <span className="text-black font-bold text-sm whitespace-nowrap">
                Demander un devis gratuit
              </span>
            </Link>
            {/* Coins inverses - oreilles de l'onglet */}
            <div
              className="absolute -left-[5px] bottom-0 w-[6px] h-[6px]"
              style={{
                borderBottomRightRadius: '6px',
                boxShadow: '3px 3px 0 0 #FFC300',
                borderRight: '1px solid #000',
                borderBottom: '1px solid #000'
              }}
            />
            <div
              className="absolute -right-[5px] bottom-0 w-[6px] h-[6px]"
              style={{
                borderBottomLeftRadius: '6px',
                boxShadow: '-3px 3px 0 0 #FFC300',
                borderLeft: '1px solid #000',
                borderBottom: '1px solid #000'
              }}
            />
          </div>
        )}
        {/* CTA Devis - Onglet Mobile/Tablet (cote droit) - visible avec navbar mobile (<lg) */}
        {showCta && (
          <div className="absolute right-0 top-[70%] -translate-y-1/2 z-20 lg:hidden">
            <Link
              href="/devis"
              className="block bg-[#FFC300] hover:bg-[#e6b000] border border-r-0 border-black rounded-l-lg px-2 py-3 text-center transition-colors"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              <span className="text-black font-bold text-xs whitespace-nowrap">
                Devis gratuit
              </span>
            </Link>
          </div>
        )}
        <a href="#features" className="scroll-arrow" aria-label="Défiler vers le bas">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 13l5 5 5-5"></path>
            <path d="M7 6l5 5 5-5"></path>
          </svg>
        </a>
      </div>
    </section>
  )
}
