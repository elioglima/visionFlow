import redis from '@adonisjs/redis/services/main'

const QUEUE_KEY = 'visionflow:jobs'

export async function enqueueJob(jobId: string): Promise<void> {
  await redis.lpush(QUEUE_KEY, jobId)
}

export async function getQueueLength(): Promise<number> {
  return redis.llen(QUEUE_KEY)
}
