'use client'

import { useState, useRef, useLayoutEffect, useCallback, useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Volume2,
  ShieldCheck,
  ArrowUpDown,
  Footprints,
  DoorOpen,
  LayoutGrid,
  Trash2,
  Bike,
  Fence,
  Sun,
  TreePine,
  Trees,
  CarFront,
  ParkingCircle,
  UserRound,
  PawPrint,
  AlertTriangle,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { BuildingFeatures, AgencyInfo } from '@/schemas/document'
import { BEAMO_LEGAL_INFO, generateLegalMentions } from '@/lib/mock-data'

interface ReglementInterieurData {
  buildingNom: string
  buildingAdresse: string
  buildingCodePostal?: string
  buildingVille?: string
  features: Partial<BuildingFeatures>
  showPreambule?: boolean
  preambuleContent?: string
  showSecurite?: boolean
  securiteContent?: string
  agency?: AgencyInfo
  articleContents?: Record<string, string>
}

function toRoman(num: number): string {
  const pairs: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let result = ''
  for (const [value, numeral] of pairs) {
    while (num >= value) {
      result += numeral
      num -= value
    }
  }
  return result
}

export function formatPhone(phone: string | undefined): string {
  if (!phone) return ''
  let cleaned = phone.replace(/[\s\-\.]/g, '')
  if (cleaned.startsWith('+33')) {
    cleaned = '0' + cleaned.slice(3)
  }
  if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
  }
  return phone
}

