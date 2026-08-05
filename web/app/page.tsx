'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchVideos, type VideoJob } from '@/lib/api'
import { isMockMode } from '@/lib/isMockMode'
import VideoUpload from '@/components/videoUpload'
import VideoCard from '@/components/videoCard'

export default function Dashboard() {
  const [videos, setVideos] = useState<VideoJob[]>([])
  const [loading, setLoading] = useState(true)

  const loadVideos = useCallback(async () => {
    try {
      const data = await fetchVideos()
      setVideos(data)
    } catch {
      setVideos([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVideos()
  }, [loadVideos])

  return (
    <div className="container">
      <header className="header">
        <div className="header-badges">
          <div className="header-badge">Computer Vision POC</div>
          {isMockMode() && <div className="header-badge header-badge-mock">Mock data enabled</div>}
        </div>
        <h1>VisionFlow</h1>
        <p>
          Intelligent video analytics platform. Detects and tracks people with YOLO,
          processes frames with OpenCV and generates annotated videos via FFmpeg.
        </p>
        <div className="tech-stack">
          {['AdonisJS', 'Python', 'YOLO', 'OpenCV', 'FFmpeg', 'Next.js', 'PostgreSQL', 'Redis', 'Docker'].map(
            (tech) => (
              <span key={tech} className="tech-tag">
                {tech}
              </span>
            )
          )}
        </div>
      </header>

      <VideoUpload onUploadComplete={loadVideos} />

      <h2 className="section-title">
        Jobs <span>({videos.length})</span>
      </h2>

      {loading ? (
        <div className="empty-state">Loading...</div>
      ) : videos.length === 0 ? (
        <div className="empty-state">
          No videos processed yet. Upload one above to get started.
        </div>
      ) : (
        <div className="video-list">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  )
}
