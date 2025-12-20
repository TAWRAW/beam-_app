'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Loader2, Building2, MapPin, Hash } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { comptoirAPI, SearchCopropriete, ComptoirCoproAPI, type CoproprietePourMandat } from '@/lib/comptoir-api'

interface CoproprietSearchProps {
  onSelect: (copro: CoproprietePourMandat) => void
}

export function CoproprietSearch({ onSelect }: CoproprietSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchCopropriete[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Recherche debounced
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await comptoirAPI.search({
        q: searchQuery,
        limit: 8,
      })
      setResults(response.data)
      setIsOpen(response.data.length > 0)
    } catch (err) {
      console.error('Erreur recherche copropriété:', err)
      setError('Erreur lors de la recherche')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounce la recherche
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      search(query)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, search])

  const handleSelect = (copro: SearchCopropriete) => {
    const formatted = ComptoirCoproAPI.toMandatFormat(copro)
    onSelect(formatted)
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Rechercher une copropriété (nom, adresse, RNC)..."
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}

      {/* Dropdown des résultats */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto">
          <div className="p-2 text-xs text-muted-foreground border-b">
            {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
          </div>
          <ul className="py-1">
            {results.map((copro) => (
              <li key={copro.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(copro)}
                  className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {copro.nom}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{copro.adresse.complete}</span>
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {copro.numero_immatriculation && (
                          <span className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {copro.numero_immatriculation}
                          </span>
                        )}
                        <span>
                          {copro.lots.total} lot{copro.lots.total > 1 ? 's' : ''}
                        </span>
                        {copro.lots.habitation > 0 && (
                          <span className="text-primary">
                            {copro.lots.habitation} logement{copro.lots.habitation > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="p-2 text-center border-t">
            <a
              href="https://le-comptoir-de-la-copropriete.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Données fournies par Le Comptoir de la Copropriété
            </a>
          </div>
        </div>
      )}

      {/* Message si aucun résultat */}
      {isOpen && query.length >= 3 && results.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Aucune copropriété trouvée pour "{query}"
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Essayez avec le nom, l'adresse ou le numéro RNC
          </p>
        </div>
      )}
    </div>
  )
}
