/**
 * The access token lives in module memory only — never localStorage or
 * sessionStorage, so a XSS payload cannot read it back out of the page.
 * Session survival across a reload comes from the refresh call instead.
 */

let accessToken: string | null = null
/** Epoch ms at which the current access token expires. */
let expiresAt = 0
/** Only used when the backend hands us the refresh token in the body. */
let refreshToken: string | null = null

export const tokenStore = {
  get token() {
    return accessToken
  },

  get refreshToken() {
    return refreshToken
  },

  set(token: string | null, expiresInSeconds = 0, refresh?: string | null) {
    accessToken = token
    expiresAt = token ? Date.now() + expiresInSeconds * 1000 : 0
    if (refresh !== undefined) refreshToken = refresh
  },

  clear() {
    accessToken = null
    refreshToken = null
    expiresAt = 0
  },

  /** True when the token is gone, or close enough to expiry to be unsafe. */
  isStale(skewSeconds: number) {
    if (!accessToken) return true
    return Date.now() >= expiresAt - skewSeconds * 1000
  },

  /** Milliseconds until expiry. Negative once expired. */
  msUntilExpiry() {
    return expiresAt - Date.now()
  },
}
