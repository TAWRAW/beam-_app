"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { User } from "@supabase/supabase-js"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Profile = {
  id: string
  email: string | null
  role: 'visiteur' | 'inscrit' | 'payant' | 'employe' | 'admin' | 'vip'
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type UserWithProfile = {
  user: User
  profile: Profile | null
}

const roleLabels = {
  visiteur: 'Visiteur',
  inscrit: 'Inscrit',
  payant: 'Payant',
  employe: 'Employé',
  admin: 'Admin',
  vip: 'VIP'
}

const roleColors = {
  visiteur: 'bg-app-surface-2 text-app-fg',
  inscrit: 'bg-app-info-bg text-app-info-fg',
  payant: 'bg-app-success-bg text-app-success-fg',
  employe: 'bg-purple-100 text-purple-800',
  admin: 'bg-app-danger-bg text-app-danger-fg',
  vip: 'bg-app-warning-bg text-app-warning-fg'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const columns: ColumnDef<UserWithProfile>[] = [
  {
    accessorKey: "user",
    header: "Utilisateur",
    cell: ({ row }) => {
      const { user, profile } = row.original
      return (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            {profile?.avatar_url ? (
              <img
                className="h-10 w-10 rounded-full"
                src={profile.avatar_url}
                alt=""
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-app-surface-hover flex items-center justify-center">
                <span className="text-sm font-medium text-app-fg">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-app-fg">
              {profile?.full_name || 'Nom non défini'}
            </div>
            <div className="text-sm text-app-fg-muted">
              {user.email}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="lowercase">{row.original.user.email}</div>,
  },
  {
    accessorKey: "role",
    header: "Rôle",
    cell: ({ row }) => {
      const { profile } = row.original
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          profile ? roleColors[profile.role] : 'bg-app-surface-2 text-app-fg'
        }`}>
          {profile ? roleLabels[profile.role] : 'Aucun profil'}
        </span>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Inscription
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <div className="text-sm text-app-fg-muted">
          {formatDate(row.original.user.created_at)}
        </div>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const { user, profile } = row.original

      const updateUserRole = async (newRole: Profile['role']) => {
        try {
          const response = await fetch(`/api/debug/users/${user.id}/role`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role: newRole }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to update role')
          }

          // Refresh the page to show updated data
          window.location.reload()
        } catch (error) {
          console.error('Error updating role:', error)
          alert('Erreur lors de la mise à jour du rôle: ' + (error as Error).message)
        }
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Ouvrir le menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(user.id)}
            >
              Copier l'ID utilisateur
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {profile && (
              <>
                <DropdownMenuLabel>Changer le rôle</DropdownMenuLabel>
                {Object.entries(roleLabels).map(([roleKey, roleLabel]) => (
                  <DropdownMenuItem
                    key={roleKey}
                    onClick={() => updateUserRole(roleKey as Profile['role'])}
                    disabled={profile.role === roleKey}
                  >
                    {roleLabel}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]