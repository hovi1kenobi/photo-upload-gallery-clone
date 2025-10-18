'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import type { PhotoUploadProps, UploadFile } from '@/types'

export default function PhotoUpload({ onUploadSuccess }: PhotoUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // Changed: Renamed function to avoid variable name conflict
  const processUploadFiles = async (files: UploadFile[]) => {
    setIsUploading(true)

    for (const uploadFile of files) {
      try {
        const formData = new FormData()
        formData.append('file', uploadFile.file)

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadFiles(prev =>
            prev.map(f =>
              f.id === uploadFile.id && f.progress < 90
                ? { ...f, progress: f.progress + 10 }
                : f
            )
          )
        }, 100)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        clearInterval(progressInterval)

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const data = await response.json()

        setUploadFiles(prev =>
          prev.map(f =>
            f.id === uploadFile.id
              ? { ...f, progress: 100, status: 'success' }
              : f
          )
        )

        if (data.success && data.photo) {
          onUploadSuccess(data.photo)
        }

        // Remove successful uploads after a delay
        setTimeout(() => {
          setUploadFiles(prev => prev.filter(f => f.id !== uploadFile.id))
        }, 2000)

      } catch (error) {
        console.error('Upload error:', error)
        setUploadFiles(prev =>
          prev.map(f =>
            f.id === uploadFile.id
              ? { ...f, status: 'error' }
              : f
          )
        )
      }
    }

    setIsUploading(false)
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading',
      id: Math.random().toString(36).substr(2, 9),
    }))

    setUploadFiles(prev => [...prev, ...newFiles])
    // Changed: Call the renamed function
    processUploadFiles(newFiles)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    multiple: true,
  })

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Photos</h3>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-gray-600">Drop the photos here...</p>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              Drag & drop photos here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports JPEG, PNG, GIF, WebP images
            </p>
          </div>
        )}
      </div>

      {/* Upload progress */}
      {uploadFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Uploading...</h4>
          {uploadFiles.map(file => (
            <div key={file.id} className="flex items-center space-x-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.file.name}
                </p>
                <div className="progress-bar mt-1">
                  <div
                    className="progress-fill"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {file.status === 'uploading' && (
                  <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full" />
                )}
                
                {file.status === 'success' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                
                {file.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}

                <button
                  onClick={() => removeFile(file.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}