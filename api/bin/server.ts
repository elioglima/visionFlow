import { Ignitor, prettyPrintError } from '@adonisjs/core'

const ignitor = new Ignitor(import.meta.url, {
  importer: (filePath) => import(filePath),
})

ignitor
  .tap((app) => {
    app.booting(async () => {
      await import('#start/env')
    })
  })
  .httpServer()
  .start()
  .catch((error) => {
    process.exitCode = 1
    prettyPrintError(error)
  })
