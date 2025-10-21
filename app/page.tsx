'use client'

import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import BookUpload from '@/components/BookUpload'
import RecommendationsList from '@/components/RecommendationsList'
import type { BookAnalysis, BookRecommendation } from '@/types'

export default function HomePage() {
  const [analysis, setAnalysis] = useState<BookAnalysis | null>(null)
  const [recommendations, setRecommendations] = useState<BookRecommendation[]>([])

  const handleAnalysisComplete = (newAnalysis: BookAnalysis, newRecommendations: BookRecommendation[]) => {
    setAnalysis(newAnalysis)
    setRecommendations(newRecommendations)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-8">
            <BookOpen className="h-10 w-10 text-blue-600 mr-3" />
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">
                AI Book Recommendation Platform
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Powered by Cosmic AI
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        {!analysis && (
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Discover Your Next Great Read
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload a photo of your bookshelf and let our AI analyze your reading preferences 
              to recommend personalized book suggestions.
            </p>
          </div>
        )}

        {/* Upload Section */}
        <div className="mb-12">
          <BookUpload onAnalysisComplete={handleAnalysisComplete} />
        </div>

        {/* Recommendations Section */}
        {analysis && recommendations.length > 0 && (
          <RecommendationsList 
            analysis={analysis} 
            recommendations={recommendations} 
          />
        )}

        {/* How It Works Section */}
        {!analysis && (
          <div className="mt-16 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
              How It Works
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Upload Photo</h4>
                <p className="text-sm text-gray-600">
                  Take a clear photo of your bookshelf showing book spines and titles
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">AI Analysis</h4>
                <p className="text-sm text-gray-600">
                  Our AI identifies books, analyzes genres, and understands your reading taste
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Get Recommendations</h4>
                <p className="text-sm text-gray-600">
                  Receive 3 personalized book suggestions with Amazon links to purchase
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}