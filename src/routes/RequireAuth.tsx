import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

/**
 * Holds the route until the session restore settles. Redirecting while status
 * is still 'restoring' would bounce an already-signed-in user to the login
 * screen on every hard refresh.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'restoring') {
    return (
      <div className="boot" role="status" aria-live="polite">
        <span className="boot__pulse" aria-hidden="true" />
        <span className="sr-only">Restoring your session</span>
      </div>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
