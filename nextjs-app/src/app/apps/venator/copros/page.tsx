import { redirect } from 'next/navigation'

// L'annuaire des copropriétés est désormais le panneau de navigation "Copropriété"
// du dashboard unifié (cf. _components/nav/CoproNavPanel.tsx) — cette route ne
// sert plus qu'à rediriger les anciens liens.
export default function CoprosIndexRedirect() {
  redirect('/apps/venator')
}
