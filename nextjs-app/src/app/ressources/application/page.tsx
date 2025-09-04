export const metadata = {
  title: 'Application — Beamô',
  description: "Découvrez l'application Beamô",
  alternates: { canonical: '/ressources/application' },
}

export default function ApplicationPage() {
  return (
    <main className="section">
      <div className="container">
        <div className="card p-10">
          <h1 className="h1">Application Beamô</h1>
          <p className="mt-4 text-gray-700">Cette page sera enrichie avec la présentation détaillée de l'application Beamô.</p>
          <div className="mt-6">
            <a
              href="/apps/mandats"
              className="inline-block rounded bg-black text-white px-4 py-2 hover:opacity-90"
            >
              Accéder aux Mandats (connexion requise)
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
