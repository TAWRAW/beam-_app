'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useSimulateur } from './SimulateurProvider'
import { Lot, DEFAULT_CLE_ID } from '@/lib/simulateur-vote/types'
import { useEffect } from 'react'

interface LotFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingLot?: Lot | null
}

// Schema dynamique pour le formulaire
const createLotFormSchema = (clesCount: number) => z.object({
  numero: z
    .string()
    .min(1, 'Le numéro de lot est obligatoire')
    .max(20, 'Le numéro de lot ne peut pas dépasser 20 caractères'),
  nom: z
    .string()
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .optional()
    .or(z.literal('')),
})

type LotFormData = z.infer<ReturnType<typeof createLotFormSchema>>

export function LotForm({ open, onOpenChange, editingLot }: LotFormProps) {
  const { state, addLot, updateLot } = useSimulateur()
  const isEditing = !!editingLot

  const form = useForm<LotFormData>({
    resolver: zodResolver(createLotFormSchema(state.clesDeCharges.length)),
    defaultValues: {
      numero: '',
      nom: '',
    },
  })

  // Reset form when editingLot changes
  useEffect(() => {
    if (editingLot) {
      form.reset({
        numero: editingLot.numero,
        nom: editingLot.nom || '',
      })
    } else {
      form.reset({
        numero: '',
        nom: '',
      })
    }
  }, [editingLot, form])

  const onSubmit = (data: LotFormData) => {
    const nom = data.nom?.trim() || undefined

    if (isEditing && editingLot) {
      // Garder les tantièmes existants lors de l'édition
      updateLot({
        id: editingLot.id,
        numero: data.numero,
        nom,
        tantièmesParCle: editingLot.tantièmesParCle,
      })
    } else {
      // Nouveau lot avec tantièmes à 0 pour toutes les clés
      const tantièmesParCle: Record<string, number> = {}
      state.clesDeCharges.forEach((cle) => {
        tantièmesParCle[cle.id] = 0
      })
      addLot(data.numero, tantièmesParCle, nom)
    }
    form.reset()
    onOpenChange(false)
  }

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier le lot' : 'Ajouter un lot'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifiez les informations de ce lot. Les tantièmes peuvent être modifiés directement dans le tableau.'
              : 'Renseignez les informations du nouveau lot. Vous pourrez ensuite renseigner les tantièmes dans le tableau.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="numero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro de lot *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: 1, A1, RDC-01..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Numéro ou référence du lot (obligatoire)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du propriétaire</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: M. Dupont, SCI Immoval..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Facultatif - pour faciliter l'identification
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button type="submit">
                {isEditing ? 'Enregistrer' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
