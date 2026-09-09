import { useEffect, useId, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { ApiError } from '../api/types'
import { brand } from '../brand'
import './login.css'

export function LoginPage() {
  const { signIn, status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const emailId = useId()
  const passwordId = useId()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  useEffect(() => {
    if (status === 'authenticated') navigate(from, { replace: true })
  }, [status, from, navigate])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn({ email, password })
      navigate(from, { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? 'That email and password combination did not match.'
          : 'We could not reach the server. Please try again.',
      )
      setSubmitting(false)
    }
  }

  return (
    <main className="login">
      <section className="login__poster" aria-hidden="true">
        <div className="login__poster-rules" />
        <p className="login__poster-mark">
          <span>{brand.monogram}</span>
        </p>
        <h2 className="login__poster-line">
          People data,
          <em> read at a glance.</em>
        </h2>
        <p className="login__poster-note">
          Headcount, leave and hiring in one view — updated the moment your team changes.
        </p>
      </section>

      <section className="login__panel">
        <div className="login__form-wrap">
          <p className="eyebrow">
            {brand.name} {brand.suffix}
          </p>
          <h1 className="login__title">Sign in</h1>
          <p className="login__sub">Use your work account to continue.</p>

          <form onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor={emailId}>Work email</label>
              <input
                id={emailId}
                name="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>

            <div className="field">
              <label htmlFor={passwordId}>Password</label>
              <input
                id={passwordId}
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>

            {/* Assertive so a screen reader interrupts rather than waiting. */}
            <p id="login-error" className="login__error" role="alert">
              {error}
            </p>

            <button className="btn btn--primary btn--block" type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="login__demo">
            Demo account — <code>ada.okonjo@northwind.example</code> / <code>demo1234</code>
          </p>
        </div>
      </section>
    </main>
  )
}
