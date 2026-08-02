'use client'

import { useEffect, useState } from 'react'
import { Download, Printer, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DocumentPreview } from '@/components/documents/DocumentPreview'
import { ReglementInterieurTemplate } from '@/components/documents/templates/ReglementInterieurTemplate'
import { ContactsUtilesTemplate } from '@/components/documents/templates/ContactsUtilesTemplate'
import { ConstatDdeDocument } from '@/components/documents/constat/ConstatDdeDocument'
import { constatDefaults, type ConstatFormInput } from '@/components/documents/constat/constat-schema'
import { mockBuilding, mockAgency } from '@/lib/mock-data'

// Format A4 a 96 dpi : 210mm = 794px, 297mm = 1123px
const PAGE_WIDTH_PX = 794
const PAGE_HEIGHT_PX = 1123

interface PreviewData {
  templateType?: 'affiche' | 'reglement' | 'contacts' | 'constat'
  buildingNom?: string
  buildingAdresse?: string
  buildingCodePostal?: string
  buildingVille?: string
  [key: string]: unknown
}

function slugify(s: string): string {
  const cleaned = s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return cleaned || 'document'
}

function getFileName(data: PreviewData): string {
  const date = new Date().toISOString().slice(0, 10)
  const building = slugify(String(data.buildingNom || ''))
  if (data.templateType === 'contacts') return `contacts-utiles-${building}-${date}`
  if (data.templateType === 'reglement') return `reglement-interieur-${building}-${date}`
  if (data.templateType === 'constat') return `constat-dde-${building}-${date}`
  const titre = slugify(String((data as Record<string, unknown>).titre || 'affiche'))
  return `${titre}-${building}-${date}`
}

function getLabel(data: PreviewData): string {
  if (data.templateType === 'contacts') return 'Contacts Utiles'
  if (data.templateType === 'reglement') return 'Règlement Intérieur'
  if (data.templateType === 'constat') return 'Constat DDE'
  return String((data as Record<string, unknown>).titre || 'Affiche')
}

// /api/pdf injecte le HTML via page.setContent() sans <base href> : les URLs relatives
// (/images/...) ne se résolvent pas dans Puppeteer. On inline donc chaque <img> same-origin
// en data URI avant l'envoi (les fichiers sont déjà dans le cache navigateur).
async function inlineImages(html: string): Promise<string> {
  const srcs = Array.from(html.matchAll(/<img[^>]+src="(\/[^"]+)"/g), (m) => m[1])
  const unique = Array.from(new Set(srcs))
  let result = html
  for (const src of unique) {
    try {
      const res = await fetch(src)
      if (!res.ok) continue
      const blob = await res.blob()
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      result = result.split(`src="${src}"`).join(`src="${dataUri}"`)
    } catch {
      // image inaccessible : on laisse l'URL relative (dégradation silencieuse)
    }
  }
  return result
}

