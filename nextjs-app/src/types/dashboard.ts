// Types pour le dashboard KPIs Beamo

export interface SituationActuelle {
  caAnnuel: number
  lotsGeres: number
  coprosSignees: number
  prixMoyenLot: number
  tailleMoyenne: number
  capaciteRestante: number
}

export interface Projections {
  caMoyenCopro: number
  coprosNeeded60k: number
  coprosNeeded100k: number
  lotsNeeded60k: number
  lotsNeeded100k: number
}

export interface PipelineProspects {
  caProspects: number
  lotsProspects: number
  nbProspects: number
  prixMoyenLotProspect: number
  tailleMoyenneProspect: number
}

export interface TotalPotentiel {
  caTotalPotentiel: number
  lotsTotalPotentiel: number
  coprosTotalPotentiel: number
}

export interface DashboardKPIs {
  situationActuelle: SituationActuelle
  projections: Projections
  pipelineProspects: PipelineProspects
  totalPotentiel: TotalPotentiel
  updatedAt: string
}
