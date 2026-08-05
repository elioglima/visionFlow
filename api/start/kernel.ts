import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

server.use([
  () => import('@adonisjs/cors/cors_middleware'),
  () => import('@adonisjs/core/bodyparser_middleware'),
])

router.use([])

export const middleware = router.named({})
