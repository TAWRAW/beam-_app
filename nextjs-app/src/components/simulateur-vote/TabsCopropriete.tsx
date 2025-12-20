'use client'

import { useState, useRef } from 'react'
import { Plus, Upload, Download, Trash2, AlertTriangle, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSimulateur } from './SimulateurProvider'
import { LotForm } from './LotForm'
import { LotsList } from './LotsList'
import { TantiemesCounter } from './TantiemesCounter'
import { exportToFile, importFromFile, downloadCSVTemplate } from '@/lib/simulateur-vote/storage'
import { ERROR_MESSAGES } from '@/lib/simulateur-vote/constants'

export function TabsCopropriete() {
  const { state, resetAll, importData } = useSimulateur()
  const [showForm, setShowForm] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    exportToFile(state)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportError(null)
    const data = await importFromFile(file)

    if (!data) {
      setImportError(ERROR_MESSAGES.import_invalid)
      return
    }

    const success = importData(data)
    if (!success) {
      setImportError(ERROR_MESSAGES.import_invalid)
    }

    // Reset l'input pour permettre de reimporter le même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const hasLots = state.lots.length > 0

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ma copropriété</h2>
          <p className="text-sm text-muted-foreground">
            Ajoutez les lots de votre copropriété avec leurs tantièmes
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadCSVTemplate(state.clesDeCharges)}
                  className="gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Modèle
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Télécharger un modèle CSV à remplir</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImportClick}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Importer
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Importer un fichier CSV ou JSON</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
          {hasLots && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Exporter
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    Réinitialiser
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Réinitialiser toutes les données ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action supprimera tous les lots, présences et votes.
                      Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={resetAll}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Réinitialiser
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {/* Message d'erreur d'import */}
      {importError && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {importError}
        </div>
      )}

      {/* Compteur de tantièmes */}
      {hasLots && <TantiemesCounter />}

      {/* Liste des lots ou état vide */}
      {hasLots ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Liste des lots</CardTitle>
              <Button
                size="sm"
                onClick={() => setShowForm(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter un lot
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <LotsList />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="mb-2">Commencez par ajouter vos lots</CardTitle>
            <CardDescription className="mb-6 max-w-md">
              Ajoutez les lots de votre copropriété avec leur identifiant
              (numéro, nom du propriétaire...) et leurs tantièmes.
            </CardDescription>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter le premier lot
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Formulaire d'ajout de lot (modal) */}
      <LotForm open={showForm} onOpenChange={setShowForm} />
    </div>
  )
}
