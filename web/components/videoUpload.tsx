'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { uploadVideo } from '@/lib/api'

interface VideoUploadProps {
  onUploadComplete: () => void
}

export default function VideoUpload({ onUploadComplete }: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)
      setUploading(true)
      try {
        await uploadVideo(file)
        onUploadComplete()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setUploading(false)
      }
    },
    [onUploadComplete]
  )

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setDragging(false)
      const file = event.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <div>
      {error && <div className="upload-error">{error}</div>}
      <div
        className={`upload-zone ${dragging ? 'dragging' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/avi,video/quicktime,video/x-matroska,video/webm"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
        <div className="upload-icon">🎬</div>
        <h3>{uploading ? 'Uploading video...' : 'Drag a video here or click to select'}</h3>
        <p>MP4, AVI, MOV, MKV or WebM — max 100MB</p>
        <div className="upload-formats">People detection with YOLO + real-time tracking</div>
        {uploading && <div className="upload-loading">Processing will start automatically after upload</div>}
      </div>
    </div>
  )
}
