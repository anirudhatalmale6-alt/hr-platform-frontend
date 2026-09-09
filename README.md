# HR platform — front end

Milestone 1: login and dashboard.

React 19 + TypeScript on Vite. Auth state in Context, server state in TanStack
Query, plain modern CSS with design tokens (no UI kit). Tests in Vitest +
Testing Library, with MSW standing in for the backend.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 12 tests
npm run build
```

Demo accounts (mock backend only):

| Account                        | Password   | Sees                                  |
| ------------------------------ | ---------- | ------------------------------------- |
| `ada.okonjo@northwind.example` | `demo1234` | Admin — company figures, leave queue   |
| `sam.reyes@northwind.example`  | `demo1234` | Employee — own slice only              |

## Pointing it at the real API

Everything backend-shaped lives in `src/api/config.ts` — base URL, endpoint
paths, response field names, refresh strategy. Nothing else in the app knows a
URL. Set the environment and the mock switches off:

```bash
VITE_API_BASE_URL=https://api.example.com/v1
VITE_USE_MOCK_API=false
VITE_REFRESH_STRATEGY=cookie   # or `body` if the refresh token comes back in JSON
```

The paths and field names in that file are **placeholders** written before the
API docs arrived. They are what needs correcting first.

## How auth works

- The access token is held in module memory (`src/api/tokenStore.ts`), never in
  `localStorage` — an XSS payload cannot read it back out of the page.
- The refresh token is expected to be an httpOnly cookie. If the backend returns
  it in the body instead, flip `VITE_REFRESH_STRATEGY=body`; the client then
  keeps it in memory and posts it explicitly.
- A request whose token is inside the expiry skew window (30s) refreshes
  *before* it goes out, rather than spending a round trip on a 401.
- If a 401 comes back anyway, the client refreshes once and replays the request.
  A second 401 ends the session.
- Refresh is **single-flight**: ten components 401-ing in the same tick await one
  network call. This matters for a backend that rotates refresh tokens, where
  parallel refreshes would invalidate each other.
- On boot the app tries a refresh to restore the session, and holds the route
  until that settles — so a hard reload does not bounce a signed-in user to the
  login screen.

## Accessibility

Labelled inputs, a skip link, `role="alert"` on the sign-in error, `aria-expanded`
/ `aria-controls` on the mobile nav toggle, `scope`-ed table headers with the
employee name as a row header, visible focus rings on every interactive element,
and a `prefers-reduced-motion` block that disables the entrance animations.

## Layout

One breakpoint set, no separate mobile build. The shell is a two-column grid
that collapses to a drawer under 900px; metric cards and panels are
`auto-fit` grids, so they reflow rather than snapping at fixed sizes. Wide
tables scroll inside their own container so the page body never scrolls
sideways.

## The mock backend

`src/mocks/` is scaffolding, not product code. It issues real short-lived
tokens (90s), rotates refresh tokens, rejects expired bearers with a 401 and
filters the dashboard payload by role — so the refresh path is exercised for
real rather than assumed. It is deleted once the real API is wired in.

Note: the MSW browser bundle is a lazily-loaded chunk. With
`VITE_USE_MOCK_API=false` it is never fetched, though it still sits in the build
output until `src/mocks/` is removed.

## Not yet built

Employee directory, analytics, settings — later milestones. They appear in the
sidebar marked `next` and are inert on purpose rather than being dead links.