// Textes juridiques des articles
export const ARTICLES = {
  preambule: {
    title: 'BRUITS & NUISANCES',
    icon: Volume2,
    content: "Tout comportement bruyant est à éviter entre 22 h et 7 h. Les talons, pieds de chaises, appareils de télévision, radio et hi-fi doivent être réglés de façon à ne pas gêner le voisinage. Conformément à l'arrêté préfectoral relatif à la lutte contre le bruit de voisinage, les activités bruyantes (travaux) sont autorisées : en semaine de 8 h 30 à 12 h puis de 14 h 30 à 19 h 30 ; le samedi de 9 h à 12 h et de 14 h 30 à 19 h ; les dimanches et jours fériés de 10 h à 12 h (travaux légers uniquement). Le tapage nocturne (22 h - 7 h) est sanctionnable sans condition de durée ni de répétition. En cas de nuisance constatée, il convient de joindre les forces de l'ordre avant le syndic de copropriété.",
  },
  securite: {
    title: 'SÉCURITÉ',
    icon: ShieldCheck,
    content: "Veillez à ne pas ouvrir à une personne que vous n'avez pas formellement identifiée ou qui ne vous rend pas visite. Assurez-vous que les portes d'accès soient bien fermées après votre passage. N'hésitez pas à signaler toute anomalie de fonctionnement au syndic ou, en cas d'urgence, aux forces de l'ordre.",
  },
  degradations: {
    title: 'DÉGRADATIONS',
    icon: AlertTriangle,
    content: "L'occupant supporte les frais résultant des détériorations ou dommages causés par lui-même, un membre de sa famille ou son animal de compagnie. Il est strictement interdit de fumer dans les parties communes. Lorsque la personne responsable ne peut être identifiée, les frais de remplacement ou de réparation sont répartis sur l'ensemble des copropriétaires.",
  },
  elevator: {
    key: 'hasElevator',
    title: 'ASCENSEUR',
    icon: ArrowUpDown,
    content: "L'ascenseur est interdit aux enfants non accompagnés de moins de 12 ans. La charge maximale indiquée doit être strictement respectée. Les déménagements par ascenseur sont interdits sans pose de protections spécifiques. En cas de panne, utilisez le bouton d'appel d'urgence et ne tentez en aucun cas de sortir par vos propres moyens.",
  },
  stairs: {
    key: 'hasStairs',
    title: 'ESCALIERS',
    icon: Footprints,
    content: "Les escaliers doivent rester libres de tout encombrement pour des raisons de sécurité incendie. L'entreposage de poussettes, vélos, cartons, poubelles ou tout autre objet est strictement interdit, même de manière temporaire. L'immeuble étant entretenu par une société de nettoyage, il est demandé de respecter leur travail.",
  },
  corridors: {
    key: 'hasCorridors',
    title: 'COULOIRS',
    icon: DoorOpen,
    content: "Les couloirs sont des espaces de circulation et d'évacuation. Ils doivent rester dégagés en permanence et ne peuvent être utilisés à des fins personnelles (dépôt de chaussures, poussettes, mobilier, stockage d'ordures ménagères). Interdiction d'y entreposer tout objet personnel.",
  },
  landings: {
    key: 'hasLandings',
    title: 'PALIERS',
    icon: LayoutGrid,
    content: "Les paliers, au même titre que les escaliers et couloirs, doivent rester libres en tout temps. Les paillassons doivent être encastrés ou de faible épaisseur. Interdiction formelle d'y laisser des chaussures, meubles, plantes volumineuses ou sacs poubelles. Les décorations sont tolérées si elles ne gênent pas le passage ni l'évacuation.",
  },
  trashRoom: {
    key: 'hasTrashRoom',
    title: 'DÉCHETS MÉNAGERS',
    icon: Trash2,
    content: "Les ordures ménagères doivent être déposées dans des sacs hermétiquement clos, à l'intérieur des conteneurs prévus à cet effet. Aucun déchet ne doit être laissé au-dessus ou à côté des conteneurs. Le tri sélectif est obligatoire conformément aux consignes municipales ; les bouteilles en verre sont à déposer dans les conteneurs dédiés. Il est interdit d'entreposer des sacs poubelles sur les paliers. Le dépôt d'encombrants (matelas, électroménager, cartons, mobilier) dans les parties communes est prohibé : ils doivent être amenés directement en déchetterie, sous peine de facturation de leur retrait. Il est interdit de jeter quoi que ce soit par les fenêtres.",
  },
  bikeRoom: {
    key: 'hasBikeRoom',
    title: 'LOCAL VÉLOS',
    icon: Bike,
    content: "Le local est réservé aux cycles et trottinettes des résidents. Chaque vélo doit être attaché à un point fixe. L'entreposage de tout autre matériel est interdit. Le syndic décline toute responsabilité en cas de vol ou de dégradation.",
  },
  balconies: {
    key: 'hasBalconies',
    title: 'BALCONS & LOGGIAS',
    icon: Fence,
    content: "Les balcons et loggias doivent être maintenus en parfait état d'entretien. Il est interdit d'y faire supporter aux dalles et murs une charge supérieure à leur résistance. L'étendage de linge sur les fenêtres et balcons est proscrit, de même que leur encombrement par des vélos. Les grills, barbecues et installations similaires y sont formellement interdits. Il est interdit de secouer tapis ou serpillières et de jeter des détritus ou eaux usées par-dessus la rambarde. Les jardinières doivent être fixées côté intérieur. D'une manière générale, rien ne doit porter atteinte à l'harmonie de l'immeuble.",
  },
  terraces: {
    key: 'hasTerraces',
    title: 'TERRASSES',
    icon: Sun,
    content: "Les terrasses doivent être maintenues en parfait état d'entretien par l'occupant (nettoyage, désherbage, traitement des mousses). Il est interdit d'y faire supporter aux dalles et murs une charge supérieure à leur résistance. Aucune construction fixe (pergola, véranda, abri) ne peut être édifiée sans autorisation préalable de l'Assemblée Générale. Les barbecues et installations similaires y sont formellement interdits.",
  },
  privateGarden: {
    key: 'hasPrivateGarden',
    title: 'JARDINS PRIVATIFS',
    icon: TreePine,
    content: "La tonte régulière et l'entretien des haies mitoyennes sont à la charge du résident. Les plantations ne doivent pas dépasser la hauteur réglementaire ni gêner les voisins (ombre, racines). Les feux de jardin sont interdits.",
  },
  commonGarden: {
    key: 'hasCommonGarden',
    title: 'ESPACES VERTS COMMUNS',
    icon: Trees,
    content: "Les espaces verts communs sont entretenus par le prestataire désigné par le syndic. Il est interdit d'y planter, cueillir ou dégrader les végétaux. Les jeux de ballon et les barbecues y sont interdits sauf autorisation expresse.",
  },
  privateParking: {
    key: 'hasPrivateParking',
    title: 'STATIONNEMENT & GARAGES',
    icon: CarFront,
    content: "Les emplacements de stationnement sont réservés aux véhicules de tourisme immatriculés ; il est interdit d'y remiser camionnettes ou véhicules similaires. Les travaux de mécanique, vidange et lavage y sont prohibés. La vitesse est limitée à 10 km/h. L'arrêt et le stationnement sont interdits dans les voies de circulation et en dehors des emplacements prévus. Les véhicules en état d'épave seront enlevés aux frais de leur propriétaire. Conformément à l'article L. 325-12 du Code de la route, les véhicules laissés sans droit dans les lieux privés peuvent être mis en fourrière à la demande du maître des lieux. Le portail doit être ouvert exclusivement par télécommande ; la clé de déverrouillage est réservée à la société d'entretien et aux personnes habilitées en cas de panne. Interdiction de stocker pneus, cartons, bidons ou tout matériel inflammable (risque incendie).",
  },
  visitorParking: {
    key: 'hasVisitorParking',
    title: 'PARKING VISITEURS',
    icon: ParkingCircle,
    content: "Strictement réservé aux invités ponctuels des résidents. Durée maximale de stationnement : 24 heures. Les véhicules ventouses feront l'objet d'une mise en fourrière aux frais du propriétaire conformément à l'article L. 325-12 du Code de la route.",
  },
  caretaker: {
    key: 'hasCaretaker',
    title: 'GARDIEN / CONCIERGE',
    icon: UserRound,
    content: "Le gardien assure la surveillance générale et l'entretien des parties communes. Respectez ses horaires de travail et de repos affichés en loge. Pour toute réclamation urgente en dehors de ces horaires, contactez le syndic.",
  },
  pets: {
    key: 'hasPets',
    title: 'ANIMAUX DOMESTIQUES',
    icon: PawPrint,
    content: "Les animaux domestiques ne doivent en aucun cas être source de gêne pour les voisins. Il est interdit de les laisser aboyer, errer ou faire leurs besoins à l'intérieur des parties communes. Les animaux doivent être tenus en laisse ou portés dans les espaces communs. Chaque propriétaire veillera à ramasser les déjections de son animal et à nettoyer immédiatement en cas d'incident dans les parties communes.",
  },
}

