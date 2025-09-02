export default function Features() {
  return (
    <section id="features" className="section bg-primary">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-3">
          <Feature icon="⚡️" title="Réactivité" desc="Nous vous répondons en moins de 48h, et sommes joignables directement par téléphone." />
          <Feature icon="💰" title="Transparence" desc="Des honoraires clairs et sans surprise. Vous savez exactement ce que vous payez." />
          <Feature icon="🔍" title="Expertise" desc="Une équipe qualifiée et passionnée, à l'écoute de vos besoins spécifiques." />
        </div>
      </div>
    </section>
  )
}

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="card p-8 transition-transform hover:-translate-y-1">
      <div className="mb-6 text-5xl">{icon}</div>
      <h3 className="text-xl font-semibold text-neutral">{title}</h3>
      <p className="mt-3 text-gray-700">{desc}</p>
    </div>
  )
}
