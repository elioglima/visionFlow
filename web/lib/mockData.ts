import type { VideoJob, VideoReport } from '@/lib/api'

export const MOCK_SAMPLE_VIDEO_URL =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'

const now = () => new Date().toISOString()

const mockReports: Record<string, VideoReport> = {
  'mock-completed-001': {
    status: 'completed',
    durationSeconds: 45.8,
    processedFrames: 1374,
    uniquePeople: 7,
    maximumPeopleInFrame: 4,
    averagePeoplePerFrame: 2.1,
    processingTimeSeconds: 31.4,
  },
}

function createInitialJobs(): VideoJob[] {
  const timestamp = now()

  return [
    {
      id: 'mock-completed-001',
      originalFilename: 'street-crowd.mp4',
      status: 'completed',
      progress: 100,
      durationSeconds: 45.8,
      width: 1280,
      height: 720,
      frameCount: 1374,
      uniquePeople: 7,
      maxPeopleInFrame: 4,
      averagePeoplePerFrame: 2.1,
      processingTimeSeconds: 31.4,
      errorMessage: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'mock-processing-002',
      originalFilename: 'office-walkthrough.mp4',
      status: 'processing',
      progress: 67,
      durationSeconds: null,
      width: null,
      height: null,
      frameCount: null,
      uniquePeople: null,
      maxPeopleInFrame: null,
      averagePeoplePerFrame: null,
      processingTimeSeconds: null,
      errorMessage: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'mock-pending-003',
      originalFilename: 'parking-lot.mp4',
      status: 'pending',
      progress: 0,
      durationSeconds: null,
      width: null,
      height: null,
      frameCount: null,
      uniquePeople: null,
      maxPeopleInFrame: null,
      averagePeoplePerFrame: null,
      processingTimeSeconds: null,
      errorMessage: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'mock-failed-004',
      originalFilename: 'corrupted-file.avi',
      status: 'failed',
      progress: 12,
      durationSeconds: null,
      width: null,
      height: null,
      frameCount: null,
      uniquePeople: null,
      maxPeopleInFrame: null,
      averagePeoplePerFrame: null,
      processingTimeSeconds: null,
      errorMessage: 'Unable to decode video stream. File may be corrupted or unsupported.',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]
}

let mockJobs: VideoJob[] = createInitialJobs()

function completeJob(job: VideoJob): VideoJob {
  const report = {
    status: 'completed',
    durationSeconds: 32.5,
    processedFrames: 975,
    uniquePeople: 5,
    maximumPeopleInFrame: 3,
    averagePeoplePerFrame: 1.8,
    processingTimeSeconds: 24.2,
  }

  mockReports[job.id] = report

  return {
    ...job,
    status: 'completed',
    progress: 100,
    durationSeconds: report.durationSeconds,
    width: 1280,
    height: 720,
    frameCount: report.processedFrames,
    uniquePeople: report.uniquePeople,
    maxPeopleInFrame: report.maximumPeopleInFrame,
    averagePeoplePerFrame: report.averagePeoplePerFrame,
    processingTimeSeconds: report.processingTimeSeconds,
    updatedAt: now(),
  }
}

function advanceJob(job: VideoJob): VideoJob {
  if (job.status === 'pending') {
    return {
      ...job,
      status: 'processing',
      progress: 10,
      updatedAt: now(),
    }
  }

  if (job.status === 'processing') {
    const nextProgress = Math.min(job.progress + 12, 100)

    if (nextProgress >= 100) {
      return completeJob({ ...job, progress: nextProgress })
    }

    return {
      ...job,
      progress: nextProgress,
      updatedAt: now(),
    }
  }

  return job
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getMockVideos(): Promise<VideoJob[]> {
  await delay(400)
  return [...mockJobs]
}

export async function getMockVideo(id: string): Promise<VideoJob | null> {
  await delay(200)

  const index = mockJobs.findIndex((job) => job.id === id)
  if (index === -1) return null

  const current = mockJobs[index]

  if (current.status === 'pending' || current.status === 'processing') {
    mockJobs[index] = advanceJob(current)
  }

  return { ...mockJobs[index] }
}

export async function uploadMockVideo(file: File): Promise<VideoJob> {
  await delay(800)

  const job: VideoJob = {
    id: `mock-upload-${Date.now()}`,
    originalFilename: file.name,
    status: 'pending',
    progress: 0,
    durationSeconds: null,
    width: null,
    height: null,
    frameCount: null,
    uniquePeople: null,
    maxPeopleInFrame: null,
    averagePeoplePerFrame: null,
    processingTimeSeconds: null,
    errorMessage: null,
    createdAt: now(),
    updatedAt: now(),
  }

  mockJobs = [job, ...mockJobs]
  return job
}

export async function getMockReport(id: string): Promise<VideoReport | null> {
  await delay(150)
  return mockReports[id] ?? null
}

export function getMockDownloadUrl(id: string): string {
  const job = mockJobs.find((item) => item.id === id)
  if (job?.status === 'completed') {
    return MOCK_SAMPLE_VIDEO_URL
  }
  return MOCK_SAMPLE_VIDEO_URL
}
