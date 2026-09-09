import { http, HttpResponse } from 'msw'
import { api } from '../api/config'
import { dashboardSummary, users } from './fixtures'
import type { User } from '../api/types'

/**
 * Stand-in for the real backend so the UI is reviewable before the API docs
 * land. Deliberately strict: it rejects an expired or missing bearer token with
 * a 401 so the refresh path is exercised for real rather than assumed.
 */

/** Short on purpose — the refresh cycle is visible within a minute of use. */
const ACCESS_TOKEN_TTL_SECONDS = 90

interface Grant {
  user: User
  expiresAt: number
}

const accessTokens = new Map<string, Grant>()

/**
 * This "server" lives in the page, so a reload would normally wipe the issued
 * refresh tokens and make session restore look broken. Parking them in
 * sessionStorage keeps the reload behaving the way a real backend would.
 * Access tokens are deliberately not persisted — after a reload the app has to
 * go and refresh, which is exactly the path worth demonstrating.
 */
const GRANT_KEY = 'mock-refresh-grants'

function loadGrants(): Map<string, User> {
  try {
    const raw = sessionStorage.getItem(GRANT_KEY)
    return raw ? new Map(JSON.parse(raw) as [string, User][]) : new Map()
  } catch {
    return new Map()
  }
}

const refreshTokens = loadGrants()

function saveGrants() {
  try {
    sessionStorage.setItem(GRANT_KEY, JSON.stringify([...refreshTokens]))
  } catch {
    /* storage unavailable — the mock still works for the current page */
  }
}

/**
 * Wipes every issued grant. Tests call this between cases — otherwise a cookie
 * left over from an earlier sign-in restores the session and a "logged out"
 * test quietly runs as a logged-in one.
 */
export function resetMockBackend() {
  accessTokens.clear()
  refreshTokens.clear()
  saveGrants()
}

let counter = 0
const mint = (prefix: string) => `${prefix}_${++counter}_${Math.random().toString(36).slice(2, 10)}`

function issue(user: User) {
  const accessToken = mint('at')
  accessTokens.set(accessToken, { user, expiresAt: Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000 })

  const refreshToken = mint('rt')
  refreshTokens.set(refreshToken, user)
  saveGrants()

  return { accessToken, refreshToken }
}

function authenticate(request: Request): User | null {
  const header = request.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return null

  const grant = accessTokens.get(header.slice(7))
  if (!grant) return null
  if (Date.now() >= grant.expiresAt) return null

  return grant.user
}

const unauthorized = () =>
  HttpResponse.json({ message: 'Access token missing or expired', code: 'token_expired' }, { status: 401 })

/**
 * The mock keeps its refresh token in a readable cookie; a real backend would
 * set httpOnly. In the browser the Cookie header is never visible to the
 * service worker, so MSW's parsed `cookies` is the source of truth and the
 * header is only a fallback for the node test runner.
 */
function readRefreshCookie(cookies: Record<string, string>, request: Request) {
  if (cookies.rt) return cookies.rt
  const header = request.headers.get('Cookie') ?? ''
  return /(?:^|;\s*)rt=([^;]+)/.exec(header)?.[1] ?? null
}

export const handlers = [
  http.post(api.url(api.endpoints.login), async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string }
    const record = users[email?.trim().toLowerCase()]

    // Same response for a bad address and a bad password — no account enumeration.
    if (!record || record.password !== password) {
      return HttpResponse.json(
        { message: 'That email and password combination did not match.', code: 'invalid_credentials' },
        { status: 401 },
      )
    }

    const { accessToken, refreshToken } = issue(record.user)

    return HttpResponse.json(
      {
        [api.fields.accessToken]: accessToken,
        [api.fields.expiresIn]: ACCESS_TOKEN_TTL_SECONDS,
        user: record.user,
      },
      { headers: { 'Set-Cookie': `rt=${refreshToken}; Path=/; SameSite=Lax` } },
    )
  }),

  http.post(api.url(api.endpoints.refresh), async ({ request, cookies }) => {
    const presented = readRefreshCookie(cookies, request)
    const user = presented ? refreshTokens.get(presented) : null
    if (!user) {
      return HttpResponse.json({ message: 'No valid refresh token', code: 'no_session' }, { status: 401 })
    }

    // Rotation: the presented refresh token is spent.
    refreshTokens.delete(presented!)
    saveGrants()
    const { accessToken, refreshToken } = issue(user)

    return HttpResponse.json(
      { [api.fields.accessToken]: accessToken, [api.fields.expiresIn]: ACCESS_TOKEN_TTL_SECONDS },
      { headers: { 'Set-Cookie': `rt=${refreshToken}; Path=/; SameSite=Lax` } },
    )
  }),

  http.post(api.url(api.endpoints.logout), async ({ request, cookies }) => {
    const presented = readRefreshCookie(cookies, request)
    if (presented) refreshTokens.delete(presented)
    accessTokens.clear()
    saveGrants()
    return new HttpResponse(null, {
      status: 204,
      headers: { 'Set-Cookie': 'rt=; Path=/; Max-Age=0; SameSite=Lax' },
    })
  }),

  http.get(api.url(api.endpoints.me), ({ request }) => {
    const user = authenticate(request)
    return user ? HttpResponse.json(user) : unauthorized()
  }),

  http.get(api.url(api.endpoints.dashboardSummary), ({ request }) => {
    const user = authenticate(request)
    if (!user) return unauthorized()

    // An employee sees their own slice; only admins and managers see company figures.
    if (user.role === 'employee') {
      return HttpResponse.json({
        ...dashboardSummary,
        metrics: dashboardSummary.metrics.filter((m) => m.key === 'enps'),
        headcount: dashboardSummary.headcount.filter((d) => d.department === user.department),
        pendingLeave: [],
      })
    }

    return HttpResponse.json(dashboardSummary)
  }),
]
