import { NextResponse } from 'next/server'
import { getPhotos } from '@/lib/cosmic'

export async function GET() {
  try {
    const photos = await getPhotos()
    
    return NextResponse.json({
      success: true,
      photos
    })
  } catch (error) {
    console.error('Error fetching photos:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch photos'
    }, { status: 500 })
  }
}