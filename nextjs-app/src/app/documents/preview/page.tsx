'use client'

import { useEffect, useState } from 'react'
import { DocumentPreview } from '@/components/documents/DocumentPreview'
import { ReglementInterieurTemplate } from '@/components/documents/templates/ReglementInterieurTemplate'
import { ContactsUtilesTemplate } from '@/components/documents/templates/ContactsUtilesTemplate'
import { mockBuilding, mockAgency } from '@/lib/mock-data'

interface PreviewData {
  templateType?: 'affiche' | 'reglement' | 'contacts'
  // Champs communs
  buildingNom?: string
  buildingAdresse?: string
  buildingCodePostal?: string
  buildingVille?: string
  // Champs affiche
  [key: string]: unknown
}

export default function DocumentPreviewPage() {
  const [data, setData] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-500">
        <p className="text-white">Chargement...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-500 gap-4">
        <p className="text-white">Aucun document à afficher.</p>
      </div>
    )
  }

  // Construire les infos de l'immeuble depuis les données du formulaire ou mock
  const building = {
    nom: data.buildingNom || mockBuilding.nom,
    adresse: data.buildingAdresse || mockBuilding.adresse,
    codePostal: data.buildingCodePostal || mockBuilding.codePostal,
    ville: data.buildingVille || mockBuilding.ville,
  }

  const isReglement = data.templateType === 'reglement'
  const isContacts = data.templateType === 'contacts'
  const previewAgency = (data.previewAgency as any) || mockAgency

  return (
    <>
      <div className="min-h-screen bg-gray-500 print:bg-white p-4 print:p-0 flex justify-center">
        <div className="print:m-0">
          {isContacts ? (
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
                  lines: typeof b.lines === 'string'
                    ? b.lines.split('\n').filter((l: string) => l.trim() !== '')
                    : (b.lines || []),
                  show: b.show,
                })),
                agency: previewAgency,
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
                agency: previewAgency,
              }}
            />
          ) : (
            <DocumentPreview
              data={data}
              building={building}
              agency={previewAgency}
              colorOverrides={data.afficheColorMap as Record<string, { bg: string; label: string }> | undefined}
            />
          )}
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

          /* Règlement Intérieur - multi-pages */
          .reglement-page {
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
