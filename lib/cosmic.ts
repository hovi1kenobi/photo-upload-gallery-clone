import { createBucketClient } from '@cosmicjs/sdk'
import type { CosmicMedia, CosmicMediaResponse } from '@/types'

export const cosmic = createBucketClient({
  bucketSlug: process.env.COSMIC_BUCKET_SLUG as string,
  readKey: process.env.COSMIC_READ_KEY as string,
  writeKey: process.env.COSMIC_WRITE_KEY as string,
})

// Fetch all photos from Cosmic media library
export async function getPhotos(): Promise<CosmicMedia[]> {
  try {
    const response = await cosmic.media
      .find()
      .props(['id', 'name', 'original_name', 'url', 'imgix_url', 'size', 'type', 'created_at'])
      .limit(100)

    return response.media.filter(media => 
      media.type.startsWith('image/')
    ).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  } catch (error) {
    console.error('Error fetching photos:', error)
    // Return empty array for 404 or other errors
    return []
  }
}

// Upload a single photo
export async function uploadPhoto(file: File): Promise<CosmicMedia> {
  try {
    const response = await cosmic.media.insertOne({
      media: file,
    })
    
    return response.media
  } catch (error) {
    console.error('Error uploading photo:', error)
    throw new Error('Failed to upload photo')
  }
}

// Simple error helper for Cosmic SDK
function hasStatus(error: unknown): error is { status: number } {
  return typeof error === 'object' && error !== null && 'status' in error;
}