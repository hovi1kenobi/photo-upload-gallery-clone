import { NextRequest, NextResponse } from 'next/server'
import { uploadAndAnalyzeBooks, generateBookRecommendations, parseAnalysisText, generateAmazonLink } from '@/lib/cosmic'
import type { RecommendationResponse, BookAnalysis } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json<RecommendationResponse>({
        success: false,
        error: 'No file provided'
      }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json<RecommendationResponse>({
        success: false,
        error: 'File must be an image'
      }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json<RecommendationResponse>({
        success: false,
        error: 'File size must be less than 10MB'
      }, { status: 400 })
    }

    // Step 1: Upload and analyze the image
    const { photo, analysis } = await uploadAndAnalyzeBooks(file)
    
    // Step 2: Parse the analysis text into structured data
    const parsedAnalysis = parseAnalysisText(analysis.text)
    
    // Step 3: Generate book recommendations
    const recommendations = await generateBookRecommendations(analysis.text)
    
    // Step 4: Add Amazon links to recommendations
    const enrichedRecommendations = recommendations.map(book => ({
      ...book,
      amazonUrl: generateAmazonLink(book.isbn)
    }))

    // Step 5: Construct the full analysis object
    const fullAnalysis: BookAnalysis = {
      photo,
      books_identified: parsedAnalysis.books_identified,
      genres: parsedAnalysis.genres,
      themes: parsedAnalysis.themes,
      reader_profile: parsedAnalysis.reader_profile,
      raw_analysis: analysis.text
    }

    return NextResponse.json<RecommendationResponse>({
      success: true,
      analysis: fullAnalysis,
      recommendations: enrichedRecommendations
    })

  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json<RecommendationResponse>({
      success: false,
      error: 'Failed to analyze books. Please try again with a clearer photo of your bookshelf.'
    }, { status: 500 })
  }
}