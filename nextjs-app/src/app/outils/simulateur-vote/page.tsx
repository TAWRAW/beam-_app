'use client'

import Link from 'next/link'
import { ArrowLeft, Building2, Users, Vote, HelpCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { SimulateurProvider, useSimulateur } from '@/components/simulateur-vote/SimulateurProvider'
import { TabsCopropriete } from '@/components/simulateur-vote/TabsCopropriete'
import { TabsAG } from '@/components/simulateur-vote/TabsAG'
import { TabsVote } from '@/components/simulateur-vote/TabsVote'
import { HELP_LINKS } from '@/lib/simulateur-vote/constants'

function SimulateurContent() {
  const { state, dispatch, totalTantiemes } = useSimulateur()
  const hasLots = state.lots.length > 0

  const handleTabChange = (value: string) => {
    dispatch({
      type: 'SET_TAB',
      payload: value as 'copropriete' | 'ag' | 'vote',
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold">
                  Simulateur de Vote en AG
                </h1>
                <p className="text-sm text-muted-foreground">
                  Anticipez les résultats de votre assemblée générale
                </p>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={HELP_LINKS.notice} target="_blank">
                    <Button variant="outline" size="sm" className="gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Aide
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Notice d'utilisation du simulateur</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs
          value={state.activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="copropriete" className="gap-2">
              <Building2 className="h-4 w-4 hidden sm:block" />
              <span>Ma copropriété</span>
            </TabsTrigger>
            <TabsTrigger
              value="ag"
              className="gap-2"
              disabled={!hasLots}
            >
              <Users className="h-4 w-4 hidden sm:block" />
              <span>Simuler une AG</span>
            </TabsTrigger>
            <TabsTrigger
              value="vote"
              className="gap-2"
              disabled={!hasLots}
            >
              <Vote className="h-4 w-4 hidden sm:block" />
              <span>Simuler un vote</span>
            </TabsTrigger>
          </TabsList>

          {/* Indicateur de tantièmes global */}
          {hasLots && (
            <div className="text-sm text-muted-foreground">
              Total : <span className="font-medium">{totalTantiemes}</span>{' '}
              tantièmes • <span className="font-medium">{state.lots.length}</span>{' '}
              lots
            </div>
          )}

          <TabsContent value="copropriete" className="space-y-6">
            <TabsCopropriete />
          </TabsContent>

          <TabsContent value="ag" className="space-y-6">
            <TabsAG />
          </TabsContent>

          <TabsContent value="vote" className="space-y-6">
            <TabsVote />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-xs text-muted-foreground text-center">
            Vos données restent sur votre appareil. Aucune information n'est
            envoyée à nos serveurs.
            <br />
            Ce simulateur est fourni à titre indicatif et ne constitue pas un
            conseil juridique.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default function SimulateurVotePage() {
  return (
    <SimulateurProvider>
      <SimulateurContent />
    </SimulateurProvider>
  )
}
