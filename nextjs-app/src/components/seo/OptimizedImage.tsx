/**
 * COMPOSANT IMAGE OPTIMISÉ POUR CORE WEB VITALS
 *
 * Améliore les scores LCP (Largest Contentful Paint) et CLS (Cumulative Layout Shift)
 * pour un meilleur référencement Google.
 *
 * FONCTIONNALITÉS:
 * - Lazy loading automatique (sauf priority)
 * - Placeholder blur pour éviter le CLS
 * - Formats modernes (WebP, AVIF)
 * - Responsive avec srcset automatique
 * - Alt text obligatoire pour SEO
 *
 * UTILISATION:
 * <OptimizedImage
 *   src="/images/hero.jpg"
 *   alt="Description SEO"
 *   width={1200}
 *   height={600}
 *   priority={true} // Pour les images au-dessus de la ligne de flottaison
 * />
 */

import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
  className?: string
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  sizes = '100vw',
  quality = 85,
  placeholder = 'empty',
  blurDataURL
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {loading && !priority && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse"
          style={{ aspectRatio: `${width} / ${height}` }}
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        sizes={sizes}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoadingComplete={() => setLoading(false)}
        className={`
          ${className}
          ${loading && !priority ? 'opacity-0' : 'opacity-100'}
          transition-opacity duration-300
        `}
      />
    </div>
  )
}

// Composant pour images héro (priorité haute)
export function HeroImage(props: Omit<OptimizedImageProps, 'priority'>) {
  return <OptimizedImage {...props} priority={true} sizes="100vw" quality={90} />
}

// Composant pour vignettes (qualité réduite)
export function ThumbnailImage(props: Omit<OptimizedImageProps, 'quality'>) {
  return <OptimizedImage {...props} quality={75} sizes="(max-width: 768px) 100vw, 33vw" />
}