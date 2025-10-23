'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Book, Sparkles, Clock, Target, TrendingUp, CheckCircle2 } from 'lucide-react'
import type { RecommendationsListProps } from '@/types'

export default function RecommendationsList({ 
  analysis, 
  recommendations,
  timestamp
}: RecommendationsListProps) {
  // Changed: Progressive rendering state
  const [visibleCount, setVisibleCount] = useState(0)

  // Changed: Gradually reveal recommendations for better UX
  useEffect(() => {
    if (recommendations.length > 0 && visibleCount < recommendations.length) {
      const timer = setTimeout(() => {
        setVisibleCount(prev => prev + 1)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [visibleCount, recommendations.length])

  // Reset visible count when recommendations change
  useEffect(() => {
    setVisibleCount(0)
  }, [recommendations])

  if (!analysis) {
    return null
  }

  // Changed: Extract recommendation strategy if available
  const recommendationStrategy = (recommendations[0] as any)?.recommendation_strategy

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Changed: Added timestamp badge to show when analysis was performed */}
      {timestamp && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium shadow-sm">
            <Clock className="w-4 h-4" />
            New Analysis at {timestamp}
          </div>
        </div>
      )}

      {/* Analysis Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl shadow-sm border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-blue-600" />
          <h3 className="text-2xl font-bold text-gray-900">Your Reading Profile</h3>
        </div>
        
        <p className="text-gray-700 leading-relaxed mb-6">
          {analysis.reader_profile}
        </p>

        {/* Changed: Added section showing books detected in the photo */}
        {analysis.books_identified.length > 0 && (
          <div className="mb-4 p-4 bg-white rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              📚 Books We Detected in Your Photo:
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.books_identified.map((book, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium shadow-sm"
                >
                  {book}
                </span>
              ))}
            </div>
          </div>
        )}

        {analysis.genres.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Genres You Enjoy:</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.genres.map((genre, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-medium"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        )}

        {analysis.themes.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Common Themes:</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.themes.map((theme, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-indigo-200 text-indigo-800 rounded-full text-sm font-medium"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Changed: NEW - Why These Books? Section */}
      {recommendationStrategy && recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-xl shadow-sm border border-amber-100">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-amber-600" />
            <h3 className="text-2xl font-bold text-gray-900">Why These Books?</h3>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-amber-200 mb-4">
            <p className="text-gray-700 leading-relaxed mb-4">
              <span className="font-semibold text-amber-900">Our AI's Recommendation Strategy:</span>
              <br />
              {recommendationStrategy}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <h4 className="font-semibold text-gray-900">Multi-Metric Analysis</h4>
              </div>
              <p className="text-sm text-gray-600">
                We analyzed 10+ factors including your author preferences, series completion patterns, genre balance, and thematic interests to find perfect matches.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">Specific Evidence</h4>
              </div>
              <p className="text-sm text-gray-600">
                Each recommendation below references specific books from YOUR shelf, showing exactly how we connected the dots between your collection and our suggestions.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Book className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Balanced Curation</h4>
              </div>
              <p className="text-sm text-gray-600">
                We mixed "safe bets" (very similar to what you own) with "complementary expansions" (new territory you'll likely love) for a well-rounded reading journey.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      {recommendations.length > 0 ? (
        <div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Recommended For You
          </h3>
          {/* Changed: Added subtitle emphasizing fresh recommendations */}
          <p className="text-center text-gray-600 mb-6">
            Personalized recommendations based on deep analysis of your collection
          </p>
          
          <div className="grid md:grid-cols-1 gap-6">
            {recommendations.slice(0, visibleCount).map((book, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left side - Book icon and quick info */}
                  <div className="md:w-1/3">
                    <div className="mb-4">
                      <Book className="w-16 h-16 text-blue-600 mb-4" />
                      
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">
                        {book.title}
                      </h4>
                      
                      <p className="text-lg text-gray-600 mb-3">
                        by {book.author}
                      </p>
                      
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium mb-4">
                        {book.genre}
                      </span>

                      {/* Changed: NEW - Show connection strength and gap-filling */}
                      {book.connection_strength && (
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              book.connection_strength.includes('Strong') ? 'bg-green-500' :
                              book.connection_strength.includes('Moderate') ? 'bg-yellow-500' :
                              'bg-blue-500'
                            }`} />
                            <span className="text-sm font-medium text-gray-700">
                              {book.connection_strength.split(' - ')[0]} Match
                            </span>
                          </div>
                          
                          {book.fills_gap && book.fills_gap !== 'No' && (
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-600">
                                <span className="font-medium">Fills gap:</span> {book.fills_gap}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <a
                        href={book.amazonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 w-full justify-center bg-amber-500 hover:bg-amber-600 
                                   text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 mt-6"
                      >
                        View on Amazon
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Right side - Detailed reasoning */}
                  <div className="md:w-2/3 md:border-l md:pl-6">
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          Why We Recommend This Book:
                        </h5>
                        <p className="text-gray-700 leading-relaxed">
                          {book.reasoning}
                        </p>
                      </div>

                      {/* Changed: NEW - Show specific evidence from their collection */}
                      {book.collection_evidence && book.collection_evidence.length > 0 && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <h5 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                            📖 Based on These Books from Your Collection:
                          </h5>
                          <ul className="space-y-1">
                            {book.collection_evidence.map((evidence, idx) => (
                              <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                <span>{evidence}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 font-medium mb-2">
            Analysis complete, but we couldn't generate recommendations this time.
          </p>
          <p className="text-yellow-700 text-sm">
            Try uploading another photo with a clearer view of your book collection.
          </p>
        </div>
      )}

      {/* Upload Another Section */}
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">
          Want more recommendations? Upload another photo of your books!
        </p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 
                     text-white rounded-lg font-medium transition-colors duration-200"
        >
          <Book className="w-5 h-5" />
          Upload Another Photo
        </button>
      </div>
    </div>
  )
}