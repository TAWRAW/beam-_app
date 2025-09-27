/**
 * Utilitaires pour traiter le contenu Markdown
 */

/**
 * Extrait la première image du contenu Markdown
 * @param content - Le contenu markdown
 * @returns L'URL de la première image trouvée ou null
 */
export function extractFirstImage(content: string): string | null {
  if (!content) return null

  // Regex pour capturer les images markdown : ![alt](url)
  const imageRegex = /!\[.*?\]\(([^)]+)\)/
  const match = content.match(imageRegex)

  if (match && match[1]) {
    // Nettoyer l'URL (enlever les espaces et quotes éventuelles)
    let imageUrl = match[1].trim()

    // Enlever les quotes si présentes
    if ((imageUrl.startsWith('"') && imageUrl.endsWith('"')) ||
        (imageUrl.startsWith("'") && imageUrl.endsWith("'"))) {
      imageUrl = imageUrl.slice(1, -1)
    }

    return imageUrl
  }

  return null
}

/**
 * Obtient l'image de couverture effective (featured_image_url ou première image du contenu)
 * @param featured_image_url - L'image de couverture définie
 * @param content - Le contenu markdown
 * @returns L'URL de l'image à utiliser comme couverture
 */
export function getEffectiveFeaturedImage(featured_image_url: string | null | undefined, content: string): string | null {
  // Si une image de couverture est définie et valide, l'utiliser
  if (featured_image_url && featured_image_url.trim() && isValidImageUrl(featured_image_url)) {
    return featured_image_url
  }

  // Sinon, extraire la première image du contenu
  return extractFirstImage(content)
}

/**
 * Vérifie si une URL est une image valide
 * @param url - L'URL à vérifier
 * @returns true si l'URL semble être une image
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false

  // Vérifier les extensions d'images communes
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i

  // Vérifier les URLs locales d'upload (legacy)
  const localUploadPattern = /^\/uploads\/[^/]+\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i

  // Vérifier les URLs Supabase Storage
  const supabasePattern = /^https:\/\/[^.]+\.supabase\.co\/storage\/v1\/object\/public\/image_article\/[^/]+\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i

  return imageExtensions.test(url) || localUploadPattern.test(url) || supabasePattern.test(url)
}