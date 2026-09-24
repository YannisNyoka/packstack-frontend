import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png'],
      // This is the DEFAULT manifest, shipped for the dashboard/superadmin
      // and as the fallback before a tenant's own theme has loaded - every
      // public tenant page overrides it per-tenant at runtime (own name,
      // own icon derived from their logo) via
      // src/hooks/useTenantDocumentHead.js, which is what makes an
      // installed icon actually say "Nailsbynaledi" instead of "PackStack".
      // Each tenant lives on its own subdomain, so the browser's own
      // per-origin PWA scoping keeps tenants' installed apps completely
      // separate with zero extra plumbing.
      manifest: {
        name: 'PackStack',
        short_name: 'PackStack',
        description: 'Business apps for South African companies',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0F172A',
        icons: [
          { src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precaches only the built app shell (JS/CSS/fonts/icons) for fast
        // repeat loads and a working offline shell - deliberately no
        // runtimeCaching rules, so /api/* calls are never intercepted or
        // cached. Booking availability, appointments and account data must
        // always come from the network live, never a stale cache.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
    // The default "forks" pool hangs waiting for its worker to respond in
    // this environment (sandboxed process spawning, most likely) - threads
    // (worker_threads, no child process) runs reliably instead.
    pool: 'threads',
  },
})
