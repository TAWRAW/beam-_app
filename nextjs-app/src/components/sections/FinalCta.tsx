import Link from 'next/link'

export default function FinalCta() {
  return (
    <section className="section bg-primary">
      <div className="container flex flex-col items-center gap-10 md:flex-row">
        <div className="card flex-1 p-10">
          <h2 className="text-2xl font-semibold">🎯 Changez pour un syndic qui vous respecte.</h2>
          <p className="mt-4 text-gray-700">Parce qu'un <strong>syndic efficace, réactif et transparent</strong> ne devrait pas être une exception.</p>
          <Link href="/ressources/contact" className="mt-6 btn">Nous contacter</Link>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <img src="/outils/images/image-removebg-preview.png" alt="Illustration syndic de confiance" className="max-w-md" />
        </div>
      </div>
    </section>
  )
}
