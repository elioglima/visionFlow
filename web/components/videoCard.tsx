'use client'

import { useEffect, useState } from 'react'
import { fetchReport, fetchVideo, getDownloadUrl, type VideoJob } from '@/lib/api'

interface VideoCardProps {
  video: VideoJob
}

export default function VideoCard({ video: initialVideo }: VideoCardProps) {
  const [video, setVideo] = useState(initialVideo)
  const [reportJson, setReportJson] = useState<string | null>(null)

  useEffect(() => {
    setVideo(initialVideo)
  }, [initialVideo])

  useEffect(() => {
    if (video.status !== 'pending' && video.status !== 'processing') return

    const interval = setInterval(async () => {
      try {
        const updated = await fetchVideo(video.id)
        setVideo(updated)
      } catch {
        /* polling retry on next tick */
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [video.id, video.status])

  useEffect(() => {
    if (video.status !== 'completed') return

    fetchReport(video.id)
      .then((report) => setReportJson(JSON.stringify(report, null, 2)))
      .catch(() => setReportJson(null))
  }, [video.id, video.status])

  const statusLabels: Record<string, string> = {
    pending: 'Queued',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
  }

  return (
    <div className="video-card">
      <div className="video-card-header">
        <div className="video-card-title">{video.originalFilename}</div>
        <span className={`status-badge status-${video.status}`}>{statusLabels[video.status]}</span>
      </div>

      {(video.status === 'processing' || video.status === 'pending') && (
        <>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${video.progress}%` }} />
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {video.progress}% — {video.status === 'pending' ? 'Waiting for processor...' : 'Analyzing frames...'}
          </p>
        </>
      )}

      {video.status === 'failed' && (
        <p className="error-message">{video.errorMessage ?? 'Unknown processing error'}</p>
      )}

      {video.status === 'completed' && (
        <>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{video.uniquePeople ?? 0}</div>
              <div className="stat-label">Unique people</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{video.maxPeopleInFrame ?? 0}</div>
              <div className="stat-label">Max simultaneous</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{video.averagePeoplePerFrame ?? 0}</div>
              <div className="stat-label">Avg per frame</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{video.durationSeconds ?? 0}s</div>
              <div className="stat-label">Duration</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{video.frameCount ?? 0}</div>
              <div className="stat-label">Frames</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{video.processingTimeSeconds ?? 0}s</div>
              <div className="stat-label">Processing time</div>
            </div>
          </div>

          <div className="video-players">
            <div className="player-wrapper">
              <div className="player-label">Processed video</div>
              <video controls src={getDownloadUrl(video.id)} />
            </div>
          </div>

          <div className="actions">
            <a href={getDownloadUrl(video.id)} download className="btn btn-primary">
              ⬇ Download video
            </a>
            {reportJson && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const blob = new Blob([reportJson], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = `report-${video.id}.json`
                  link.click()
                  URL.revokeObjectURL(url)
                }}
              >
                ⬇ Download JSON report
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
