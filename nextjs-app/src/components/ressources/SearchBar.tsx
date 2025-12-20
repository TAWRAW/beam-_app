'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Route } from 'next'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchBarProps {
  defaultValue?: string
  placeholder?: string
}

export function SearchBar({ defaultValue = '', placeholder = 'Rechercher...' }: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(defaultValue)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const params = new URLSearchParams(searchParams.toString())

    if (query.trim()) {
      params.set('q', query.trim())
    } else {
      params.delete('q')
    }

    // Reset to page 1 when searching
    params.delete('page')

    const queryString = params.toString()
    startTransition(() => {
      router.push(`/ressources${queryString ? `?${queryString}` : ''}` as Route)
    })
  }

  const handleClear = () => {
    setQuery('')

    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    params.delete('page')

    const queryString = params.toString()
    startTransition(() => {
      router.push(`/ressources${queryString ? `?${queryString}` : ''}` as Route)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex gap-2 max-w-md">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'Rechercher'
        )}
      </Button>
    </form>
  )
}