export default function DocumentPreviewPage() {
  const [data, setData] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedData = sessionStorage.getItem('documentPreviewData')
    if (storedData) {
      try {
        setData(JSON.parse(storedData))
      } catch (e) {
        console.error('Erreur parsing données:', e)
      }
    }
    setLoading(false)
  }, [])

  const handleDownload = async () => {
    if (!data || downloading) return
    setError(null)
    setDownloading(true)
    try {
      const el = document.getElementById('preview-target')
      if (!el) throw new Error('Document introuvable dans la page')
      const html = await inlineImages(el.innerHTML)
      const title = getFileName(data)
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, metadata: { title } }),
      })
      if (!res.ok) {
        const msg = await res.text().catch(() => '')
        throw new Error(`API PDF: ${res.status} ${msg}`.trim())
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-200">
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-200 gap-2">
        <p className="text-slate-700 font-medium">Aucun document à afficher.</p>
        <p className="text-slate-500 text-sm">Retourne au générateur et clique sur le bouton de prévisualisation.</p>
      </div>
    )
  }

  const building = {
    nom: data.buildingNom || mockBuilding.nom,
    adresse: data.buildingAdresse || mockBuilding.adresse,
    codePostal: data.buildingCodePostal || mockBuilding.codePostal,
    ville: data.buildingVille || mockBuilding.ville,
  }

  const isReglement = data.templateType === 'reglement'
  const isContacts = data.templateType === 'contacts'
  const isConstat = data.templateType === 'constat'
  const previewAgency = (data.previewAgency as Record<string, unknown> | undefined) || mockAgency

  return (
    <>
      <div className="min-h-screen bg-slate-200 print:bg-white">
        {/* Barre d'actions (masquee a l'impression) */}
        <div className="sticky top-0 z-10 bg-white border-b shadow-sm print:hidden">
          <div className="max-w-[900px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-5 w-5 text-slate-600 shrink-0" />
              <h1 className="font-semibold text-sm truncate">
                {getLabel(data)}
                {data.buildingNom && (
                  <span className="text-slate-500 ml-2 font-normal">— {data.buildingNom}</span>
                )}
              </h1>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button onClick={() => window.print()} variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-1.5" />
                Imprimer
              </Button>
              <Button
                onClick={handleDownload}
                disabled={downloading}
                size="sm"
                className="bg-[#FFC300] text-black hover:bg-[#e6b000]"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-1.5" />
                )}
                {downloading ? 'Génération...' : 'Télécharger PDF'}
              </Button>
            </div>
          </div>
          {error && (
            <div className="max-w-[900px] mx-auto px-4 pb-2">
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Document au format A4 */}
        <div className="py-8 px-4 print:p-0 flex justify-center">
          <div
            id="preview-target"
            className="shadow-2xl print:shadow-none bg-white"
            style={{ width: PAGE_WIDTH_PX, minHeight: PAGE_HEIGHT_PX }}
          >
            {isConstat ? (
              <ConstatDdeDocument
                data={{ ...constatDefaults, ...((data.constat as Partial<ConstatFormInput>) || {}) }}
              />
            ) : isContacts ? (
              <ContactsUtilesTemplate
                data={{
                  buildingNom: building.nom,
                  buildingAdresse: building.adresse,
                  buildingCodePostal: building.codePostal,
                  buildingVille: building.ville,
                  syndicNom: (data.syndicNom as string) || 'Beamô',
                  syndicAdresse: (data.syndicAdresse as string) || '',
                  syndicTelephone: (data.syndicTelephone as string) || '',
                  syndicEmail: (data.syndicEmail as string) || '',
                  gestionnaireNom: (data.gestionnaireNom as string) || '',
                  gestionnaireTelephone: (data.gestionnaireTelephone as string) || '',
                  gestionnaireEmail: (data.gestionnaireEmail as string) || '',
                  enedisPhone: (data.enedisPhone as string) || '',
                  eauPrivative: (data.eauPrivative as boolean) || false,
                  eauFournisseur: (data.eauFournisseur as string) || '',
                  eauPhone: (data.eauPhone as string) || '',
                  mairieName: (data.mairieName as string) || '',
                  mairiePhone: (data.mairiePhone as string) || '',
                  dechetterieName: (data.dechetterieName as string) || '',
                  dechetteriePhone: (data.dechetteriePhone as string) || '',
                  dechetterieAdresse: (data.dechetterieAdresse as string) || '',
                  dechetterieHoraires: (data.dechetterieHoraires as string) || '',
                  contracts: (data.contracts as any[]) || [],
                  conseillers: (data.conseillers as any[]) || [],
                  showUrgences: data.showUrgences as boolean | undefined,
                  showEnergie: data.showEnergie as boolean | undefined,
                  showContracts: data.showContracts as boolean | undefined,
                  showConseillers: data.showConseillers as boolean | undefined,
                  urgences: (data.urgences as any[]) || [],
                  customBlocks: ((data.customBlocks as any[]) || []).map((b: any) => ({
                    id: b.id,
                    title: b.title,
                    icon: b.icon,
                    lines:
                      typeof b.lines === 'string'
                        ? b.lines.split('\n').filter((l: string) => l.trim() !== '')
                        : b.lines || [],
                    show: b.show,
                  })),
                  agency: previewAgency as any,
                }}
              />
            ) : isReglement ? (
              <ReglementInterieurTemplate
                data={{
                  buildingNom: building.nom,
                  buildingAdresse: building.adresse,
                  buildingCodePostal: building.codePostal,
                  buildingVille: building.ville,
                  features: (data.features as Record<string, boolean>) || {},
                  showPreambule: data.showPreambule as boolean | undefined,
                  preambuleContent: data.preambuleContent as string | undefined,
                  showSecurite: data.showSecurite as boolean | undefined,
                  securiteContent: data.securiteContent as string | undefined,
                  articleContents: data.articleContents as Record<string, string> | undefined,
                  agency: previewAgency as any,
                }}
              />
            ) : (
              <DocumentPreview
                data={data}
                building={building}
                agency={previewAgency as any}
                colorOverrides={
                  data.afficheColorMap as Record<string, { bg: string; label: string }> | undefined
                }
              />
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
        }

        @media print {
          @page {
            size: A4;
            margin: 0;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Affiche Travaux */
          #document-preview-content {
            width: 210mm !important;
            min-height: 297mm !important;
            max-width: 210mm !important;
            margin: 0 !important;
            padding: 8mm !important;
            box-shadow: none !important;
          }

          /* Contacts Utiles - single page */
          .contacts-utiles-page {
            width: 210mm !important;
            height: 297mm !important;
            max-width: 210mm !important;
            margin: 0 !important;
            box-shadow: none !important;
          }

          /* Reglement Interieur - multi-pages */
          .reglement-page {
            width: 210mm !important;
            height: 297mm !important;
            max-width: 210mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            break-after: page;
          }

          /* Constat DDE - 3 exemplaires */
          .constat-page {
            width: 210mm !important;
            height: 297mm !important;
            max-width: 210mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            break-after: page;
          }

          .page-gap {
            display: none !important;
          }
        }
      `}</style>
    </>
  )
}
