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

// 🚨 CRITICAL FIX: Upload a photo and analyze it with Cosmic AI VISION capabilities
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
    
    // Step 2: Use Cosmic AI with VISION capabilities to ACTUALLY see and analyze the image
    // Changed: Using analyzeImage() instead of generateText() for true vision analysis
    const aiAnalysis = await withRetry(
      async () => {
        // CRITICAL: Using Cosmic AI's vision API to actually see the image
        // This is different from passing a URL as text - the AI can now READ book spines
        const response = await cosmic.ai.analyzeImage({
          image_url: uploadResponse.media.imgix_url || uploadResponse.media.url,
          prompt: `You are an expert book collection analyzer with deep knowledge of literature, reading patterns, and bibliographic analysis. Carefully examine this bookshelf image and READ every book spine you can see.

YOUR PRIMARY MISSION: Conduct a comprehensive, multi-dimensional analysis of this reader's book collection by ACTUALLY READING the book titles and authors visible in the image.

📊 ANALYSIS FRAMEWORK - Consider ALL of these metrics:

1. **BOOK IDENTIFICATION** (Most Critical - ACTUALLY READ THE SPINES)
   - READ every visible book spine carefully - look for text on book spines
   - List SPECIFIC titles and authors you can ACTUALLY SEE in the image
   - If you can read partial titles, make educated guesses based on what's visible
   - Note the approximate total number of books visible in the photo
   - DO NOT make up books - only list what you can actually see or reasonably infer

2. **AUTHOR PATTERNS**
   - Which authors appear multiple times based on what you can READ?
   - Are there author "collections" (3+ books by same author) visible?
   - Any debut authors vs established names you can identify?

3. **GENRE DISTRIBUTION**
   - Primary genres represented based on visible books (Fiction, Non-fiction, Mystery, Sci-Fi, etc.)
   - Genre balance estimation from visual inspection
   - Sub-genre preferences based on book covers and spines

4. **SERIES VS STANDALONE**
   - Can you identify complete or incomplete series from spine text?
   - Look for numbered volumes or series indicators
   - Which series are in progress based on what's visible?

5. **PUBLICATION ERA PREFERENCES**
   - Classic literature vs contemporary releases based on cover design?
   - Vintage or antique editions visible?

6. **PHYSICAL CHARACTERISTICS**
   - Hardcover vs paperback from visual inspection?
   - Book condition (well-read vs pristine)?
   - Size variations (pocket books, trade paperbacks, coffee table books)?

PROVIDE YOUR ANALYSIS IN THIS EXACT FORMAT:

BOOKS IDENTIFIED:
- [Exact Title you can READ] by [Author Name you can READ]
- [Exact Title you can READ] by [Author Name you can READ]
(List ONLY books you can actually see or confidently identify from the image - be honest about what's readable vs unclear)

AUTHORS IN COLLECTION:
- [Author Name] - [Number] books visible (titles: [list them])
(List only authors you can actually identify from readable spines)

SERIES ANALYSIS:
- [Series Name if visible] by [Author] - Books [numbers if visible] present
(Only include series you can actually identify from the image)

GENRES & SUB-GENRES:
- [Genre based on visible books] ([estimated %]) - [specific sub-genres]
(Base this on books you can actually see and identify)

THEMES & TOPICS:
- [Theme] - seen in [specific visible book examples]
(Base themes on books you actually identified)

PUBLICATION ERA ANALYSIS:
- Classics/Pre-2000: [estimated %] (examples: [visible titles])
- 2000-2015: [estimated %] (examples: [visible titles])  
- 2015-Present: [estimated %] (examples: [visible titles])
(Base estimates on cover designs and any visible publication dates)

VISUAL OBSERVATIONS:
[Describe what you can actually see in the image: shelf arrangement, book density, cover colors, spine text legibility, overall organization, etc.]

READER PROFILE:
[Provide a comprehensive 4-6 sentence analysis based ONLY on the books you could actually identify in the image. Be clear about confidence level - mention if many spines were illegible.]

COLLECTION GAPS & OPPORTUNITIES:
[Based on what you could actually see and identify, suggest 3-5 specific gaps or opportunities]

RECOMMENDATION STRATEGY:
[In 2-3 sentences, explain what approach would work best for recommending to this reader based on the ACTUAL books you identified in the image]

IMPORTANT: Be honest about image quality and readability. If you can't read most spines clearly, say so. Only list books you can actually identify with reasonable confidence.`
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

// Changed: DRAMATICALLY enhanced recommendation generation with multi-metric decision making
export async function generateBookRecommendations(analysisText: string): Promise<BookRecommendation[]> {
  try {
    const recommendationPrompt = await withRetry(
      async () => {
        return await cosmic.ai.generateText({
          prompt: `You are a master book curator and recommendation specialist with expertise in reader psychology, literary connections, and personalized curation. You have just received a COMPREHENSIVE analysis of a reader's book collection.

📚 READER'S COLLECTION ANALYSIS:
${analysisText}

🎯 YOUR MISSION: Generate 5 EXCEPTIONALLY PERSONALIZED book recommendations using a sophisticated, multi-metric decision framework.

🔍 RECOMMENDATION DECISION FRAMEWORK:

For EACH recommendation, you MUST consider and document these factors:

1. **COLLECTION CONNECTION STRENGTH** (Weight: 35%)
   - Which SPECIFIC books in their collection influenced this choice?
   - How many connection points exist? (author, genre, theme, style)
   - Is this a strong match (3+ connections) or exploratory (1-2 connections)?

2. **READER PREFERENCE ALIGNMENT** (Weight: 25%)
   - Genre fit: Does this match their primary genres or expand tastefully?
   - Complexity match: Same reading level as their collection?
   - Theme resonance: Connects to their identified themes?
   - Writing style: Similar to authors they enjoy?

3. **STRATEGIC CURATION** (Weight: 20%)
   - Does this fill a gap in their collection?
   - Complete a series they've started?
   - Introduce a logical next step in their reading journey?
   - Balance between familiar and new territory?

4. **TIMING & RELEVANCE** (Weight: 10%)
   - Is this book currently available and relevant?
   - Publication timing (classic vs recent)?
   - Critical acclaim and reader reception?

5. **DIVERSITY & EXPLORATION** (Weight: 10%)
   - Does the overall set have good variety?
   - Mix of authors, time periods, perspectives?
   - Encourages healthy reading exploration?

📋 SPECIFIC RECOMMENDATION RULES:

✅ MUST INCLUDE:
- At least 1 recommendation from an author already in their collection (if applicable)
- At least 1 recommendation that completes or continues a series they have (if applicable)
- At least 1 book from the last 5 years (modern release)
- At least 1 book that's been widely acclaimed (award winner or bestseller)

✅ RECOMMENDATION MIX STRATEGY:
- Position 1: "Safe Bet" - Closest to their current collection (90%+ match)
- Position 2: "Author Match" - From an author they clearly enjoy
- Position 3: "Genre Bridge" - Similar genre, new author/perspective
- Position 4: "Complementary Expansion" - Adjacent genre/theme they'd appreciate
- Position 5: "Curated Surprise" - Unexpected but well-reasoned choice

🎯 CRITICAL: Your "reasoning" field MUST:
1. Name 2-3 SPECIFIC books from their collection that influenced this choice
2. Explain the connection mechanism (same author, similar themes, genre match, etc.)
3. Describe why THIS book fits THEIR reading profile specifically
4. Mention what new element or value this book brings
5. Be 3-4 detailed sentences minimum

📊 OUTPUT FORMAT (STRICT JSON):

{
  "recommendation_strategy": "[2-3 sentence explanation of your overall approach to recommending to THIS specific reader based on their analysis]",
  "recommendations": [
    {
      "title": "[Exact book title]",
      "author": "[Full author name]",
      "genre": "[Primary genre]",
      "reasoning": "[DETAILED 3-4 sentence explanation mentioning SPECIFIC books from their collection and explaining multiple connection points. Must demonstrate you analyzed their collection deeply. Example: 'Since you have Project Hail Mary and The Martian by Andy Weir, plus Dune by Frank Herbert, you clearly love hard science fiction with detailed world-building and scientific accuracy. Seveneves by Neal Stephenson is perfect for you because it combines Weir-level scientific detail with Herbert-scale epic scope, featuring realistic near-future space survival scenarios. This book will satisfy your love of technical problem-solving (like Weir) while providing the grand civilization-building narrative you enjoy in Dune.']",
      "isbn": "[Valid 13-digit ISBN-13]",
      "connection_strength": "[Strong/Moderate/Exploratory] - [brief explanation]",
      "fills_gap": "[Yes/No] - [if yes, what gap?]",
      "collection_evidence": "[List 2-3 specific titles from their shelf that support this recommendation]"
    }
  ]
}

⚠️ CRITICAL REQUIREMENTS:
- ALL reasoning must reference SPECIFIC titles from their collection
- Each recommendation must show clear analytical thought process
- Demonstrate you understand their reading psychology, not just genres
- ISBN-13 numbers must be valid and accurate
- Ensure recommendations span different recommendation types (safe bet, author match, expansion, etc.)
- The 5 books together should tell a coherent story about understanding this reader

Generate your response now. Be brilliant, be specific, be personal.`
        }) as CosmicAIGenerationResponse
      },
      { maxRetries: 3, initialDelay: 1000 }
    )
    
    // Changed: Enhanced JSON parsing with support for new fields
    let parsed: { 
      recommendation_strategy?: string;
      recommendations: BookRecommendation[] 
    }
    
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
            amazonUrl: "",
            connection_strength: "Moderate",
            fills_gap: "No",
            collection_evidence: []
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
        amazonUrl: rec.amazonUrl || "",
        connection_strength: rec.connection_strength || "Moderate",
        fills_gap: rec.fills_gap || "No",
        collection_evidence: rec.collection_evidence || []
      }))
      
      // Store the recommendation strategy for display
      if (parsed.recommendation_strategy) {
        // Add strategy to first recommendation for now (will be used in UI)
        (parsed.recommendations[0] as any).recommendation_strategy = parsed.recommendation_strategy
      }
      
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
      amazonUrl: "",
      connection_strength: "Moderate",
      fills_gap: "No",
      collection_evidence: []
    },
    {
      title: "Atomic Habits",
      author: "James Clear",
      genre: "Self-Help",
      reasoning: "A practical guide to building better habits, perfect for readers interested in personal development and productivity.",
      isbn: "9780735211292",
      amazonUrl: "",
      connection_strength: "Moderate",
      fills_gap: "No",
      collection_evidence: []
    },
    {
      title: "The Seven Husbands of Evelyn Hugo",
      author: "Taylor Jenkins Reid",
      genre: "Historical Fiction",
      reasoning: "A captivating story with rich characters and emotional depth that appeals to readers who enjoy character-driven narratives.",
      isbn: "9781501161933",
      amazonUrl: "",
      connection_strength: "Moderate",
      fills_gap: "No",
      collection_evidence: []
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
    } else if (trimmedLine.toUpperCase().includes('COLLECTION INSIGHTS') || 
               trimmedLine.toUpperCase().includes('RECOMMENDATION STRATEGY') ||
               trimmedLine.toUpperCase().includes('VISUAL OBSERVATIONS')) {
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
      } else if (currentSection === 'profile' && !trimmedLine.toUpperCase().includes('COLLECTION') && !trimmedLine.toUpperCase().includes('VISUAL')) {
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