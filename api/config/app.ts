import { defineConfig } from '@adonisjs/core/http'

export default defineConfig({
  allowMethodSpoofing: false,
  subdomainOffset: 2,
  generateRequestId: true,
  trustProxy: false,
  etag: true,
  jsonpCallbackName: 'callback',
  cookie: {
    domain: '',
    path: '/',
    maxAge: '2h',
    httpOnly: true,
    secure: false,
    sameSite: false,
  },
})
