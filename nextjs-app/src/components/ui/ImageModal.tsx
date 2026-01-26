"use client"

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  src: string
  alt: string
}

export function ImageModal({ isOpen, onClose, src, alt }: ImageModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Calculate scrollbar width to prevent layout shift on Chrome
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`)
      document.body.classList.add('modal-open')
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.classList.remove('modal-open')
      document.documentElement.style.removeProperty('--scrollbar-width')
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative max-w-7xl max-h-[90vh] mx-2 sm:mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-8 sm:-top-12 right-0 text-white hover:text-gray-300 transition-colors z-10 p-2"
          aria-label="Fermer"
        >
          <X className="h-6 w-6 sm:h-8 sm:w-8" />
        </button>

        {/* Image */}
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[85vh] sm:max-h-[90vh] object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}