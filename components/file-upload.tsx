"use client"

import type React from "react"

import { useState, useRef } from "react"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept: string
  children: React.ReactNode
  disabled?: boolean
}

export function FileUpload({ onFileSelect, accept, children, disabled = false }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onFileSelect(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const files = e.target.files
    if (files && files.length > 0) {
      onFileSelect(files[0])
    }
  }

  return (
    <div
      className={`drop-zone ${isDragOver ? "drag-over" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      aria-disabled={disabled}
    >
      <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileSelect} className="hidden" disabled={disabled} />
      {children}
    </div>
  )
}
