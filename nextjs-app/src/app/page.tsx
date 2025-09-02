import Carousel from '@/components/sections/Carousel'
import Features from '@/components/sections/Features'
import Squares from '@/components/sections/Squares'
import FinalCta from '@/components/sections/FinalCta'

export const metadata = {
  title: 'Beamô - Syndic de Copropriété à Vernon, Évreux et Les Andelys',
  description:
    "Beamô, votre syndic de copropriété local à Vernon, Evreux, Les Andelys et ses environs. Proximité, réactivité et écoute au service de votre copropriété.",
}

export default function Page() {
  return (
    <main className="min-h-screen">
      <Carousel />
      <Features />
      <Squares />
      <FinalCta />
    </main>
  )
}
