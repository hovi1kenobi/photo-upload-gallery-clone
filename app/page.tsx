'use client'

import { useState, useEffect } from 'react'
import AccessForm from '@/components/AccessForm'
import PhotoGallery from '@/components/PhotoGallery'

export default function HomePage() {
  const [hasAccess, setHasAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user already has access (stored in sessionStorage)
    const storedAccess = sessionStorage.getItem('gallery-access')
    if (storedAccess === 'granted') {
      setHasAccess(true)
    }
    setIsLoading(false)
  }, [])

  const handleAccessGranted = () => {
    setHasAccess(true)
    sessionStorage.setItem('gallery-access', 'granted')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {!hasAccess ? (
        <AccessForm onAccessGranted={handleAccessGranted} />
      ) : (
        <PhotoGallery />
      )}
    </main>
  )
}