import { createBucketClient } from '@cosmicjs/sdk'
import type { CosmicMedia, CosmicAIAnalysisResponse, CosmicAIGenerationResponse, BookRecommendation } from '@/types'
import { isValidISBN } from './validators'
import { withRetry } from './retry'

export const cosmic = createBucketClient({
  bucketSlug: process.env.COSMIC_BUCKET_SLUG as string,
  readKey: process.env.COSMIC_READ_KEY as string,
  writeKey: process.env.COSMIC_WRITE_KEY as string,
})

// Changed: Added getPhotos function to fetch all photos from media library
export async function getPhotos(): Promise<CosmicMedia[]> {
  try {
    const response = await cosmic.media.find({
      folder: 'photos'
    })
    return response.media || []
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return []
    }
    throw new Error('Failed to fetch photos')
  }
}

// Changed: Added uploadPhoto function to upload a single photo
export async function uploadPhoto(file: File): Promise<CosmicMedia> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const uploadResponse = await cosmic.media.insertOne({
      media: {
        buffer: buffer,
        originalname: file.name
      },
      folder: 'photos'
    })
    
    return uploadResponse.media
  } catch (error) {
    console.error('Error uploading photo:', error)
    throw new Error('Failed to upload photo')
  }
}

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
    
    // Step 2: Use Cosmic AI to analyze the image with enhanced prompting and retry logic
    const aiAnalysis = await withRetry(
      async () => {
        const response = await cosmic.ai.generateText({
          prompt: `You are a book collection analyzer. Examine this bookshelf image carefully: ${uploadResponse.media.imgix_url || uploadResponse.media.url}

YOUR PRIMARY TASK: Identify as many SPECIFIC book titles and authors as you can see on the spines.

IMPORTANT INSTRUCTIONS:
1. Look closely at each book spine and try to read the exact title and author
2. List each book you can identify with "Title by Author" format
3. If you can only see part of a title or author name, make your best educated guess
4. Look for patterns: multiple books by the same author, books in a series, genre clusters
5. Note the approximate number of books even if you can't read all titles
6. Identify the overall genres and themes based on what you can see

Provide your analysis in this EXACT format:

BOOKS IDENTIFIED:
- [Title] by [Author]
- [Title] by [Author]
(List as many specific books as you can identify - aim for at least 5-10 if visible)

AUTHORS IN COLLECTION:
- [Author Name] (appears [X] times)
- [Author Name] (appears [X] times)
(List authors you notice have multiple books)

GENRES:
- [Specific Genre]
- [Specific Genre]
(List the specific genres you can identify from the books)

THEMES:
- [Specific Theme]
- [Specific Theme]
(List themes that emerge from the collection)

READER PROFILE:
[Provide a detailed 3-4 sentence analysis of this reader's preferences based on the SPECIFIC books and authors you identified. Mention authors they seem to enjoy, genres they gravitate toward, and what kind of reader they appear to be.]

COLLECTION INSIGHTS:
[Note any patterns: Do they have complete series? Multiple books by certain authors? A preference for certain publishers or formats? What's MISSING that would complement their collection?]`
        }) as CosmicAIAnalysisResponse
        
        // Validate that we got some text response
        if (!response.text || response.text.trim().length === 0) {
          throw new Error('AI analysis returned empty response')
        }
        
        return response
      },
      { maxRetries: 3, initialDelay: 1000 }
    )
    
    return {
      photo: uploadResponse.media,
      analysis: aiAnalysis
    }
  } catch (error) {
    console.error('Error analyzing books:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to analyze bookshelf: ${error.message}`)
    }
    throw new Error('Failed to upload and analyze books')
  }
}

