'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { BookOpen, Sparkles, Upload } from 'lucide-react'
import { validateImageFile } from '@/lib/validators'
import type { BookUploadProps, BookAnalysis, BookRecommendation } from '@/types'

export default function BookUpload({ onAnalysisComplete }: BookUploadProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Changed: Add client-side pre-validation
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setUploadProgress(0)
    // Changed: Clear previous results immediately when starting new upload
    onAnalysisComplete(null, [])

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 300)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/analyze-books', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const data = await response.json()

      if (data.success && data.analysis) {
        // Wait a moment to show 100% progress
        setTimeout(() => {
          // Changed: Handle case where recommendations might be empty
          onAnalysisComplete(data.analysis, data.recommendations || [])
          if (data.error) {
            setError(data.error)
          }
        }, 500)
      } else {
        setError(data.error || 'Failed to analyze books. Please try again.')
      }
    } catch (error) {
      console.error('Analysis failed:', error)
      setError('Failed to analyze books. Please try again.')
    } finally {
      setTimeout(() => {
        setIsAnalyzing(false)
        setUploadProgress(0)
      }, 1000)
    }
  }, [onAnalysisComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxFiles: 1,
    disabled: isAnalyzing
  })

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isAnalyzing ? (
          <div className="space-y-4">
            <Sparkles className="w-16 h-16 mx-auto text-blue-600 animate-pulse" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                Analyzing your book collection...
              </p>
              <p className="text-sm text-gray-600">
                Our AI is identifying books and generating recommendations
              </p>
              <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <BookOpen className="w-16 h-16 mx-auto text-gray-400" />
            {isDragActive ? (
              <p className="text-lg text-gray-600">Drop your bookshelf photo here...</p>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">
                  Upload a photo of your bookshelf
                </p>
                <p className="text-sm text-gray-600">
                  Drag & drop or click to select
                </p>
                <p className="text-xs text-gray-500">
                  Our AI will analyze your collection and recommend new books
                </p>
              </div>
            )}
            <div className="pt-2">
              <Upload className="w-5 h-5 mx-auto text-gray-400" />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  )
}