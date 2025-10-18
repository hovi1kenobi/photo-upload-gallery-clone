'use client'

import { useState, useEffect } from 'react'
import PhotoGrid from '@/components/PhotoGrid'
import PhotoModal from '@/components/PhotoModal'
import PhotoUpload from '@/components/PhotoUpload'
import type { CosmicMedia } from '@/types'
import { Camera, Upload } from 'lucide-react'

export default function PhotoGallery() {
  const [photos, setPhotos] = useState<CosmicMedia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(-1)
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    fetchPhotos()
  }, [])

  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/photos')
      const data = await response.json()
      
      if (data.success && Array.isArray(data.photos)) {
        setPhotos(data.photos)
      }
    } catch (error) {
      console.error('Error fetching photos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index)
  }

  const handleCloseModal = () => {
    setSelectedPhotoIndex(-1)
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedPhotoIndex(prev => prev > 0 ? prev - 1 : photos.length - 1)
    } else {
      setSelectedPhotoIndex(prev => prev < photos.length - 1 ? prev + 1 : 0)
    }
  }

  const handleThumbnailClick = (index: number) => {
    setSelectedPhotoIndex(index)
  }

  const handleUploadSuccess = (newPhoto: CosmicMedia) => {
    setPhotos(prev => [newPhoto, ...prev])
    setShowUpload(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading photos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Camera className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Photo Gallery</h1>
            </div>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Upload className="h-4 w-4 mr-2" />
              {showUpload ? 'Close Upload' : 'Upload Photos'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        {showUpload && (
          <div className="mb-8 animate-slide-in">
            <PhotoUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        )}

        {/* Stats */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'} uploaded
          </p>
        </div>

        {/* Photo Grid */}
        {photos.length > 0 ? (
          <PhotoGrid photos={photos} onPhotoClick={handlePhotoClick} />
        ) : (
          <div className="text-center py-12">
            <Camera className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No photos yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload some photos to get started!
            </p>
          </div>
        )}

        {/* Photo Modal */}
        <PhotoModal
          photos={photos}
          currentIndex={selectedPhotoIndex}
          isOpen={selectedPhotoIndex >= 0}
          onClose={handleCloseModal}
          onNavigate={handleNavigate}
          onThumbnailClick={handleThumbnailClick}
        />
      </main>
    </div>
  )
}