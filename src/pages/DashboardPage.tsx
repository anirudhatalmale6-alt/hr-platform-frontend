import { useQuery } from '@tanstack/react-query'
import { fetchDashboardSummary } from '../api/dashboard'
import { AppShell } from '../components/AppShell'
import { MetricCard } from '../components/MetricCard'
import { useAuth } from '../auth/useAuth'
import './dashboard.css'

function greeting(name?: string) {
  const first = name?.split(' ')[0] ?? 'there'
  const hour = new Date().getHours()
  if (hour < 12) return `Good morning, ${first}`
  if (hour < 18) return `Good afternoon, ${first}`
  return `Good evening, ${first}`
}

export function DashboardPage() {
  const { user } = useAuth()
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: fetchDashboardSummary,
  })

  const largestDept = data ? Math.max(...data.headcount.map((d) => d.count)) : 1

  return (
    <AppShell title="Dashboard">
      <header className="page-head">
        <div>
          <p className="eyebrow">Today</p>
          <h2 className="page-head__title">{greeting(user?.name)}</h2>
        </div>
        <p className="page-head__note">
          Figures cover the last rolling quarter across all locations.
        </p>
      </header>

      {isError && (
        <div className="notice notice--error" role="alert">
          <p>We could not load the dashboard.</p>
          <button className="btn btn--quiet" onClick={() => void refetch()}>
            Try again
          </button>
        </div>
      )}

      {isPending && !isError && (
        <div className="metrics" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div className="metric metric--skeleton" key={i} />
          ))}
        </div>
      )}

      {data && (
        <>
          <section className="metrics" aria-label="Key metrics">
            {data.metrics.map((metric) => (
              <MetricCard key={metric.key} metric={metric} />
            ))}
          </section>

          <div className="panels">
            <section className="panel panel--wide" aria-labelledby="leave-heading">
              <div className="panel__head">
                <h3 id="leave-heading">Leave awaiting your approval</h3>
                <span className="chip chip--count">{data.pendingLeave.length}</span>
              </div>

              {data.pendingLeave.length === 0 ? (
                <p className="panel__empty">Nothing waiting on you right now.</p>
              ) : (
                <div className="table-scroll">
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">Employee</th>
                        <th scope="col">Type</th>
                        <th scope="col">Dates</th>
                        <th scope="col" className="num">
                          Days
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.pendingLeave.map((row) => (
                        <tr key={row.id}>
                          <th scope="row">
                            <span className="cell-person">
                              <span className="avatar avatar--sm" aria-hidden="true">
                                {row.initials}
                              </span>
                              {row.employee}
                            </span>
                          </th>
                          <td>
                            <span className={`tag tag--${row.type.toLowerCase()}`}>{row.type}</span>
                          </td>
                          <td className="muted">
                            {row.from} – {row.to}
                          </td>
                          <td className="num">{row.days}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="panel" aria-labelledby="headcount-heading">
              <div className="panel__head">
                <h3 id="headcount-heading">Headcount by department</h3>
              </div>
              <ul className="bars">
                {data.headcount.map((row) => (
                  <li key={row.department}>
                    <span className="bars__label">{row.department}</span>
                    <span className="bars__track">
                      <span
                        className="bars__fill"
                        style={{ inlineSize: `${(row.count / largestDept) * 100}%` }}
                      />
                    </span>
                    <span className="bars__value">{row.count}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="panel" aria-labelledby="onboarding-heading">
              <div className="panel__head">
                <h3 id="onboarding-heading">Starting soon</h3>
              </div>
              <ul className="starters">
                {data.onboarding.map((person) => (
                  <li key={person.name}>
                    <span className="avatar avatar--sm" aria-hidden="true">
                      {person.initials}
                    </span>
                    <span className="starters__who">
                      <strong>{person.name}</strong>
                      <span className="muted">{person.role}</span>
                    </span>
                    <span className="starters__when">
                      in {person.startsIn} day{person.startsIn === 1 ? '' : 's'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </AppShell>
  )
}
