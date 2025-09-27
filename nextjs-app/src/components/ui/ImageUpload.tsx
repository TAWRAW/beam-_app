"use client"

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageUploadProps {
  onImageUploaded?: (url: string) => void
  className?: string
}

interface UploadedImage {
  url: string
  filename: string
  originalName: string
  size: number
  type: string
}

export function ImageUpload({ onImageUploaded, className = '' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      await uploadFile(file)
    }

    // Reset input
    event.target.value = ''
  }

  const uploadFile = async (file: File) => {
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/images', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'upload')
      }

      const uploadedImage: UploadedImage = await response.json()
      setUploadedImages(prev => [uploadedImage, ...prev])

      // Callback avec l'URL de l'image
      if (onImageUploaded) {
        onImageUploaded(uploadedImage.url)
      }

    } catch (error) {
      console.error('Error uploading file:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const files = event.dataTransfer.files

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        await uploadFile(file)
      }
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(`![Image](${url})`)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const removeImage = (url: string) => {
    setUploadedImages(prev => prev.filter(img => img.url !== url))
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zone d'upload */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-2">
          <Upload className="mx-auto h-8 w-8 text-gray-400" />
          <div className="text-sm text-gray-600">
            <span className="font-medium text-primary">Cliquez pour uploader</span> ou glissez-déposez
          </div>
          <p className="text-xs text-gray-500">
            PNG, JPG, WebP, GIF jusqu'à 5MB
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {uploading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-gray-600">Upload en cours...</span>
        </div>
      )}

      {/* Liste des images uploadées */}
      {uploadedImages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Images uploadées</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploadedImages.map((image) => (
              <div
                key={image.filename}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <img
                  src={image.url}
                  alt={image.originalName}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {image.originalName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(image.size)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(image.url)}
                    className="h-8 px-2"
                  >
                    {copiedUrl === image.url ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeImage(image.url)}
                    className="h-8 px-2 text-red-600 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}