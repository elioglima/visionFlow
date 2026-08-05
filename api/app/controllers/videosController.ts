import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { readFile } from 'node:fs/promises'
import Video from '#models/video'
import { enqueueJob } from '#services/queueService'
import {
  getProcessedPath,
  getReportPath,
  saveUploadedVideo,
  validateVideoFile,
} from '#services/videoService'

export default class VideosController {
  async index({ response }: HttpContext) {
    const videos = await Video.query().orderBy('created_at', 'desc')
    return response.ok(videos)
  }

  async show({ params, response }: HttpContext) {
    const video = await Video.find(params.id)

    if (!video) {
      return response.notFound({ message: 'Video not found' })
    }

    return response.ok(video)
  }

  async store({ request, response }: HttpContext) {
    const file = request.file('video', {
      size: '100mb',
      extnames: ['mp4', 'avi', 'mov', 'mkv', 'webm'],
    })

    if (!file) {
      return response.badRequest({ message: 'Video file is required' })
    }

    if (!file.isValid) {
      return response.badRequest({ message: file.errors[0]?.message ?? 'Invalid file' })
    }

    const validationError = validateVideoFile(file.clientName, file.size ?? 0)

    if (validationError) {
      return response.badRequest({ message: validationError })
    }

    await file.move(app.tmpPath())
    const buffer = await readFile(file.filePath!)
    const { id, path } = await saveUploadedVideo(file.clientName, buffer)

    const video = await Video.create({
      id,
      originalFilename: file.clientName,
      status: 'pending',
      progress: 0,
      originalPath: path,
    })

    await enqueueJob(id)

    return response.created(video)
  }

  async updateProgress({ params, request, response }: HttpContext) {
    const video = await Video.find(params.id)

    if (!video) {
      return response.notFound({ message: 'Video not found' })
    }

    const payload = request.only([
      'status',
      'progress',
      'durationSeconds',
      'width',
      'height',
      'frameCount',
      'uniquePeople',
      'maxPeopleInFrame',
      'averagePeoplePerFrame',
      'processingTimeSeconds',
      'errorMessage',
    ])

    if (payload.status === 'completed') {
      video.processedPath = getProcessedPath(video.id)
      video.reportPath = getReportPath(video.id)
    }

    video.merge(payload)
    await video.save()

    return response.ok(video)
  }

  async download({ params, response }: HttpContext) {
    const video = await Video.find(params.id)

    if (!video || video.status !== 'completed' || !video.processedPath) {
      return response.notFound({ message: 'Processed video not available' })
    }

    return response.download(video.processedPath)
  }

  async report({ params, response }: HttpContext) {
    const video = await Video.find(params.id)

    if (!video || !video.reportPath) {
      return response.notFound({ message: 'Report not available' })
    }

    const content = await readFile(video.reportPath, 'utf-8')
    return response.header('Content-Type', 'application/json').send(content)
  }
}
