import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
  commands: [],
  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    () => import('@adonisjs/lucid/database_provider'),
    () => import('@adonisjs/redis/redis_provider'),
    () => import('@adonisjs/cors/cors_provider'),
  ],
  preloads: [
    () => import('#start/kernel'),
    () => import('#start/routes'),
  ],
  metaFiles: [],
})