// --- Sub-components ---

export function HeaderBlock({ agency }: { agency?: AgencyInfo }) {
  return (
    <div className="px-8 pt-8 pb-6 bg-[#FFC300] shrink-0">
      <div className="w-full bg-white border-[3px] border-black rounded-[16px] h-20 flex items-center justify-center relative">
        <div className="absolute left-4 w-14 h-14 bg-[#FFC300] rounded-full flex items-center justify-center z-10 overflow-hidden">
          <img
            src="/images/logo-beamo.png"
            alt="Logo Beamô"
            className="w-12 h-12 object-contain"
          />
        </div>
        <h1 className="text-4xl tracking-tighter text-black">Beamô</h1>
        <div className="absolute right-4 text-right text-[10px] leading-tight text-black">
          <p>{agency?.adresse || '2 Place Jean Paul II'}</p>
          {agency?.adresseL2 && <p>{agency.adresseL2}</p>}
          {agency?.adresseL3 && <p>{agency.adresseL3}</p>}
          <p>{[agency?.codePostal || '27200', agency?.ville || 'Vernon'].join(' ')}</p>
          <p>{formatPhone(agency?.telephone) || '02 32 51 53 12'}</p>
        </div>
      </div>
    </div>
  )
}

function SubHeaderBlock({ buildingNom, fullAddress }: { buildingNom: string; fullAddress: string }) {
  return (
    <div className="mx-8 mt-5 bg-white border-[3px] border-black rounded-[20px] p-4 text-center shrink-0">
      <h2 className="text-2xl font-extrabold tracking-wide">RÈGLEMENT INTÉRIEUR</h2>
      <div className="mt-2 text-lg font-bold">{buildingNom || 'Nom de la copropriété'}</div>
      {fullAddress && <p className="text-sm text-gray-600">{fullAddress}</p>}
    </div>
  )
}

