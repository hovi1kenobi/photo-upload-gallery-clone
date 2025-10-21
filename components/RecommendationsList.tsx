'use client'

import { ExternalLink, Book, Sparkles, Clock } from 'lucide-react'
import type { RecommendationsListProps } from '@/types'

export default function RecommendationsList({ 
  analysis, 
  recommendations,
  timestamp
}: RecommendationsListProps) {
  if (!analysis || recommendations.length === 0) {
    return null
  }

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

      {/* Recommendations Section */}
      <div>
        <h3 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Recommended For You
        </h3>
        {/* Changed: Added subtitle emphasizing fresh recommendations */}
        <p className="text-center text-gray-600 mb-6">
          Fresh recommendations based on your latest upload
        </p>
        
        <div className="grid md:grid-cols-3 gap-6">
          {recommendations.map((book, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <div className="mb-4">
                <Book className="w-12 h-12 text-blue-600" />
              </div>
              
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                {book.title}
              </h4>
              
              <p className="text-gray-600 mb-2">
                by {book.author}
              </p>
              
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium mb-4">
                {book.genre}
              </span>
              
              <p className="text-sm text-gray-700 leading-relaxed mb-6">
                {book.reasoning}
              </p>
              
              <a
                href={book.amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 w-full justify-center bg-amber-500 hover:bg-amber-600 
                           text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                View on Amazon
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </div>

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