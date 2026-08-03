'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InventaireTab } from './_components/InventaireTab'
import { HistoriqueTab } from './_components/HistoriqueTab'
import { FacturerTab } from './_components/FacturerTab'

// Application « Clés » — inventaire, historique des remises, facturation.
// Navbar d'onglets en haut (charte brutalist beam-app).
export default function ClesPage() {
  return (
    <Tabs defaultValue="inventaire" className="flex w-full flex-col items-center">
      <TabsList className="mb-4 inline-flex gap-2 rounded-full border-2 border-app-border-strong bg-app-surface p-1 shadow-[2px_2px_0px_0px_var(--app-border-strong)]">
        <ClesTab value="inventaire">Inventaire</ClesTab>
        <ClesTab value="historique">Historique</ClesTab>
        <ClesTab value="facturer">Facturer</ClesTab>
      </TabsList>

      <TabsContent value="inventaire" className="w-full">
        <InventaireTab />
      </TabsContent>
      <TabsContent value="historique" className="w-full">
        <HistoriqueTab />
      </TabsContent>
      <TabsContent value="facturer" className="w-full">
        <FacturerTab />
      </TabsContent>
    </Tabs>
  )
}

function ClesTab({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <TabsTrigger
      value={value}
      className="rounded-full border-2 border-transparent px-4 py-1.5 text-sm font-bold transition data-[state=active]:border-app-border-strong data-[state=active]:bg-primary data-[state=active]:text-app-accent-foreground data-[state=active]:shadow-none"
    >
      {children}
    </TabsTrigger>
  )
}