function getLegalMentions(agency?: AgencyInfo): string {
  if (agency?.legal?.siret) {
    const legal = agency.legal
    const agencyName = agency.nom || 'Beamô'
    const address = agency.adresse ? `${agency.adresse} ${agency.codePostal} ${agency.ville}` : ''
    const correspondance = [agency.adresseL2, agency.adresseL3].filter(Boolean).join(' ').trim()
    const correspondanceText = correspondance ? ` | Toute correspondance : ${correspondance}` : ''
    const siren = legal.siret ? legal.siret.substring(0, 9).replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') : ''

    return `Enseigne ${agencyName} | SASU BEAMO IMMOBILIER au capital de ${legal.capital || '2 500'} € dont le siège social est situé au 8 rue du général Leclerc 27950 Saint-Marcel | Cabinet au ${address || '2 Place Jean Paul II 27200 Vernon'}${correspondanceText} | SIREN ${siren} ${legal.rcs || 'Évreux'} | Numéro TVA intracommunautaire ${legal.tvaNumber || 'FR33989101829'}. Carte professionnelle portant la mention "Syndic de Copropriété" CPI27012025000000013, délivrée par CCI PORTE DE NORMANDIE (27), conformément à la (Loi n° 70-9 du 02/01/1970). Titulaire d'une assurance en responsabilité civile professionnelle auprès de ALLIANZ M. RAYEUR Guillaume 4 rue Carnot 27200 Vernon, et d'une garantie financière auprès de la SO.CA.F sise 26 avenue de Suffren 75015 Paris d'un montant de 30 000 €. Document propriété de la société BEAMO IMMOBILIER, ne pas reproduire.`
  }
  return generateLegalMentions(BEAMO_LEGAL_INFO)
}

export function FooterBlock({ agency }: { agency?: AgencyInfo }) {
  return (
    <div className="mx-8 mb-4 pt-2 border-t border-gray-200 shrink-0">
      <p className="text-[7px] leading-tight text-gray-600 text-justify">
        {getLegalMentions(agency)}
      </p>
    </div>
  )
}

