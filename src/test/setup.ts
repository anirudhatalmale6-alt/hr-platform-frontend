import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './server'
import { resetMockBackend } from '../mocks/handlers'
import { tokenStore } from '../api/tokenStore'

// Unhandled requests are an error on purpose: a test that silently hits the
// network is a test that proves nothing about our handlers.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetMockBackend()
  tokenStore.clear()
  // Cookies survive the request handlers; drop them so the next test starts
  // genuinely signed out.
  for (const entry of document.cookie.split(';')) {
    const name = entry.split('=')[0]?.trim()
    if (name) document.cookie = `${name}=; Path=/; Max-Age=0`
  }
})

afterAll(() => server.close())
