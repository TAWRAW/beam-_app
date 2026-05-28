'use client'

import type { AfficheTravauxFormInput, DocumentType } from '@/schemas/document'
import type { BuildingInfo, AgencyInfo } from '@/schemas/document'
import { DOCUMENT_TYPE_COLORS } from '@/schemas/document'
import { BEAMO_LEGAL_INFO, generateLegalMentions } from '@/lib/mock-data'

interface DocumentPreviewProps {
  data: Omit<Partial<AfficheTravauxFormInput>, 'documentType'> & { documentType?: string }
  building: BuildingInfo
  agency: AgencyInfo
  colorOverrides?: Record<string, { bg: string; label: string }>
}

function generateDynamicLegalMentions(agency: AgencyInfo): string {
  // Si on a des données légales dynamiques, les utiliser
  if (agency.legal?.siret) {
    const legal = agency.legal
    const agencyName = agency.nom || 'Beamô'
    const address = agency.adresse ? `${agency.adresse} ${agency.codePostal} ${agency.ville}` : ''

    // Adresse de correspondance (BP) depuis Estale addressL2/L3
    const correspondance = [agency.adresseL2, agency.adresseL3].filter(Boolean).join(' ').trim()
    const correspondanceText = correspondance ? ` | Toute correspondance : ${correspondance}` : ''

    // Extraire le SIREN du SIRET (9 premiers chiffres)
    const siren = legal.siret ? legal.siret.substring(0, 9).replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') : ''

    return `Enseigne ${agencyName} | SASU BEAMO IMMOBILIER au capital de ${legal.capital || '2 500'} € dont le siège social est situé au 8 rue du général Leclerc 27950 Saint-Marcel | Cabinet au ${address || '2 Place Jean Paul II 27200 Vernon'}${correspondanceText} | SIREN ${siren} ${legal.rcs || 'Évreux'} | Numéro TVA intracommunautaire ${legal.tvaNumber || 'FR33989101829'}. Carte professionnelle portant la mention "Syndic de Copropriété" CPI27012025000000013, délivrée par CCI PORTE DE NORMANDIE (27), conformément à la (Loi n° 70-9 du 02/01/1970). Titulaire d'une assurance en responsabilité civile professionnelle auprès de ALLIANZ M. RAYEUR Guillaume 4 rue Carnot 27200 Vernon, et d'une garantie financière auprès de la SO.CA.F sise 26 avenue de Suffren 75015 Paris d'un montant de 30 000 €.
Document propriété de la société BEAMO IMMOBILIER, ne pas reproduire.`
  }

  // Sinon, utiliser les mentions statiques
  return generateLegalMentions(BEAMO_LEGAL_INFO)
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatTime(timeStr: string | undefined): string {
  if (!timeStr) return ''
  return timeStr.replace(':', 'h')
}

function formatPhone(phone: string | undefined): string {
  if (!phone) return ''
  // Nettoyer le numéro (enlever espaces, tirets, points)
  let cleaned = phone.replace(/[\s\-\.]/g, '')
  // Convertir +33 en 0
  if (cleaned.startsWith('+33')) {
    cleaned = '0' + cleaned.slice(3)
  }
  // Formater en XX XX XX XX XX
  if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
  }
  return phone
}

