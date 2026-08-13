import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'
import { resolveTenantSlug } from './api/tenant.js'

// This app routinely renders real customer PII (name, phone, email) pulled
// from packstack-backend - opt out of Sentry's default user/request data
// collection rather than take the default. See instrument.js in
// packstack-backend for the same reasoning applied server-side.
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },
})

const root = createRoot(document.getElementById('root'))

function renderApp() {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// The superadmin console isn't tenant-scoped at all (talks to
// /api/platform/... directly - see api/platformClient.js), so it must never
// be blocked on resolving a tenant for this origin. Every other route needs
// a resolved slug before it can make any API call at all (see api/tenant.js),
// so resolution happens once here, before anything renders.
if (window.location.pathname.startsWith('/superadmin')) {
  renderApp()
} else {
  resolveTenantSlug()
    .then(renderApp)
    .catch((err) => {
      root.render(
        <div style={{ maxWidth: 420, margin: '96px auto', padding: '0 20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 20 }}>Site not found</h1>
          <p className="error-text">{err.message}</p>
        </div>,
      )
    })
}
