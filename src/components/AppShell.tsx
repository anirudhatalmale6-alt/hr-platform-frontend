import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { brand } from '../brand'
import './app-shell.css'

interface NavItem {
  label: string
  to?: string
  /** Later milestones — shown so the shape of the product is visible, but inert. */
  soon?: boolean
}

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Overview',
    items: [{ label: 'Dashboard', to: '/dashboard' }],
  },
  {
    group: 'People',
    items: [
      { label: 'Employee directory', soon: true },
      { label: 'Time off', soon: true },
      { label: 'Onboarding', soon: true },
    ],
  },
  {
    group: 'Insight',
    items: [
      { label: 'Analytics', soon: true },
      { label: 'Reports', soon: true },
    ],
  },
  {
    group: 'Workspace',
    items: [{ label: 'Settings', soon: true }],
  },
]

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const { user, signOut } = useAuth()
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className={`shell ${navOpen ? 'shell--nav-open' : ''}`}>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <aside className="shell__side" id="primary-nav">
        <p className="shell__brand">
          <span className="shell__monogram">{brand.monogram}</span>
          <span>
            {brand.name} <em>{brand.suffix}</em>
          </span>
        </p>

        <nav aria-label="Primary">
          {NAV.map((section) => (
            <div className="shell__nav-group" key={section.group}>
              <p className="eyebrow shell__nav-heading">{section.group}</p>
              <ul>
                {section.items.map((item) =>
                  item.to ? (
                    <li key={item.label}>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          `shell__link ${isActive ? 'shell__link--active' : ''}`
                        }
                        onClick={() => setNavOpen(false)}
                      >
                        {item.label}
                      </NavLink>
                    </li>
                  ) : (
                    <li key={item.label}>
                      <span className="shell__link shell__link--soon">
                        {item.label}
                        <span className="chip chip--soon">next</span>
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Tap-away layer for the mobile drawer. */}
      <button
        className="shell__scrim"
        tabIndex={-1}
        aria-hidden="true"
        onClick={() => setNavOpen(false)}
      />

      <div className="shell__body">
        <header className="shell__top">
          <button
            className="icon-btn shell__burger"
            aria-expanded={navOpen}
            aria-controls="primary-nav"
            onClick={() => setNavOpen((open) => !open)}
          >
            <span className="sr-only">{navOpen ? 'Close navigation' : 'Open navigation'}</span>
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
              <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="1.6" fill="none" />
            </svg>
          </button>

          <h1 className="shell__title">{title}</h1>

          <div className="shell__user">
            <span className="shell__user-meta">
              <span className="shell__user-name">{user?.name}</span>
              <span className="shell__user-role">{user?.jobTitle}</span>
            </span>
            <span className="avatar" aria-hidden="true">
              {user?.avatarInitials}
            </span>
            <button className="btn btn--quiet" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </header>

        <main className="shell__main" id="main">
          {children}
        </main>
      </div>
    </div>
  )
}
