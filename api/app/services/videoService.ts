import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import env from '#start/env'

const ALLOWED_EXTENSIONS = ['.mp4', '.avi', '.mov', '.mkv', '.webm']
const MAX_FILE_SIZE = 100 * 1024 * 1024

export function validateVideoFile(filename: string, size: number): string | null {
  const extension = filename.toLowerCase().slice(filename.lastIndexOf('.'))

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return `Invalid format. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
  }

  if (size > MAX_FILE_SIZE) {
    return 'File exceeds maximum size of 100MB'
  }

  return null
}

export async function saveUploadedVideo(
  filename: string,
  buffer: Buffer
): Promise<{ id: string; path: string }> {
  const id = randomUUID()
  const storagePath = env.get('STORAGE_PATH')
  const uploadsDir = join(storagePath, 'uploads')

  await mkdir(uploadsDir, { recursive: true })

  const safeName = `${id}${filename.slice(filename.lastIndexOf('.'))}`
  const filePath = join(uploadsDir, safeName)

  await writeFile(filePath, buffer)

  return { id, path: filePath }
}

export function getProcessedPath(id: string): string {
  return join(env.get('STORAGE_PATH'), 'processed', `${id}.mp4`)
}

export function getReportPath(id: string): string {
  return join(env.get('STORAGE_PATH'), 'reports', `${id}.json`)
}
