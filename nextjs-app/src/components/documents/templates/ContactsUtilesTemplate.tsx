'use client'

import {
  Building2,
  UserRound,
  Landmark,
  Zap,
  Droplets,
  Recycle,
  Wrench,
  HardHat,
  PhoneCall,
  Phone,
  Mail,
  MapPin,
  Info,
  User,
  Users,
  Shield,
  Key,
  Clock,
  Car,
  Bike,
  Leaf,
  Flame,
  Package,
  Star,
} from 'lucide-react'
import type { ContactsUtilesData, ContractEntry, CustomContactBlock } from '@/schemas/document'

const CUSTOM_ICON_MAP: Record<string, React.ElementType> = {
  Info, Phone, Mail, MapPin, Building2, User, Users, Wrench,
  Shield, Key, Clock, Car, Bike, Leaf, Zap, Droplets, Flame, Package, Star,
}
import { HeaderBlock, FooterBlock, formatPhone } from './ReglementInterieurTemplate'

const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123

function ContactCard({
  icon: Icon,
  title,
  lines,
  className = '',
  iconColor,
}: {
  icon: React.ElementType
  title: string
  lines: (string | undefined)[]
  className?: string
  iconColor?: string
}) {
  const filteredLines = lines.filter(Boolean) as string[]
  return (
    <div className={`border-2 border-black rounded-xl p-3 flex flex-col ${className}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="h-4 w-4 shrink-0" style={iconColor ? { color: iconColor } : undefined} />
        <h3 className="text-xs font-extrabold uppercase tracking-wide">{title}</h3>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        {filteredLines.length > 0 ? (
          filteredLines.map((line, i) => (
            <p key={i} className="text-[11px] leading-snug text-gray-800">
              {line}
            </p>
          ))
        ) : (
          <p className="text-[10px] text-gray-400 italic">Non renseigné</p>
        )}
      </div>
    </div>
  )
}

function UrgencesCard({ urgences }: { urgences: { label: string; numero: string }[] }) {
  return (
    <div className="border-2 border-orange-500 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <PhoneCall className="h-4 w-4 text-orange-500 shrink-0" />
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-black">Urgences</h3>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
        {urgences.map((u, i) => (
          <p key={i} className="text-[11px] leading-snug text-black">
            <span className="font-bold">{u.numero}</span>
            <span> – {u.label}</span>
          </p>
        ))}
      </div>
    </div>
  )
}

function ContractsTable({ contracts }: { contracts: ContractEntry[] }) {
  const fontSize = contracts.length > 8 ? 'text-[9px]' : 'text-[11px]'
  return (
    <div className="border-2 border-black rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <Wrench className="h-4 w-4 shrink-0" />
        <h3 className="text-xs font-extrabold uppercase tracking-wide">
          Contrats d&apos;entretien
        </h3>
      </div>
      {contracts.length > 0 ? (
        <table className="w-full">
          <tbody>
            {contracts.map((c, i) => (
              <tr key={i} className={`${fontSize} ${i > 0 ? 'border-t border-gray-200' : ''}`}>
                <td className="py-0.5 font-semibold w-[35%]">{c.equipmentLabel}</td>
                <td className="py-0.5 w-[40%]">{c.supplierName}</td>
                <td className="py-0.5 text-right w-[25%]">
                  {formatPhone(c.supplierPhone)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-[10px] text-gray-400 italic">Aucun contrat renseigné</p>
      )}
    </div>
  )
}

function ConseillersSection({
  conseillers,
}: {
  conseillers: { nom: string; specialite: string; telephone?: string }[]
}) {
  if (conseillers.length === 0) return null
  return (
    <div className="border-2 border-black rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <HardHat className="h-4 w-4 shrink-0" />
        <h3 className="text-xs font-extrabold uppercase tracking-wide">
          Besoin de travaux dans votre logement ?
        </h3>
      </div>
      {conseillers.map((c, i) => (
        <p key={i} className="text-[11px] leading-snug text-gray-800">
          <span className="font-semibold">{c.specialite}</span> : {c.nom}
          {c.telephone && ` – ${formatPhone(c.telephone)}`}
        </p>
      ))}
    </div>
  )
}

export function ContactsUtilesTemplate({ data }: { data: ContactsUtilesData }) {
  const fullAddress = [data.buildingAdresse, data.buildingCodePostal, data.buildingVille]
    .filter(Boolean)
    .join(' ')

  const showEau = data.eauPrivative
  const showUrgences = data.showUrgences !== false && (data.urgences?.length ?? 0) > 0
  const showEnergie = data.showEnergie !== false
  const showContracts = data.showContracts !== false && data.contracts.length > 0
  const showConseillers = data.showConseillers !== false && data.conseillers.length > 0

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif' }} className="text-black">
      <div
        className="contacts-utiles-page bg-white flex flex-col"
        style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, overflow: 'hidden' }}
      >
        {/* Header */}
        <HeaderBlock agency={data.agency} />

        {/* Sub-header */}
        <div className="mx-8 mt-4 bg-white border-[3px] border-black rounded-[20px] p-3 text-center shrink-0">
          <h2 className="text-xl font-extrabold tracking-wide">LES CONTACTS UTILES</h2>
          <p className="text-sm font-bold mt-1">
            {data.buildingNom || 'Nom de la copropriété'}
            {data.buildingVille && ` – ${data.buildingVille}`}
          </p>
          {fullAddress && <p className="text-xs text-gray-600">{fullAddress}</p>}
        </div>

        {/* Body */}
        <div className="mx-8 mt-3 flex-1 flex flex-col gap-2.5 overflow-hidden">

          {/* Urgences */}
          {showUrgences && <UrgencesCard urgences={data.urgences!} />}

          {/* Row 1: Syndic + Gestionnaire */}
          <div className="grid grid-cols-2 gap-2.5">
            <ContactCard icon={Building2} title="Votre syndic"
              lines={[data.syndicNom, formatPhone(data.syndicTelephone), data.syndicEmail, data.syndicAdresse]}
            />
            <ContactCard icon={UserRound} title="Votre gestionnaire"
              lines={[data.gestionnaireNom, formatPhone(data.gestionnaireTelephone), data.gestionnaireEmail]}
            />
          </div>

          {/* Row 2: Mairie + Énergie (ENEDIS + Eau optionnelle) */}
          <div className="grid grid-cols-2 gap-2.5">
            <ContactCard icon={Landmark} title="Mairie"
              lines={[data.mairieName, formatPhone(data.mairiePhone)]}
            />
            {showEnergie && (
              <div className="border-2 border-black rounded-xl p-3 flex flex-col">
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap className="h-4 w-4 shrink-0" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wide">Énergie</h3>
                </div>
                <div className="flex-1 flex flex-col justify-center gap-1">
                  <p className="text-[11px] leading-snug text-gray-800">
                    <span className="font-semibold">ENEDIS</span> – {data.enedisPhone}
                  </p>
                  {showEau && data.eauFournisseur && (
                    <p className="text-[11px] leading-snug text-gray-800">
                      <span className="font-semibold">{data.eauFournisseur}</span>
                      {data.eauPhone && ` – ${formatPhone(data.eauPhone)}`}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Déchetterie */}
          <ContactCard icon={Recycle} title="Déchetterie"
            lines={[data.dechetterieName, formatPhone(data.dechetteriePhone), data.dechetterieAdresse, data.dechetterieHoraires]}
          />

          {/* Contracts */}
          {showContracts && <ContractsTable contracts={data.contracts} />}

          {/* Conseillers */}
          {showConseillers && <ConseillersSection conseillers={data.conseillers} />}

          {/* Blocs personnalisés */}
          {data.customBlocks?.filter(b => b.show !== false).map((block: CustomContactBlock) => {
            const Icon = CUSTOM_ICON_MAP[block.icon] || Info
            return (
              <ContactCard
                key={block.id}
                icon={Icon}
                title={block.title || 'Contact'}
                lines={block.lines}
              />
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-2">
          <FooterBlock agency={data.agency} />
        </div>
      </div>
    </div>
  )
}
