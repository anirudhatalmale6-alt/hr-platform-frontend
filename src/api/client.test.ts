import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { request, SESSION_EXPIRED } from './client'
import { tokenStore } from './tokenStore'
import { api } from './config'
import { server } from '../test/server'

/**
 * These tests drive fetch directly rather than through MSW, because what is
 * under test is the retry/refresh choreography, not any particular backend.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('api client', () => {
  beforeEach(() => {
    // Let the stubbed fetch through untouched.
    server.close()
    tokenStore.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    server.listen({ onUnhandledRequest: 'error' })
  })

  it('refreshes once when several requests hit 401 at the same time', async () => {
    let refreshCalls = 0
    let protectedCalls = 0
    let tokenAccepted = false

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        if (String(url).endsWith(api.endpoints.refresh)) {
          refreshCalls += 1
          // A real refresh is not instant; the delay is what lets a naive
          // implementation fire three of them.
          await new Promise((resolve) => setTimeout(resolve, 20))
          tokenAccepted = true
          return json({ access_token: 'fresh-token', expires_in: 900 })
        }

        protectedCalls += 1
        const auth = new Headers(init.headers).get('Authorization')
        if (!tokenAccepted || auth !== 'Bearer fresh-token') {
          return json({ message: 'expired' }, 401)
        }
        return json({ ok: true })
      }),
    )

    tokenStore.set('stale-token', 900)

    const results = await Promise.all([
      request<{ ok: boolean }>('/a'),
      request<{ ok: boolean }>('/b'),
      request<{ ok: boolean }>('/c'),
    ])

    expect(results.every((r) => r.ok)).toBe(true)
    // Positive control: all three really did 401 and really did retry, so a
    // client without single-flight would have refreshed three times here.
    expect(protectedCalls).toBe(6)
    expect(refreshCalls).toBe(1)
    expect(tokenStore.token).toBe('fresh-token')
  })

  it('gives up and announces expiry when the refresh is refused', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).endsWith(api.endpoints.refresh)) return json({ message: 'no' }, 401)
        return json({ message: 'expired' }, 401)
      }),
    )

    const onExpired = vi.fn()
    window.addEventListener(SESSION_EXPIRED, onExpired)
    tokenStore.set('stale-token', 900)

    await expect(request('/protected')).rejects.toMatchObject({ status: 401 })

    expect(onExpired).toHaveBeenCalledTimes(1)
    expect(tokenStore.token).toBeNull()
    window.removeEventListener(SESSION_EXPIRED, onExpired)
  })

  it('refreshes ahead of expiry instead of spending a round trip on a 401', async () => {
    let refreshCalls = 0
    const seenTokens: (string | null)[] = []

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        if (String(url).endsWith(api.endpoints.refresh)) {
          refreshCalls += 1
          return json({ access_token: 'ahead-of-time', expires_in: 900 })
        }
        seenTokens.push(new Headers(init.headers).get('Authorization'))
        return json({ ok: true })
      }),
    )

    // Inside the skew window, so the client should not even try the old token.
    tokenStore.set('about-to-expire', api.refreshSkewSeconds - 5)
    await request('/protected')

    expect(refreshCalls).toBe(1)
    expect(seenTokens).toEqual(['Bearer ahead-of-time'])
  })

  it('does not attach a token or retry on anonymous calls', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      json({ message: 'bad credentials' }, 401),
    )
    vi.stubGlobal('fetch', fetchMock)

    tokenStore.set('some-token', 900)
    await expect(request('/auth/login', { method: 'POST', anonymous: true })).rejects.toMatchObject({
      status: 401,
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers)
    expect(headers.get('Authorization')).toBeNull()
  })
})
