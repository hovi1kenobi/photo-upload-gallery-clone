'use client'

import { useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { PhotoModalProps } from '@/types'

export default function PhotoModal({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  onThumbnailClick,
}: PhotoModalProps) {
  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return
    
    switch (e.key) {
      case 'Escape':
        onClose()
        break
      case 'ArrowLeft':
        onNavigate('prev')
        break
      case 'ArrowRight':
        onNavigate('next')
        break
    }
  }, [isOpen, onClose, onNavigate])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen || currentIndex < 0 || !photos[currentIndex]) {
    return null
  }

  const currentPhoto = photos[currentIndex]

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Navigation buttons */}
        <button
          onClick={() => onNavigate('prev')}
          className="modal-nav-btn left-4"
          aria-label="Previous photo"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          onClick={() => onNavigate('next')}
          className="modal-nav-btn right-4"
          aria-label="Next photo"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Main image */}
        <img
          src={`${currentPhoto.imgix_url}?w=1920&h=1080&fit=max&auto=format,compress`}
          alt={currentPhoto.original_name || currentPhoto.name}
          className="modal-image animate-scale-in"
        />

        {/* Photo info */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center text-white">
          <p className="text-sm opacity-75">
            {currentIndex + 1} of {photos.length}
          </p>
          {currentPhoto.original_name && (
            <p className="text-sm mt-1">{currentPhoto.original_name}</p>
          )}
        </div>

        {/* Thumbnail strip */}
        <div className="thumbnail-strip hide-scrollbar">
          {photos.map((photo, index) => (
            <img
              key={photo.id}
              src={`${photo.imgix_url}?w=128&h=128&fit=crop&auto=format,compress`}
              alt={photo.original_name || photo.name}
              className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
              onClick={() => onThumbnailClick(index)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}