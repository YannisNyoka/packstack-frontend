# packstack-frontend

The tenant owner/staff dashboard for the PackStack multi-tenant SaaS platform
(salon booking, generalized from NXL Beauty Bar) - talks to
[packstack-backend](../packstack-backend). See
[../packstack/docs/architecture/phase-0-design.md](../packstack/docs/architecture/phase-0-design.md)
for the platform architecture this implements.

This is a separate project from `packstack` (that one is the marketing site
for PackStack itself, and stays that way per the architecture doc's repo
decision) and from `nxl-beauty-bar_frontend` (NXL's original single-tenant
site, kept for reference - not migrated onto this platform, see this repo's
own project memory on that decision).

## Setup

```bash
npm install
cp .env.example .env.local
```

`packstack-backend` must already be running (see its own README) and have at
least one tenant provisioned - set `VITE_DEV_TENANT_SLUG` in `.env.local` to
that tenant's slug. There's no wildcard DNS for local dev, same reasoning as
the backend: `getTenantSlug()` (`src/api/tenant.js`) falls back to that env
var on `localhost` instead of parsing a subdomain.

```bash
npm run dev
```

## What's here

- **Auth** (`src/auth/`): the access token lives in memory only (never
  `localStorage`), lost on every page reload by design - `AuthContext`
  re-derives it via a silent `POST /auth/refresh` against the backend's
  httpOnly refresh cookie on boot, then `GET /auth/me` for who's logged in.
  `RequireAuth` gates routes (and `ownerOnly` for owner-specific ones) behind
  that.
- **API client** (`src/api/client.js`): thin `fetch` wrapper - attaches the
  bearer token, sends `credentials: 'include'` for the refresh cookie, and
  retries exactly once through a silent refresh on a 401 before giving up.
  `apiUpload()` is the same contract for a `multipart/form-data` body
  (no JSON-stringify, no manual `Content-Type`).
- **Dashboard pages** (`src/pages/`): Appointments (list/filter, create,
  reschedule, cancel, status transitions, per-appointment payment history and
  manual payment recording), Staff (create/edit, working hours, one-off time
  off), Services, Customers (create/edit, loyalty point adjustment), and
  Settings - owner-only actions are hidden for staff-role accounts via
  `user.role`. Settings covers Branding (business name/tagline/colors/
  contact/social, logo & banner upload via Cloudinary), Integrations
  (WATI/Resend/Yoco), Deposits, Billing (PayFast checkout), and Custom
  Domains.
- **Public surfaces**: `BookingPage` (no-login customer booking flow,
  including the Yoco deposit checkout redirect and an "Add to Google
  Calendar" link) and `ManagePage` (`/manage?token=...` - no-login
  reschedule/cancel via the signed link every confirmation includes).
- **Superadmin console** (`src/superadmin/`, `src/pages/superadmin/`):
  separate auth context and login from the tenant dashboard - tenant
  provisioning/listing and Plan management.

## Testing

```bash
npm test        # vitest run - one-shot
npm run test:watch
```

Vitest + React Testing Library, `jsdom` environment. Component tests mock
the relevant `src/api/*.js` modules directly (`vi.mock('../../api/x.js')`)
rather than mocking `fetch` - keeps tests focused on component behavior, with
`src/api/__tests__/client.test.js` covering the shared fetch/auth/retry
plumbing once, at the source. Coverage today: the API client's auth/retry
contract, session bootstrapping (`AuthContext`), login, and the two most
involved dashboard flows (Appointments' payment recording, Settings'
Branding section including file upload). Not yet covered: Staff, Services,
Customers, BookingPage, ManagePage, the superadmin pages.

Note: the default Vitest "forks" pool hangs waiting for its worker in this
environment (sandboxed process spawning, most likely) - `vite.config.js`
pins `pool: 'threads'` instead. If tests hang on a machine that doesn't have
that problem, forks is likely fine there too; the pin is defensive, not a
hard requirement.

## Not built yet

- **Custom-domain resolution** on the frontend side: `getTenantSlug()` only
  handles the subdomain case. The backend's `GET /api/public/domains/:domain`
  (see its Phase 3 docs) exists for the custom-domain case but nothing here
  calls it yet.
- Real pricing `Plan` records - the Billing section and checkout flow are
  fully built and tested, but no tenant-facing plan/pricing tiers have
  actually been created yet (business decision, not a code gap - see
  packstack-backend's superadmin `POST /api/platform/plans`).
