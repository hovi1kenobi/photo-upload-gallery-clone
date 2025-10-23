import { NextRequest, NextResponse } from 'next/server'
import { uploadPhoto } from '@/lib/cosmic'
import { validateImageFile } from '@/lib/validators'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    // Changed: Use centralized validation
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 })
    }

    const photo = await uploadPhoto(file)

    return NextResponse.json({
      success: true,
      photo
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to upload photo'
    }, { status: 500 })
  }
}