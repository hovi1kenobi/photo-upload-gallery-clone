import { createBucketClient } from '@cosmicjs/sdk'
import type { CosmicMedia, CosmicAIAnalysisResponse, CosmicAIGenerationResponse, BookRecommendation } from '@/types'

export const cosmic = createBucketClient({
  bucketSlug: process.env.COSMIC_BUCKET_SLUG as string,
  readKey: process.env.COSMIC_READ_KEY as string,
  writeKey: process.env.COSMIC_WRITE_KEY as string,
})

// Upload a photo and analyze it with Cosmic AI
export async function uploadAndAnalyzeBooks(file: File): Promise<{
  photo: CosmicMedia;
  analysis: CosmicAIAnalysisResponse;
}> {
  try {
    // Step 1: Upload the image
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const uploadResponse = await cosmic.media.insertOne({
      media: {
        buffer: buffer,
        originalname: file.name
      }
    })
    
    // Step 2: Use Cosmic AI to analyze the image
    const aiAnalysis = await cosmic.ai.analyze({
      media_id: uploadResponse.media.id,
      prompt: `Analyze this image of books on a bookshelf. 
        List all visible book titles and authors if you can identify them.
        Identify the genres and themes present in this collection.
        Determine the reader's preferences based on:
        - Genre patterns (fiction, non-fiction, mystery, sci-fi, fantasy, romance, thriller, etc.)
        - Author styles and writing approaches
        - Subject matter and topics
        - Reading level and complexity
        
        Provide a detailed analysis of what this collection reveals about the reader's taste.
        Format your response as follows:
        
        BOOKS IDENTIFIED:
        [List visible book titles and authors]
        
        GENRES:
        [List genres present]
        
        THEMES:
        [List common themes]
        
        READER PROFILE:
        [2-3 sentences describing this reader's preferences and taste]`
    }) as CosmicAIAnalysisResponse
    
    return {
      photo: uploadResponse.media,
      analysis: aiAnalysis
    }
  } catch (error) {
    console.error('Error analyzing books:', error)
    throw new Error('Failed to upload and analyze books')
  }
}

// Generate book recommendations based on analysis
export async function generateBookRecommendations(analysisText: string): Promise<BookRecommendation[]> {
  try {
    const recommendationPrompt = await cosmic.ai.generate({
      prompt: `Based on this reader's book collection analysis:
        
        ${analysisText}
        
        Provide exactly 3 book recommendations that would appeal to this reader.
        For each book, include:
        1. Title (the full book title)
        2. Author (full author name)
        3. Genre (primary genre)
        4. Reasoning (2-3 sentences explaining why this book matches their taste)
        5. ISBN-13 number (a valid 13-digit ISBN for Amazon linking)
        
        IMPORTANT: Format your response as valid JSON with this exact structure:
        {
          "recommendations": [
            {
              "title": "Book Title",
              "author": "Author Name",
              "genre": "Genre",
              "reasoning": "Why this book matches their reading preferences...",
              "isbn": "9781234567890"
            }
          ]
        }
        
        Ensure the JSON is properly formatted and parseable. Use real, popular books that match the reader's interests.`
    }) as CosmicAIGenerationResponse
    
    // Parse the JSON response
    const parsed = JSON.parse(recommendationPrompt.text)
    return parsed.recommendations
  } catch (error) {
    console.error('Error generating recommendations:', error)
    throw new Error('Failed to generate book recommendations')
  }
}

// Generate Amazon affiliate link for a book
export function generateAmazonLink(isbn: string, affiliateTag?: string): string {
  // Remove any dashes from ISBN
  const cleanIsbn = isbn.replace(/-/g, '')
  
  // Use affiliate tag if provided, otherwise use a default
  const tag = affiliateTag || process.env.AMAZON_AFFILIATE_TAG || 'cosmicjs-20'
  
  return `https://www.amazon.com/dp/${cleanIsbn}?tag=${tag}`
}

// Parse AI analysis text into structured data
export function parseAnalysisText(analysisText: string): {
  books_identified: string[];
  genres: string[];
  themes: string[];
  reader_profile: string;
} {
  const lines = analysisText.split('\n')
  
  let books_identified: string[] = []
  let genres: string[] = []
  let themes: string[] = []
  let reader_profile = ''
  
  let currentSection = ''
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    if (trimmedLine.startsWith('BOOKS IDENTIFIED:')) {
      currentSection = 'books'
      continue
    } else if (trimmedLine.startsWith('GENRES:')) {
      currentSection = 'genres'
      continue
    } else if (trimmedLine.startsWith('THEMES:')) {
      currentSection = 'themes'
      continue
    } else if (trimmedLine.startsWith('READER PROFILE:')) {
      currentSection = 'profile'
      continue
    }
    
    if (trimmedLine && trimmedLine !== '') {
      if (currentSection === 'books' && !trimmedLine.startsWith('[') && !trimmedLine.startsWith('GENRES')) {
        books_identified.push(trimmedLine.replace(/^[-•*]\s*/, ''))
      } else if (currentSection === 'genres' && !trimmedLine.startsWith('[') && !trimmedLine.startsWith('THEMES')) {
        genres.push(trimmedLine.replace(/^[-•*]\s*/, ''))
      } else if (currentSection === 'themes' && !trimmedLine.startsWith('[') && !trimmedLine.startsWith('READER')) {
        themes.push(trimmedLine.replace(/^[-•*]\s*/, ''))
      } else if (currentSection === 'profile') {
        reader_profile += trimmedLine + ' '
      }
    }
  }
  
  return {
    books_identified: books_identified.filter(b => b.length > 0),
    genres: genres.filter(g => g.length > 0),
    themes: themes.filter(t => t.length > 0),
    reader_profile: reader_profile.trim()
  }
}

// Simple error helper for Cosmic SDK
function hasStatus(error: unknown): error is { status: number } {
  return typeof error === 'object' && error !== null && 'status' in error;
}