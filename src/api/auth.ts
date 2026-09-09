import { api } from './config'
import { request, refreshSession } from './client'
import { tokenStore } from './tokenStore'
import type { Credentials, Session, User } from './types'

export async function login(credentials: Credentials): Promise<User> {
  const data = await request<Record<string, unknown>>(api.endpoints.login, {
    method: 'POST',
    body: JSON.stringify(credentials),
    anonymous: true,
  })

  tokenStore.set(
    data[api.fields.accessToken] as string,
    (data[api.fields.expiresIn] as number) ?? 0,
    api.refreshStrategy === 'body' ? ((data[api.fields.refreshToken] as string) ?? null) : undefined,
  )

  return data.user as User
}

export async function logout(): Promise<void> {
  try {
    await request<void>(api.endpoints.logout, { method: 'POST' })
  } finally {
    // Whatever the server said, this browser is done with the session.
    tokenStore.clear()
  }
}

export function fetchCurrentUser(): Promise<User> {
  return request<User>(api.endpoints.me)
}

/**
 * Called once on boot. There is no access token in memory after a reload, so we
 * ask the backend to mint one from the refresh cookie; if that fails the user
 * is simply logged out and we show the login screen.
 */
export async function restoreSession(): Promise<Session | null> {
  const token = await refreshSession()
  if (!token) return null

  const user = await fetchCurrentUser()
  return { user, accessToken: token, expiresIn: Math.round(tokenStore.msUntilExpiry() / 1000) }
}
