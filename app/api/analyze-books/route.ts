import { NextRequest, NextResponse } from 'next/server'
import { uploadAndAnalyzeBooks, generateBookRecommendations, parseAnalysisText, generateAmazonLink } from '@/lib/cosmic'
import { validateImageFile } from '@/lib/validators'
import type { RecommendationResponse, BookAnalysis } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    // Changed: Use centralized validation
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return NextResponse.json<RecommendationResponse>({
        success: false,
        error: validation.error
      }, { status: 400 })
    }

    // Step 1: Upload and analyze the image
    const { photo, analysis } = await uploadAndAnalyzeBooks(file)
    
    // Step 2: Parse the analysis text into structured data
    const parsedAnalysis = parseAnalysisText(analysis.text)
    
    // Step 3: Generate book recommendations with fallback support
    let recommendations
    try {
      recommendations = await generateBookRecommendations(analysis.text)
      
      // Changed: Check if we got valid recommendations
      if (!recommendations || recommendations.length === 0) {
        console.warn('No recommendations generated, but analysis succeeded')
        // Return analysis without recommendations
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
          recommendations: [],
          error: 'Analysis complete, but recommendations could not be generated. Please try uploading another photo.'
        })
      }
    } catch (recError) {
      console.error('Recommendation generation failed:', recError)
      // Changed: Partial success - return analysis without recommendations
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
        recommendations: [],
        error: 'Analysis complete, but recommendations could not be generated. Please try again.'
      })
    }
    
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