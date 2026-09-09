import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SESSION_EXPIRED } from '../api/client'
import * as authApi from '../api/auth'
import type { Credentials, User } from '../api/types'
import { AuthContext, type AuthStatus } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('restoring')
  const [user, setUser] = useState<User | null>(null)

  // Try to pick the session back up from the refresh cookie on first paint.
  useEffect(() => {
    let cancelled = false

    authApi
      .restoreSession()
      .then((session) => {
        if (cancelled) return
        setUser(session?.user ?? null)
        setStatus(session ? 'authenticated' : 'anonymous')
      })
      .catch(() => {
        if (cancelled) return
        setUser(null)
        setStatus('anonymous')
      })

    return () => {
      cancelled = true
    }
  }, [])

  // The client fires this when a refresh is refused mid-session.
  useEffect(() => {
    const onExpired = () => {
      setUser(null)
      setStatus('anonymous')
    }
    window.addEventListener(SESSION_EXPIRED, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED, onExpired)
  }, [])

  const signIn = useCallback(async (credentials: Credentials) => {
    const signedIn = await authApi.login(credentials)
    setUser(signedIn)
    setStatus('authenticated')
  }, [])

  const signOut = useCallback(async () => {
    await authApi.logout()
    setUser(null)
    setStatus('anonymous')
  }, [])

  const value = useMemo(() => ({ status, user, signIn, signOut }), [status, user, signIn, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