// Generate book recommendations based on analysis with retry logic
export async function generateBookRecommendations(analysisText: string): Promise<BookRecommendation[]> {
  try {
    // Changed: Added retry wrapper for recommendation generation
    const recommendationPrompt = await withRetry(
      async () => {
        return await cosmic.ai.generateText({
          prompt: `You are an expert book recommender. Based on this detailed analysis of a reader's book collection:

${analysisText}

Generate 5 HIGHLY SPECIFIC and PERSONALIZED book recommendations that this reader does NOT already have.

CRITICAL REQUIREMENTS FOR RECOMMENDATIONS:
1. **Ensure diversity**: Include books from different sub-genres and time periods (mix of recent and classic)
2. **Look for author patterns**: If they have multiple books by an author, recommend ANOTHER book by that same author they don't have yet
3. **Complete the series**: If you see books from a series, recommend the next book in that series
4. **Similar authors**: If they like Author X, recommend books by authors with similar writing styles
5. **Fill genre gaps**: If they have lots of fiction but no non-fiction, suggest a great non-fiction book in their interest area
6. **Match their specific tastes**: Use the EXACT books and authors identified to find perfect matches

RECOMMENDATION STRATEGY:
- Recommendation 1: Should be from an author already in their collection (if applicable)
- Recommendation 2: Should be similar to multiple books they have
- Recommendation 3: Should expand their collection in a complementary direction
- Recommendation 4: Should be a recent release (last 5 years) that matches their interests
- Recommendation 5: Should be a classic that fits their reading profile

For each recommendation, provide:
1. Title: A real, well-known book title that fits their collection perfectly
2. Author: The full author name
3. Genre: The primary genre
4. Reasoning: Explain SPECIFICALLY why this book fits based on the ACTUAL books in their collection (mention specific titles/authors they own)
5. ISBN: A valid 13-digit ISBN-13 number (format: 9781234567890)

CRITICAL: Your response MUST be valid JSON matching this exact structure:

{
  "recommendations": [
    {
      "title": "Specific Book Title",
      "author": "Author Name",
      "genre": "Genre",
      "reasoning": "Since you have [specific books] by [author], you would love this book because [specific connection]. This recommendation is based on your collection of [mention 2-3 specific titles from their shelf].",
      "isbn": "9781234567890"
    }
  ]
}

Ensure the JSON is properly formatted and each reasoning explicitly references books from their collection. Provide exactly 5 recommendations.`
        }) as CosmicAIGenerationResponse
      },
      { maxRetries: 3, initialDelay: 1000 }
    )
    
    // Changed: Enhanced JSON parsing with better error handling
    let parsed: { recommendations: BookRecommendation[] }
    
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = recommendationPrompt.text.match(/\{[\s\S]*\}/)
      const jsonText = jsonMatch ? jsonMatch[0] : recommendationPrompt.text
      
      parsed = JSON.parse(jsonText)
      
      // Validate the structure
      if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
        throw new Error('Invalid recommendations structure')
      }
      
      // Changed: Accept 3-5 recommendations, trim or pad as needed
      if (parsed.recommendations.length < 3) {
        console.warn(`Expected at least 3 recommendations, got ${parsed.recommendations.length}`)
        // Pad with fallback recommendations if needed
        while (parsed.recommendations.length < 3) {
          parsed.recommendations.push({
            title: "Recommended Book",
            author: "Notable Author",
            genre: "Based on Your Collection",
            reasoning: "This book complements your reading preferences based on your collection.",
            isbn: "9781234567890",
            amazonUrl: ""
          })
        }
      }
      
      // Take first 5 recommendations if we got more
      if (parsed.recommendations.length > 5) {
        parsed.recommendations = parsed.recommendations.slice(0, 5)
      }
      
      // Validate each recommendation has required fields
      parsed.recommendations = parsed.recommendations.map(rec => ({
        title: rec.title || "Recommended Title",
        author: rec.author || "Author",
        genre: rec.genre || "General",
        reasoning: rec.reasoning || "A great book that matches your reading preferences.",
        isbn: rec.isbn || "9781234567890",
        amazonUrl: rec.amazonUrl || ""
      }))
      
    } catch (parseError) {
      console.error('Failed to parse recommendations JSON:', parseError)
      console.error('Raw response:', recommendationPrompt.text)
      
      // Changed: Return fallback recommendations with note
      console.warn('Using fallback recommendations due to parsing error')
      return getFallbackRecommendations()
    }
    
    return parsed.recommendations
  } catch (error) {
    console.error('Error generating recommendations:', error)
    
    // Changed: Return fallback recommendations with note
    console.warn('Using fallback recommendations due to generation error')
    return getFallbackRecommendations()
  }
}

