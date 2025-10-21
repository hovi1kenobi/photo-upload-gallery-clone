'use client'

import type { PhotoGridProps, CosmicMedia } from '@/types'

export default function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
  if (!photos || photos.length === 0) {
    return null
  }

  return (
    <div className="photo-grid">
      {/* Changed: Added explicit type annotations for parameters */}
      {photos.map((photo: CosmicMedia, index: number) => (
        <div
          key={photo.id}
          className="photo-card"
          onClick={() => onPhotoClick(index)}
        >
          <img
            src={`${photo.imgix_url}?w=600&h=450&fit=crop&auto=format,compress`}
            alt={photo.original_name || photo.name}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200" />
        </div>
      ))}
    </div>
  )
}