function ArticleBlock({ title, content, icon: Icon, number }: { title: string; content: string; icon?: LucideIcon; number?: number }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-base font-extrabold uppercase tracking-wide mb-2 text-black">
        {Icon && <Icon className="h-5 w-5 shrink-0" />}
        {number != null && <span>{toRoman(number)} -</span>}
        {title}
      </h3>
      <div className="text-sm leading-relaxed text-gray-800">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-4 mb-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-4 mb-1">{children}</ol>,
            li: ({ children }) => <li className="mb-0.5">{children}</li>,
            strong: ({ children }) => <strong className="font-bold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}

// --- Constants ---
const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123
// Vertical paddings/gaps around the body box inside a page
// header has pt-8 (32) built-in, body box has mx-8 mt-5 (margin top 20px from sub-header gap)
// body box: border 3px, padding 32px (p-8), so total box overhead = 6 (border) + 64 (padding)
// gap between sub-header and body = mt-5 = 20px (from the gap in flex column)
// gap between body and footer = remaining flex space, but footer is at bottom
const BODY_BOX_BORDER = 6 // 3px * 2
const BODY_BOX_PADDING = 64 // p-8 = 32px * 2
const BODY_ARTICLES_GAP = 24 // space-y-6 = 1.5rem = 24px
const PAGE_FLEX_GAP = 20 // gap-5 = 1.25rem = 20px

export function ReglementInterieurTemplate({ data }: { data: ReglementInterieurData }) {
  const { buildingNom, buildingAdresse, buildingCodePostal, buildingVille, features } = data
  const showPreambule = data.showPreambule !== false
  const showSecurite = data.showSecurite !== false

  const fullAddress = [buildingAdresse, buildingCodePostal, buildingVille]
    .filter(Boolean)
    .join(' ')

  // Build the list of active articles
  const activeArticles = Object.entries(ARTICLES)
    .filter(([key, article]) => {
      if (key === 'preambule') return showPreambule
      if (key === 'securite') return showSecurite
      if (key === 'degradations') return true
      if ('key' in article) {
        return features[article.key as keyof BuildingFeatures] === true
      }
      return false
    })
    .map(([key, article]) => {
      // Priority: form override > articleContents (Réglages) > ARTICLES constant
      if (key === 'preambule' && data.preambuleContent) {
        return { ...article, content: data.preambuleContent }
      }
      if (key === 'securite' && data.securiteContent) {
        return { ...article, content: data.securiteContent }
      }
      if (data.articleContents?.[key]) {
        return { ...article, content: data.articleContents[key] }
      }
      return article
    })

  // Stable keys for changes that require re-pagination
  const featuresKey = useMemo(() => JSON.stringify(features), [features])
  const articleContentsKey = useMemo(() => JSON.stringify(data.articleContents || {}), [data.articleContents])

  // Refs for measurement
  const measureRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const subHeaderRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const articleRefs = useRef<(HTMLDivElement | null)[]>([])

  const [pages, setPages] = useState<{ title: string; content: string; icon?: LucideIcon }[][]>([])
  const [isReady, setIsReady] = useState(false)

  const setArticleRef = useCallback((el: HTMLDivElement | null, index: number) => {
    articleRefs.current[index] = el
  }, [])

  useLayoutEffect(() => {
    if (activeArticles.length === 0) {
      setPages([[]])
      setIsReady(true)
      return
    }

    // When deps change, reset to measurement mode
    setIsReady(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeArticles.length, showPreambule, showSecurite, data.preambuleContent, data.securiteContent, featuresKey, articleContentsKey])

  // Separate effect: run measurement once the measurement container is in the DOM
  useLayoutEffect(() => {
    if (isReady || activeArticles.length === 0) return

    const measure = () => {
      const headerH = headerRef.current?.getBoundingClientRect().height || 0
      const subHeaderH = subHeaderRef.current?.getBoundingClientRect().height || 0
      const footerH = footerRef.current?.getBoundingClientRect().height || 0

      // Available height for the body box content (inside border + padding)
      const fixedChrome = headerH + subHeaderH + footerH
        + PAGE_FLEX_GAP * 3
        + BODY_BOX_BORDER + BODY_BOX_PADDING
      const availableBodyHeight = PAGE_HEIGHT - fixedChrome

      // Measure each article's height
      const articleHeights = activeArticles.map((_, i) => {
        const el = articleRefs.current[i]
        return el ? el.getBoundingClientRect().height : 0
      })

      // Greedy pagination
      const result: { title: string; content: string; icon?: LucideIcon }[][] = [[]]
      let currentPageHeight = 0

      for (let i = 0; i < activeArticles.length; i++) {
        const articleH = articleHeights[i]
        const gap = result[result.length - 1].length > 0 ? BODY_ARTICLES_GAP : 0

        if (currentPageHeight + gap + articleH > availableBodyHeight && result[result.length - 1].length > 0) {
          result.push([])
          currentPageHeight = 0
        }

        const gapForThis = result[result.length - 1].length > 0 ? BODY_ARTICLES_GAP : 0
        result[result.length - 1].push(activeArticles[i])
        currentPageHeight += gapForThis + articleH
      }

      setPages(result)
      setIsReady(true)
    }

    // Wait for fonts then measure
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(measure)
        })
      })
    } else {
      requestAnimationFrame(measure)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, activeArticles.length])

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif' }} className="text-black">
      {/* Hidden measurement container - same width, same styles, off-screen */}
      {!isReady && (
        <div
          ref={measureRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -99999,
            left: -99999,
            width: PAGE_WIDTH,
            opacity: 0,
            pointerEvents: 'none',
          }}
        >
          {/* Measure header */}
          <div ref={headerRef}>
            <HeaderBlock agency={data.agency} />
          </div>
          {/* Measure sub-header */}
          <div ref={subHeaderRef}>
            <SubHeaderBlock buildingNom={buildingNom} fullAddress={fullAddress} />
          </div>
          {/* Measure footer */}
          <div ref={footerRef}>
            <FooterBlock agency={data.agency} />
          </div>
          {/* Measure each article individually - no space-y to avoid margin in measurements */}
          <div className="mx-8 border-[3px] border-black rounded-[20px] p-8">
            {activeArticles.map((article, index) => (
              <div key={index} ref={(el) => setArticleRef(el, index)}>
                <ArticleBlock title={article.title} content={article.content} icon={article.icon} number={index + 1} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rendered pages */}
      {isReady && pages.map((pageArticles, pageIndex) => {
        // Compute global article offset for this page
        const globalOffset = pages.slice(0, pageIndex).reduce((sum, p) => sum + p.length, 0)
        return (
        <div key={pageIndex}>
          <div
            className="reglement-page bg-white flex flex-col"
            style={{
              width: PAGE_WIDTH,
              height: PAGE_HEIGHT,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <HeaderBlock agency={data.agency} />

            {/* Sub-header */}
            <SubHeaderBlock buildingNom={buildingNom} fullAddress={fullAddress} />

            {/* Body - articles */}
            <div className="mx-8 mt-5 bg-white border-[3px] border-black rounded-[20px] p-8 overflow-hidden">
              {pageArticles.length > 0 ? (
                <div className="space-y-6">
                  {pageArticles.map((article, articleIndex) => (
                    <ArticleBlock key={articleIndex} title={article.title} content={article.content} icon={article.icon} number={globalOffset + articleIndex + 1} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 italic">
                  Sélectionnez des équipements dans le formulaire pour ajouter les articles correspondants.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-auto">
              <FooterBlock agency={data.agency} />
            </div>
          </div>

          {/* Gap between pages (hidden at print) */}
          {pageIndex < pages.length - 1 && (
            <div className="page-gap" style={{ height: 32 }} />
          )}
        </div>
        )
      })}

      {/* Show single empty page while measuring */}
      {!isReady && (
        <div
          className="reglement-page bg-white flex flex-col"
          style={{
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
            overflow: 'hidden',
          }}
        >
          <HeaderBlock agency={data.agency} />
          <SubHeaderBlock buildingNom={buildingNom} fullAddress={fullAddress} />
          <div className="mx-8 mt-5 bg-white border-[3px] border-black rounded-[20px] p-8 overflow-hidden">
            <div className="space-y-6">
              {activeArticles.map((article, index) => (
                <ArticleBlock key={index} title={article.title} content={article.content} icon={article.icon} number={index + 1} />
              ))}
            </div>
          </div>
          <div className="mt-auto">
            <FooterBlock agency={data.agency} />
          </div>
        </div>
      )}
    </div>
  )
}