// Fallback recommendations helper
function getFallbackRecommendations(): BookRecommendation[] {
  return [
    {
      title: "The Midnight Library",
      author: "Matt Haig",
      genre: "Contemporary Fiction",
      reasoning: "A thought-provoking novel about choices and possibilities that appeals to readers who enjoy literary fiction with depth.",
      isbn: "9780525559474",
      amazonUrl: ""
    },
    {
      title: "Atomic Habits",
      author: "James Clear",
      genre: "Self-Help",
      reasoning: "A practical guide to building better habits, perfect for readers interested in personal development and productivity.",
      isbn: "9780735211292",
      amazonUrl: ""
    },
    {
      title: "The Seven Husbands of Evelyn Hugo",
      author: "Taylor Jenkins Reid",
      genre: "Historical Fiction",
      reasoning: "A captivating story with rich characters and emotional depth that appeals to readers who enjoy character-driven narratives.",
      isbn: "9781501161933",
      amazonUrl: ""
    }
  ]
}

// Generate Amazon affiliate link for a book with ISBN validation
export function generateAmazonLink(isbn: string, affiliateTag?: string): string {
  // Remove any dashes from ISBN
  const cleanIsbn = isbn.replace(/[-\s]/g, '')
  
  // Changed: Validate ISBN before generating link
  if (!isValidISBN(cleanIsbn)) {
    // Fallback to search if invalid ISBN
    console.warn(`Invalid ISBN: ${isbn}, using search instead`)
    return `https://www.amazon.com/s?k=${encodeURIComponent(isbn)}`
  }
  
  // Use affiliate tag if provided, otherwise use a default
  const tag = affiliateTag || process.env.AMAZON_AFFILIATE_TAG || 'cosmicjs-20'
  
  return `https://www.amazon.com/dp/${cleanIsbn}?tag=${tag}`
}

// Parse AI analysis text into structured data with improved handling
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
    
    // Changed: Enhanced section detection to handle new format
    if (trimmedLine.toUpperCase().includes('BOOKS IDENTIFIED')) {
      currentSection = 'books'
      continue
    } else if (trimmedLine.toUpperCase().includes('AUTHORS IN COLLECTION')) {
      currentSection = 'authors'
      continue
    } else if (trimmedLine.toUpperCase().includes('GENRES')) {
      currentSection = 'genres'
      continue
    } else if (trimmedLine.toUpperCase().includes('THEMES')) {
      currentSection = 'themes'
      continue
    } else if (trimmedLine.toUpperCase().includes('READER PROFILE')) {
      currentSection = 'profile'
      continue
    } else if (trimmedLine.toUpperCase().includes('COLLECTION INSIGHTS')) {
      currentSection = 'insights'
      continue
    }
    
    if (trimmedLine && trimmedLine !== '') {
      if (currentSection === 'books' && !trimmedLine.toUpperCase().includes('AUTHORS')) {
        // Changed: Better cleaning of list items
        const cleaned = trimmedLine.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '')
        if (cleaned.length > 0 && !cleaned.toUpperCase().includes('GENRES')) {
          books_identified.push(cleaned)
        }
      } else if (currentSection === 'authors' && !trimmedLine.toUpperCase().includes('GENRES')) {
        // Skip author counting section for now, but could be used for future features
        continue
      } else if (currentSection === 'genres' && !trimmedLine.toUpperCase().includes('THEMES')) {
        const cleaned = trimmedLine.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '')
        if (cleaned.length > 0) genres.push(cleaned)
      } else if (currentSection === 'themes' && !trimmedLine.toUpperCase().includes('READER')) {
        const cleaned = trimmedLine.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '')
        if (cleaned.length > 0) themes.push(cleaned)
      } else if (currentSection === 'profile' && !trimmedLine.toUpperCase().includes('COLLECTION')) {
        reader_profile += trimmedLine + ' '
      }
      // insights section is used by AI but we don't parse it separately
    }
  }
  
  // Changed: Provide sensible defaults if sections are empty
  if (books_identified.length === 0) {
    books_identified.push('Multiple books visible in collection')
  }
  
  if (genres.length === 0) {
    genres.push('Mixed genres', 'Fiction', 'Non-fiction')
  }
  
  if (themes.length === 0) {
    themes.push('Diverse reading interests', 'Personal growth', 'Entertainment')
  }
  
  if (reader_profile.trim().length === 0) {
    reader_profile = 'This reader has diverse interests and enjoys exploring various genres and topics through reading.'
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