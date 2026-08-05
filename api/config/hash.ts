import { defineConfig, drivers } from '@adonisjs/core/hash'

export default defineConfig({
  default: 'scrypt',
  list: {
    scrypt: drivers.scrypt(),
  },
})
