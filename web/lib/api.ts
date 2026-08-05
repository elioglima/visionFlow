import { isMockMode } from '@/lib/isMockMode'
import {
  getMockDownloadUrl,
  getMockReport,
  getMockVideo,
  getMockVideos,
  uploadMockVideo,
} from '@/lib/mockData'

export interface VideoJob {
  id: string
  originalFilename: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  durationSeconds: number | null
  width: number | null
  height: number | null
  frameCount: number | null
  uniquePeople: number | null
  maxPeopleInFrame: number | null
  averagePeoplePerFrame: number | null
  processingTimeSeconds: number | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface VideoReport {
  status: string
  durationSeconds: number
  processedFrames: number
  uniquePeople: number
  maximumPeopleInFrame: number
  averagePeoplePerFrame: number
  processingTimeSeconds: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'

export async function fetchVideos(): Promise<VideoJob[]> {
  if (isMockMode()) {
    return getMockVideos()
  }

  const response = await fetch(`${API_URL}/api/videos`, { cache: 'no-store' })
  if (!response.ok) throw new Error('Failed to fetch videos')
  return response.json()
}

export async function fetchVideo(id: string): Promise<VideoJob> {
  if (isMockMode()) {
    const video = await getMockVideo(id)
    if (!video) throw new Error('Video not found')
    return video
  }

  const response = await fetch(`${API_URL}/api/videos/${id}`, { cache: 'no-store' })
  if (!response.ok) throw new Error('Failed to fetch video')
  return response.json()
}

export async function uploadVideo(file: File): Promise<VideoJob> {
  if (isMockMode()) {
    return uploadMockVideo(file)
  }

  const formData = new FormData()
  formData.append('video', file)

  const response = await fetch(`${API_URL}/api/videos`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? 'Upload failed')
  }

  return response.json()
}

export async function fetchReport(id: string): Promise<VideoReport> {
  if (isMockMode()) {
    const report = await getMockReport(id)
    if (!report) throw new Error('Report not available')
    return report
  }

  const response = await fetch(`${API_URL}/api/videos/${id}/report`, { cache: 'no-store' })
  if (!response.ok) throw new Error('Report not available')
  return response.json()
}

export function getDownloadUrl(id: string): string {
  if (isMockMode()) {
    return getMockDownloadUrl(id)
  }

  return `${API_URL}/api/videos/${id}/download`
}

export function getOriginalUrl(id: string): string {
  if (isMockMode()) {
    return getMockDownloadUrl(id)
  }

  return `${API_URL}/api/videos/${id}/original`
}
