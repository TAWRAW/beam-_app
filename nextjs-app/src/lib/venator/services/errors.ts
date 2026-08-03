export type VenatorErrorCode = 'not_found' | 'conflict' | 'invalid' | 'forbidden'
export class VenatorError extends Error {
  constructor(public code: VenatorErrorCode, message: string) { super(message); this.name = 'VenatorError' }
}
export const httpStatus: Record<VenatorErrorCode, number> = { not_found: 404, conflict: 409, invalid: 400, forbidden: 403 }
