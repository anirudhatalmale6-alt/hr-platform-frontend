import { api } from './config'
import { tokenStore } from './tokenStore'
import { ApiError } from './types'

/**
 * Fired when the session is unrecoverable — refresh was rejected, or there was
 * never a session to begin with. AuthProvider listens and clears the UI.
 */
export const SESSION_EXPIRED = 'auth:session-expired'

function announceExpiry() {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED))
}

/**
 * Single-flight refresh. Ten components can 401 in the same tick and they all
 * await the same network call; the backend sees one refresh, not ten. This also
 * keeps rotating refresh tokens safe — a parallel refresh would invalidate the
 * token the other request is about to use.
 */
let inFlight: Promise<string | null> | null = null

export function refreshSession(): Promise<string | null> {
  if (inFlight) return inFlight

  inFlight = (async () => {
    try {
      const body =
        api.refreshStrategy === 'body'
          ? JSON.stringify({ [api.fields.refreshToken]: tokenStore.refreshToken })
          : undefined

      const res = await fetch(api.url(api.endpoints.refresh), {
        method: 'POST',
        // Sends the httpOnly refresh cookie when that is the strategy.
        credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body,
      })

      if (!res.ok) {
        tokenStore.clear()
        return null
      }

      const data = await res.json()
      const token: string = data[api.fields.accessToken]
      const expiresIn: number = data[api.fields.expiresIn] ?? 0
      // A rotating backend returns a fresh refresh token each time; keep it.
      const nextRefresh =
        api.refreshStrategy === 'body' ? (data[api.fields.refreshToken] ?? null) : undefined

      tokenStore.set(token, expiresIn, nextRefresh)
      return token
    } catch {
      tokenStore.clear()
      return null
    } finally {
      inFlight = null
    }
  })()

  return inFlight
}

interface RequestOptions extends RequestInit {
  /** Skip the Authorization header and the 401 retry (login, refresh). */
  anonymous?: boolean
}

async function parseError(res: Response) {
  try {
    const data = await res.json()
    return new ApiError(data.message ?? data.error ?? res.statusText, res.status, data.code)
  } catch {
    return new ApiError(res.statusText || 'Request failed', res.status)
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { anonymous, ...init } = options

  // Refresh *before* the request when the token is about to lapse, rather than
  // paying for a round trip that we already know will come back 401.
  if (!anonymous && tokenStore.isStale(api.refreshSkewSeconds)) {
    await refreshSession()
  }

  const send = () => {
    const headers = new Headers(init.headers)
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    if (!anonymous && tokenStore.token) {
      headers.set('Authorization', `Bearer ${tokenStore.token}`)
    }
    return fetch(api.url(path), { ...init, headers, credentials: 'include' })
  }

  let res = await send()

  // The token was revoked server-side, or the clock disagreed with us. One
  // retry, and only one — a refresh that yields another 401 means the session
  // is genuinely over.
  if (res.status === 401 && !anonymous) {
    const token = await refreshSession()
    if (!token) {
      announceExpiry()
      throw await parseError(res)
    }
    res = await send()
    if (res.status === 401) {
      tokenStore.clear()
      announceExpiry()
      throw await parseError(res)
    }
  }

  if (!res.ok) throw await parseError(res)
  if (res.status === 204) return undefined as T

  return (await res.json()) as T
}