export function DocumentPreview({
  data,
  building,
  agency,
  colorOverrides,
}: DocumentPreviewProps) {
  const hasBuilding = building.nom && building.nom.trim() !== ''
  const coproName = hasBuilding ? building.nom : 'Nom de la copropriété'
  const coproAddress = hasBuilding && building.adresse ? `${building.adresse}, ${building.codePostal} ${building.ville}` : ''
  const fullCoproName = coproAddress ? `${coproName}\n${coproAddress}` : coproName

  const docTitle = data.titre || 'Type affiche (intervention, rappel)'
  const description = data.description || 'Texte'

  // Vérifier si les champs intervenant et date sont remplis
  const hasSupplier = data.supplierNom && data.supplierNom.trim() !== ''
  const hasDate = data.dateTravaux && data.dateTravaux.trim() !== ''
  const showSupplier = hasSupplier && data.showSupplierContactOnPreview
  const hasScheduleInfo = showSupplier || hasDate

  const supplier = hasSupplier ? data.supplierNom : ''
  const supplierPhone = formatPhone(data.supplierTelephone)
  const supplierEmail = data.supplierEmail || ''
  const showSupplierContact = supplierPhone || supplierEmail
  const dateIntervention = hasDate ? `le ${formatDate(data.dateTravaux)}` : ''
  const startTime = formatTime(data.heureDebut)
  const endTime = formatTime(data.heureFin)
  const horaires = startTime && endTime ? `de ${startTime} à ${endTime}` : ''

  // Couleur sémantique basée sur le type de document (Eco-Design)
  const documentType = (data.documentType || 'general') as string
  const semanticColor = colorOverrides?.[documentType]?.bg || DOCUMENT_TYPE_COLORS[documentType as DocumentType]?.bg || '#FFC300'

  return (
    <div
      id="document-preview-content"
      className="w-full h-full bg-white p-8 flex flex-col gap-5 text-black relative"
      style={{ fontFamily: 'Poppins, sans-serif', aspectRatio: '210/297' }}
    >
      {/* --- BLOC 1 : HEADER --- */}
      {/* Conteneur jaune étendu jusqu'aux bords et en haut */}
      <div className="-mx-8 -mt-8 px-8 pt-8 pb-6 bg-[#FFC300] shrink-0">
        {/* Header blanc par dessus */}
        <div className="w-full bg-white border-[3px] border-black rounded-[16px] h-20 flex items-center justify-center relative">

          {/* CERCLE LOGO */}
          <div className="absolute left-4 w-14 h-14 bg-[#FFC300] rounded-full flex items-center justify-center z-10 overflow-hidden">
            <img
              src="/images/logo-beamo.png"
              alt="Logo Beamô"
              className="w-12 h-12 object-contain"
            />
          </div>

          {/* Titre Beamô */}
          <h1 className="text-4xl tracking-tighter text-black">Beamô</h1>

          {/* Adresse à droite */}
          <div className="absolute right-4 text-right text-[10px] leading-tight text-black">
            <p>{agency.adresse || '2 Place Jean Paul II'}</p>
            <p>{[agency.codePostal || '27200', agency.ville || 'Vernon'].join(' ')}</p>
            <p>{formatPhone(agency.telephone) || '02 32 51 53 12'}</p>
          </div>
        </div>
      </div>

      {/* BLOC 2 : CONTEXTE - Couleur sémantique (porteur de l'information type) */}
      <div
        className="w-full border-[3px] border-black rounded-[20px] p-4 text-center shrink-0 flex flex-col justify-center min-h-[100px]"
        style={{ backgroundColor: semanticColor }}
      >
        <h2 className="text-2xl font-extrabold mb-1 whitespace-pre-line">{fullCoproName}</h2>
        <p className="text-xl font-bold">{docTitle}</p>
      </div>

      {/* BLOC 3 : GRILLE INFOS (Intervenant + Date) - Affiché uniquement si rempli */}
      {hasScheduleInfo && (
        <div className={`grid gap-5 shrink-0 h-24 ${showSupplier && hasDate ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {/* Intervenant (Blanc) */}
          {showSupplier && (
            <div className="bg-white border-[3px] border-black rounded-[20px] p-4 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-bold">{supplier}</span>
              {showSupplierContact && (
                <div className="text-sm mt-1 text-gray-700 flex flex-col">
                  {supplierPhone && <span>{supplierPhone}</span>}
                  {supplierEmail && <span>{supplierEmail}</span>}
                </div>
              )}
            </div>
          )}

          {/* Date (BLANC - Eco-Design : économie d'encre) */}
          {hasDate && (
            <div className="bg-white border-[3px] border-black rounded-[20px] p-4 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-extrabold" style={{ color: (semanticColor !== '#FFC300' && semanticColor !== '#FFFFFF') ? semanticColor : '#000' }}>{dateIntervention}</span>
              {horaires && <span className="text-lg font-bold">{horaires}</span>}
            </div>
          )}
        </div>
      )}

      {/* BLOC 4 : MESSAGE (Flexible) */}
      <div className="w-full bg-white border-[3px] border-black rounded-[20px] flex-1 p-8 relative overflow-hidden">
        <div className="text-2xl font-bold leading-relaxed whitespace-pre-wrap text-black">
          {description}
        </div>

        {data.notes && (
          <div className="mt-8 pt-6 border-t-[3px] border-black">
            <span className="font-bold block mb-2 text-lg">Note importante :</span>
            <p className="text-lg font-medium">{data.notes}</p>
          </div>
        )}
      </div>

      {/* BLOC 5 : FOOTER - Mentions légales */}
      <div className="shrink-0 pt-2 border-t border-gray-200">
        <p className="text-[7px] leading-tight text-gray-600 text-justify">
          {generateDynamicLegalMentions(agency)}
        </p>
      </div>
    </div>
  )
}
