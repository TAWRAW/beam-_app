// src/lib/visites/image-compress.ts
// Compression best-effort d'une photo AVANT envoi vers Estale.
//
// Contexte : les photos iPhone pleine résolution dépassent souvent la limite
// de 4,5 Mo des fonctions serveur (Vercel) → l'upload se coupe. On envoie donc
// une version redimensionnée/recompressée, tout en CONSERVANT l'original HD en
// local (IndexedDB) pour l'export pleine résolution.

export interface ResizeResult {
  width: number
  height: number
  scaled: boolean
}

/**
 * Calcule les dimensions cibles en plafonnant le plus grand côté à `maxDim`,
 * en préservant le ratio. Si l'image est déjà sous le plafond, on ne touche pas.
 */
export function computeResizeDimensions(
  width: number,
  height: number,
  maxDim: number,
): ResizeResult {
  if (width <= maxDim && height <= maxDim) {
    return { width, height, scaled: false }
  }
  const scale = maxDim / Math.max(width, height)
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    scaled: true,
  }
}

export interface CompressOptions {
  maxDimension?: number // plafond du plus grand côté (px)
  quality?: number // qualité JPEG 0..1
}

/**
 * Compresse une image en JPEG redimensionné. Best-effort :
 *  - en environnement sans canvas (tests, SSR) → renvoie le blob d'origine ;
 *  - si la conversion échoue ou n'allège pas → renvoie le blob d'origine.
 * Ne lève jamais : l'upload doit toujours pouvoir continuer.
 */
export async function compressImage(
  blob: Blob,
  { maxDimension = 2048, quality = 0.8 }: CompressOptions = {},
): Promise<Blob> {
  if (
    typeof createImageBitmap === 'undefined' ||
    typeof document === 'undefined'
  ) {
    return blob
  }
  try {
    // `imageOrientation: 'from-image'` applique l'orientation EXIF pour éviter
    // les photos pivotées après recompression.
    const bitmap = await createImageBitmap(blob, {
      imageOrientation: 'from-image',
    } as ImageBitmapOptions)
    const { width, height } = computeResizeDimensions(
      bitmap.width,
      bitmap.height,
      maxDimension,
    )
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close?.()
      return blob
    }
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()
    const out = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    )
    // On ne renvoie la version compressée que si elle est réellement plus légère.
    if (out && out.size < blob.size) return out
    return blob
  } catch {
    return blob
  }
}
