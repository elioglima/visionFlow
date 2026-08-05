import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class Video extends BaseModel {
  static table = 'videos'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare originalFilename: string

  @column()
  declare status: 'pending' | 'processing' | 'completed' | 'failed'

  @column()
  declare progress: number

  @column()
  declare durationSeconds: number | null

  @column()
  declare width: number | null

  @column()
  declare height: number | null

  @column()
  declare frameCount: number | null

  @column()
  declare uniquePeople: number | null

  @column()
  declare maxPeopleInFrame: number | null

  @column()
  declare averagePeoplePerFrame: number | null

  @column()
  declare processingTimeSeconds: number | null

  @column()
  declare originalPath: string

  @column()
  declare processedPath: string | null

  @column()
  declare reportPath: string | null

  @column()
  declare errorMessage: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
