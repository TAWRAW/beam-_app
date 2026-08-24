import { Suspense } from 'react'
import MailingCibleClient from './_components/MailingCibleClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mailing ciblé',
}

// Suspense requis : le client lit les paramètres d'URL (?copro=REF&dossier=UUID)
// posés par le bouton « Créer un mailing » d'un dossier Venator.
export default function MailingsPage() {
  return (
    <Suspense fallback={null}>
      <MailingCibleClient />
    </Suspense>
  )
}
