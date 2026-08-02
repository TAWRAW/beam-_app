import { redirect } from 'next/navigation'

// La fiche copropriété est désormais la vue "copro sélectionnée" du dashboard
// unifié (cf. page.tsx + _components/nav/CoproNavPanel.tsx) — cette route ne
// sert plus qu'à rediriger les anciens liens vers `?copro=<id>`.
export default function CoproRedirect({ params }: { params: { id: string } }) {
  redirect(`/apps/venator?copro=${params.id}`)
}
