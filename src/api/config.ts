/**
 * Single place where this front end is bound to the backend.
 *
 * PLACEHOLDERS — every path and field name below is a guess made before the API
 * docs arrived. Swapping to the real API should mean editing this file only.
 */

export type TransportMode = 'rest' | 'graphql'

/** Where the refresh token lives. Decided by the backend, not by us. */
export type RefreshStrategy =
  /** Backend sets an httpOnly cookie; we just send credentials. Preferred. */
  | 'cookie'
  /** Backend returns the refresh token in the JSON body; we hold it in memory. */
  | 'body'

export const api = {
  /**
   * Relative to the deployed base path, so the mock service worker (whose
   * scope is that same path) can still see the calls when the preview is
   * hosted from a subdirectory.
   */
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? `${import.meta.env.BASE_URL}api`,

  transport: (import.meta.env.VITE_API_TRANSPORT ?? 'rest') as TransportMode,

  refreshStrategy: (import.meta.env.VITE_REFRESH_STRATEGY ?? 'cookie') as RefreshStrategy,

  endpoints: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
    dashboardSummary: '/dashboard/summary',
  },

  /** Response field names, kept separate so a rename is a one-line change. */
  fields: {
    accessToken: 'access_token',
    refreshToken: 'refresh_token',
    /** Seconds until the access token expires. */
    expiresIn: 'expires_in',
  },

  /**
   * Refresh this many seconds before the access token actually expires, so an
   * in-flight request never races the expiry.
   */
  refreshSkewSeconds: 30,

  url(path: string) {
    return `${this.baseUrl.replace(/\/$/, '')}${path}`
  },
} as const
