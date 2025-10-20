// Types pour l'intégration des réseaux sociaux et OAuth
// Date: 20 octobre 2025

export type SocialPlatform = 'facebook' | 'linkedin' | 'instagram'

// Interface principale pour une intégration sociale (mapping table BDD)
export interface SocialIntegration {
  id: string
  user_id: string
  platform: SocialPlatform

  // Tokens OAuth (chiffrés en BDD, déchiffrés en mémoire)
  access_token: string
  refresh_token?: string
  token_expires_at?: string

  // Informations du compte connecté
  platform_user_id: string
  platform_username?: string
  platform_name?: string
  platform_email?: string

  // Métadonnées
  scope?: string[]
  is_active: boolean
  last_used_at?: string
  error_count: number
  last_error_message?: string

  // Audit
  created_at: string
  updated_at: string
}

// Configuration OAuth par plateforme
export interface OAuthConfig {
  platform: SocialPlatform
  client_id: string
  client_secret: string
  redirect_uri: string
  authorization_url: string
  token_url: string
  scopes: string[]
  user_info_url: string
}

// Requête pour initier OAuth
export interface OAuthInitiateRequest {
  platform: SocialPlatform
  redirect_to?: string // URL de redirection après succès
}

// Réponse OAuth initiate
export interface OAuthInitiateResponse {
  authorization_url: string
  state: string // Token CSRF
}

// Requête callback OAuth
export interface OAuthCallbackRequest {
  code: string
  state: string
  platform: SocialPlatform
}

// Informations utilisateur récupérées depuis la plateforme
export interface PlatformUserInfo {
  id: string
  username?: string
  name?: string
  email?: string
  profile_url?: string
  avatar_url?: string
}

// Résultat d'une publication
export interface PublishResult {
  success: boolean
  platform: SocialPlatform
  post_id?: string
  post_url?: string
  error?: string
  published_at?: string
}

// Paramètres de publication
export interface PublishParams {
  article_id: string
  article_title: string
  article_slug: string
  article_excerpt?: string
  article_content: string
  featured_image_url?: string
  tags?: string[]
  author_id: string
  custom_message?: string // Message personnalisé (override template)
}

// Template de message
export interface MessageTemplate {
  template: string // Avec variables {{title}}, {{excerpt}}, {{url}}
  include_hashtags: boolean
  max_length?: number // Limite de caractères selon plateforme
}

// Paramètres de plateforme
export interface PlatformSettings {
  enabled: boolean
  default_message_template?: string
  include_hashtags?: boolean
  custom_settings?: Record<string, any> // Settings spécifiques à la plateforme
}

// Extension de UserMetadata (déjà défini ailleurs)
export interface ExtendedUserMetadata {
  social_publishing_preferences?: {
    enabled: boolean
    use_unified_hours: boolean
    unified_hours: string[]
    schedule: Record<string, { enabled: boolean; hours: string[] }>
  }
  platform_settings?: Record<SocialPlatform, PlatformSettings>
}

// Résultat de test de connexion
export interface ConnectionTestResult {
  success: boolean
  platform: SocialPlatform
  message: string
  platform_user_info?: PlatformUserInfo
  error?: string
}

// Request pour tester une connexion
export interface TestConnectionRequest {
  platform: SocialPlatform
  integration_id: string
}

// Request pour déconnecter une plateforme
export interface DisconnectPlatformRequest {
  platform: SocialPlatform
  revoke_access?: boolean // Si true, révoque aussi côté plateforme
}

// Response pour liste des intégrations
export interface GetIntegrationsResponse {
  integrations: SocialIntegration[]
  count: number
}

// Statistiques d'une intégration
export interface IntegrationStats {
  platform: SocialPlatform
  total_posts: number
  last_post_at?: string
  success_rate: number
  is_healthy: boolean
  days_until_expiration?: number
}

// Erreur OAuth
export interface OAuthError {
  error: string
  error_description?: string
  error_uri?: string
}

// État CSRF
export interface CSRFState {
  token: string
  user_id: string
  platform: SocialPlatform
  redirect_to?: string
  created_at: number
  expires_at: number
}

// Constantes
export const PLATFORM_NAMES: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  instagram: 'Instagram'
}

export const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  facebook: 'bg-blue-600 text-white',
  linkedin: 'bg-blue-700 text-white',
  instagram: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white'
}

export const PLATFORM_SCOPES: Record<SocialPlatform, string[]> = {
  facebook: ['pages_manage_posts', 'pages_read_engagement', 'public_profile'],
  linkedin: ['w_member_social', 'r_liteprofile'],
  instagram: ['instagram_basic', 'instagram_content_publish']
}

export const MESSAGE_MAX_LENGTH: Record<SocialPlatform, number> = {
  facebook: 63206, // Limite très élevée
  linkedin: 3000,
  instagram: 2200
}

// Helpers de validation
export function isValidPlatform(platform: string): platform is SocialPlatform {
  return ['facebook', 'linkedin', 'instagram'].includes(platform)
}

export function isTokenExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) <= new Date()
}

export function isTokenExpiringSoon(expiresAt?: string, daysBefor = 7): boolean {
  if (!expiresAt) return false
  const expiryDate = new Date(expiresAt)
  const warningDate = new Date()
  warningDate.setDate(warningDate.getDate() + daysBefor)
  return expiryDate <= warningDate
}

export function getDaysUntilExpiration(expiresAt?: string): number | null {
  if (!expiresAt) return null
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffTime = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function getPlatformIconComponent(platform: SocialPlatform): string {
  return platform.charAt(0).toUpperCase() + platform.slice(1) // Facebook, LinkedIn, Instagram (pour Lucide icons)
}

export function getDefaultMessageTemplate(platform: SocialPlatform): string {
  const baseTemplate = `{{title}}

{{excerpt}}

🔗 Lire l'article complet: {{url}}`

  // Personnalisation par plateforme
  switch (platform) {
    case 'linkedin':
      return `📰 ${baseTemplate}\n\n#Immobilier #Copropriété #Beamô`
    case 'instagram':
      return `${baseTemplate}\n\n📸 Suivez-nous pour plus de conseils !`
    default:
      return baseTemplate
  }
}

// Fonction de validation des scopes
export function validateScopes(platform: SocialPlatform, grantedScopes: string[]): boolean {
  const requiredScopes = PLATFORM_SCOPES[platform]
  return requiredScopes.every(scope => grantedScopes.includes(scope))
}

// Fonction pour formater les erreurs OAuth
export function formatOAuthError(error: OAuthError): string {
  if (error.error_description) {
    return error.error_description
  }
  return `OAuth Error: ${error.error}`
}
