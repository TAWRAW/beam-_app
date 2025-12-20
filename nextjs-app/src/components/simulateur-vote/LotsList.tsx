'use client'

import { useState } from 'react'
import { Pencil, Trash2, MoreHorizontal, Plus, X, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useSimulateur } from './SimulateurProvider'
import { LotForm } from './LotForm'
import { Lot, getLotDisplayName, getLotTantiemes, DEFAULT_CLE_ID } from '@/lib/simulateur-vote/types'

export function LotsList() {
  const {
    state,
    deleteLot,
    updateLotTantiemes,
    addCle,
    updateCle,
    deleteCle,
    getTotalTantièmesPourCle,
    canAddCle,
  } = useSimulateur()

  const [editingLot, setEditingLot] = useState<Lot | null>(null)
  const [deletingLot, setDeletingLot] = useState<Lot | null>(null)
  const [editingCleId, setEditingCleId] = useState<string | null>(null)
  const [newCleName, setNewCleName] = useState('')
  const [isAddingCle, setIsAddingCle] = useState(false)
  const [newCleInput, setNewCleInput] = useState('')

  const handleEdit = (lot: Lot) => {
    setEditingLot(lot)
  }

  const handleDelete = (lot: Lot) => {
    setDeletingLot(lot)
  }

  const confirmDelete = () => {
    if (deletingLot) {
      deleteLot(deletingLot.id)
      setDeletingLot(null)
    }
  }

  const handleTantiemesChange = (lotId: string, cleId: string, value: string) => {
    const numValue = parseInt(value) || 0
    updateLotTantiemes(lotId, cleId, numValue)
  }

  const handleTantiemesIncrement = (lotId: string, cleId: string, currentValue: number, delta: number) => {
    const newValue = Math.max(0, currentValue + delta)
    updateLotTantiemes(lotId, cleId, newValue)
  }

  const handleCleNameEdit = (cleId: string, currentName: string) => {
    setEditingCleId(cleId)
    setNewCleName(currentName)
  }

  const handleCleNameSave = (cleId: string) => {
    if (newCleName.trim()) {
      updateCle(cleId, newCleName.trim())
    }
    setEditingCleId(null)
    setNewCleName('')
  }

  const handleCleNameKeyDown = (e: React.KeyboardEvent, cleId: string) => {
    if (e.key === 'Enter') {
      handleCleNameSave(cleId)
    } else if (e.key === 'Escape') {
      setEditingCleId(null)
      setNewCleName('')
    }
  }

  const handleAddCle = () => {
    if (newCleInput.trim() && canAddCle) {
      addCle(newCleInput.trim())
      setNewCleInput('')
      setIsAddingCle(false)
    }
  }

  const handleAddCleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCle()
    } else if (e.key === 'Escape') {
      setIsAddingCle(false)
      setNewCleInput('')
    }
  }

  return (
    <>
      {/* Vue desktop : tableau spreadsheet */}
      <div className="hidden lg:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">N° de lot</TableHead>
              <TableHead className="w-[150px]">Nom</TableHead>
              {state.clesDeCharges.map((cle) => (
                <TableHead key={cle.id} className="text-center min-w-[120px]">
                  <div className="flex flex-col items-center gap-1">
                    {editingCleId === cle.id ? (
                      <Input
                        value={newCleName}
                        onChange={(e) => setNewCleName(e.target.value)}
                        onBlur={() => handleCleNameSave(cle.id)}
                        onKeyDown={(e) => handleCleNameKeyDown(e, cle.id)}
                        className="h-7 text-xs text-center max-w-[100px]"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-1">
                        <span
                          className={cle.isDefault ? '' : 'cursor-pointer hover:text-primary'}
                          onClick={() => !cle.isDefault && handleCleNameEdit(cle.id, cle.nom)}
                          title={cle.isDefault ? '' : 'Cliquer pour renommer'}
                        >
                          {cle.nom}
                        </span>
                        {!cle.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteCle(cle.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground font-normal">
                      Total: {getTotalTantièmesPourCle(cle.id)}
                    </span>
                  </div>
                </TableHead>
              ))}
              {/* Colonne pour ajouter une clé */}
              <TableHead className="w-[100px]">
                {canAddCle && (
                  isAddingCle ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={newCleInput}
                        onChange={(e) => setNewCleInput(e.target.value)}
                        onBlur={() => {
                          if (newCleInput.trim()) handleAddCle()
                          else setIsAddingCle(false)
                        }}
                        onKeyDown={handleAddCleKeyDown}
                        className="h-7 text-xs max-w-[80px]"
                        placeholder="Nom..."
                        autoFocus
                      />
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => setIsAddingCle(true)}
                    >
                      <Plus className="h-3 w-3" />
                      Clé
                    </Button>
                  )
                )}
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.lots.map((lot) => (
              <TableRow key={lot.id}>
                <TableCell className="font-medium">{lot.numero}</TableCell>
                <TableCell className="text-muted-foreground">{lot.nom || '-'}</TableCell>
                {state.clesDeCharges.map((cle) => {
                  const currentValue = getLotTantiemes(lot, cle.id) || 0
                  return (
                    <TableCell key={cle.id} className="text-center p-1">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleTantiemesIncrement(lot.id, cle.id, currentValue, -10)}
                          disabled={currentValue <= 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          value={currentValue || ''}
                          onChange={(e) => handleTantiemesChange(lot.id, cle.id, e.target.value)}
                          className="h-7 text-center w-16"
                          placeholder="0"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleTantiemesIncrement(lot.id, cle.id, currentValue, 10)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  )
                })}
                <TableCell></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(lot)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(lot)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Vue mobile/tablette : cartes */}
      <div className="lg:hidden space-y-3">
        {state.lots.map((lot) => (
          <div
            key={lot.id}
            className="p-4 border rounded-lg bg-card"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium">{getLotDisplayName(lot)}</p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEdit(lot)}
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Modifier</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(lot)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Supprimer</span>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {state.clesDeCharges.map((cle) => {
                const currentValue = getLotTantiemes(lot, cle.id) || 0
                return (
                  <div key={cle.id} className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">{cle.nom}</label>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => handleTantiemesIncrement(lot.id, cle.id, currentValue, -10)}
                        disabled={currentValue <= 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        value={currentValue || ''}
                        onChange={(e) => handleTantiemesChange(lot.id, cle.id, e.target.value)}
                        className="h-8 text-center flex-1 min-w-0"
                        placeholder="0"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => handleTantiemesIncrement(lot.id, cle.id, currentValue, 10)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modal d'édition */}
      <LotForm
        open={!!editingLot}
        onOpenChange={(open) => !open && setEditingLot(null)}
        editingLot={editingLot}
      />

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deletingLot} onOpenChange={(open) => !open && setDeletingLot(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce lot ?</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer le lot « {deletingLot ? getLotDisplayName(deletingLot) : ''} » ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
