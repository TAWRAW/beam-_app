'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from '@/components/ui/form'
import type { SupplierCondo, AfficheTravauxFormInput } from '@/schemas/document'

interface SmartSupplierSelectProps {
  suppliers: SupplierCondo[]
  defaultTag?: string
  name: string
}

export function SmartSupplierSelect({
  suppliers,
  defaultTag,
}: SmartSupplierSelectProps) {
  const form = useFormContext<AfficheTravauxFormInput>()
  const hasAutoSelected = useRef(false)

  const findSupplierByTag = useCallback((tag: string) => {
    return suppliers.find((s) =>
      s.tags.some((t) => t.toUpperCase().includes(tag.toUpperCase()))
    )
  }, [suppliers])

  // Auto-sélection une seule fois si defaultTag est fourni
  useEffect(() => {
    if (hasAutoSelected.current) return
    if (defaultTag && !form.getValues('supplierId') && suppliers.length > 0) {
      const defaultSupplier = findSupplierByTag(defaultTag)
      if (defaultSupplier) {
        hasAutoSelected.current = true
        form.setValue('supplierId', defaultSupplier.id)
        form.setValue('supplierNom', defaultSupplier.nom)
        form.setValue('supplierTelephone', defaultSupplier.telephone || '')
        form.setValue('supplierEmail', defaultSupplier.email || '')
        form.setValue('supplierSpecialite', defaultSupplier.specialite || '')
      }
    }
  }, [suppliers, defaultTag, form, findSupplierByTag])

  const handleNomChange = (value: string) => {
    const match = suppliers.find(s => s.nom === value)
    form.setValue('supplierNom', value)
    if (match) {
      form.setValue('supplierId', match.id)
      form.setValue('supplierTelephone', match.telephone || '')
      form.setValue('supplierEmail', match.email || '')
      form.setValue('supplierSpecialite', match.specialite || '')
    } else {
      form.setValue('supplierId', '')
    }
  }

  return (
    <div className="space-y-2">
      <datalist id="smart-supplier-datalist">
        {suppliers.map(s => (
          <option key={s.id} value={s.nom} />
        ))}
      </datalist>

      <div className="grid grid-cols-2 gap-2">
        <FormField
          control={form.control}
          name="supplierNom"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-slate-500">Prestataire</FormLabel>
              <FormControl>
                <Input
                  list="smart-supplier-datalist"
                  placeholder="Nom (taper pour suggérer)"
                  className="h-8 text-xs"
                  {...field}
                  onChange={e => handleNomChange(e.target.value)}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="supplierSpecialite"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-slate-500">Spécialité</FormLabel>
              <FormControl>
                <Input placeholder="Spécialité" className="h-8 text-xs" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="supplierTelephone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-slate-500">Téléphone</FormLabel>
              <FormControl>
                <Input placeholder="Téléphone" className="h-8 text-xs" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="supplierEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-slate-500">Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Email" className="h-8 text-xs" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
