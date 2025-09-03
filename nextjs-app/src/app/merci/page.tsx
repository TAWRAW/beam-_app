export const metadata = {
  title: 'Merci — Beamô',
  description: 'Votre message a bien été envoyé. Nous vous répondons sous 48h.'
}

export default function MerciPage() {
  return (
    <main className="section">
      <div className="container">
        <div className="card p-10 text-center">
          <h1 className="h1">Merci !</h1>
          <p className="mt-4 text-gray-700">Votre message a bien été envoyé. Nous vous répondrons sous 48h.</p>
          <a href="/" className="mt-8 btn">Retour à l’accueil</a>
        </div>
      </div>
    </main>
  )
}

