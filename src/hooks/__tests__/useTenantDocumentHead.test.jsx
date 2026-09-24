import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTenantDocumentHead, deriveFaviconUrl, deriveIconUrl } from '../useTenantDocumentHead.js'

const LOGO_URL = 'https://res.cloudinary.com/demo/image/upload/v123/packstack/t1/logo.jpg'

function getManifestJson() {
  const href = document.querySelector('link[rel="manifest"]')?.href
  const blob = window.__blobs?.get(href)
  return blob ? JSON.parse(blob) : null
}

describe('deriveFaviconUrl / deriveIconUrl', () => {
  it('returns null with no source', () => {
    expect(deriveFaviconUrl(null)).toBeNull()
    expect(deriveIconUrl(null, 192)).toBeNull()
  })

  it('inserts a sized, square Cloudinary transform right after /upload/', () => {
    expect(deriveIconUrl(LOGO_URL, 512)).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_512,h_512,c_fill,g_auto,f_png,q_auto/v123/packstack/t1/logo.jpg'
    )
  })

  it('passes through a non-Cloudinary URL unchanged rather than guessing', () => {
    const other = 'https://example.com/logo.png'
    expect(deriveIconUrl(other, 192)).toBe(other)
  })
})

describe('useTenantDocumentHead', () => {
  const originalTitle = document.title

  beforeEach(() => {
    // jsdom doesn't implement Blob URLs - stub just enough for the hook to
    // exercise its manifest-building path deterministically in tests,
    // tracking blob content by URL so getManifestJson() above can read it back.
    window.__blobs = new Map()
    let counter = 0
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn((blob) => {
        const url = `blob:mock-${counter++}`
        window.__blobs.set(url, blob.__content)
        return url
      }),
      revokeObjectURL: vi.fn((url) => window.__blobs.delete(url)),
    })
    vi.stubGlobal(
      'Blob',
      class {
        constructor(parts) {
          this.__content = parts[0]
        }
      }
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.title = originalTitle
    document.querySelectorAll('link[rel="icon"], link[rel="manifest"], link[rel="apple-touch-icon"]').forEach((el) => el.remove())
    document.querySelectorAll('meta[name="theme-color"], meta[name="apple-mobile-web-app-title"]').forEach((el) => el.remove())
  })

  it('sets title, favicon, manifest, theme-color and apple-touch-icon for a tenant with a logo', () => {
    const { unmount } = renderHook(() =>
      useTenantDocumentHead({ businessName: 'Nailsbynaledi', logoUrl: LOGO_URL, themeColor: '#111827' })
    )

    expect(document.title).toBe('Nailsbynaledi')

    const favicon = document.querySelector('link[rel="icon"]')
    expect(favicon.href).toContain('w_64,h_64,c_fill,g_auto,f_auto,q_auto')

    const manifest = getManifestJson()
    expect(manifest.name).toBe('Nailsbynaledi')
    expect(manifest.theme_color).toBe('#111827')
    expect(manifest.icons).toHaveLength(2)
    expect(manifest.icons[0].src).toContain('w_192,h_192')
    expect(manifest.icons[1].src).toContain('w_512,h_512')

    expect(document.querySelector('link[rel="apple-touch-icon"]').href).toContain('w_192,h_192')
    expect(document.querySelector('meta[name="theme-color"]').content).toBe('#111827')
    expect(document.querySelector('meta[name="apple-mobile-web-app-title"]').content).toBe('Nailsbynaledi')

    unmount()
  })

  it('an explicit faviconUrl overrides logoUrl as the icon source', () => {
    renderHook(() =>
      useTenantDocumentHead({
        businessName: 'Nailsbynaledi',
        logoUrl: LOGO_URL,
        faviconUrl: 'https://res.cloudinary.com/demo/image/upload/v9/packstack/t1/favicon.jpg',
      })
    )

    const manifest = getManifestJson()
    expect(manifest.icons[0].src).toContain('/v9/packstack/t1/favicon.jpg')
    expect(manifest.icons[0].src).not.toContain('logo.jpg')
  })

  it('restores the default title on unmount (captured once at module load, like the rest of the app)', () => {
    // DEFAULT_TITLE/DEFAULT_MANIFEST_HREF/etc. are captured once when this
    // hook module first loads - in this test file's jsdom that's before any
    // test runs, with no manifest/apple-touch-icon tags present (unlike the
    // real app's index.html, which vite-plugin-pwa always populates). This
    // only exercises the part of that contract every test in this file can
    // observe: title genuinely has a real jsdom default to restore to.
    const { unmount, rerender } = renderHook(
      ({ theme }) => useTenantDocumentHead(theme),
      { initialProps: { theme: {} } }
    )
    rerender({ theme: { businessName: 'Nailsbynaledi', logoUrl: LOGO_URL, themeColor: '#111827' } })
    expect(document.title).toBe('Nailsbynaledi')

    expect(() => unmount()).not.toThrow()
    expect(document.title).toBe(originalTitle)
  })

  it('falls back to plain favicon/title behavior with no crash when URL.createObjectURL is unavailable', () => {
    // A plain stub object without createObjectURL, rather than deleting the
    // property off the real global - avoids fighting jsdom/Node's own
    // Blob/URL realm, and is a more direct test of the hook's own guard
    // (typeof URL.createObjectURL === 'function') than the real environment
    // ever not supporting it in practice.
    vi.stubGlobal('URL', {})

    expect(() => {
      renderHook(() => useTenantDocumentHead({ businessName: 'Nailsbynaledi', logoUrl: LOGO_URL }))
    }).not.toThrow()
    expect(document.title).toBe('Nailsbynaledi')
    // No manifest link should have been created - nothing to build one from.
    expect(document.querySelector('link[rel="manifest"]')).toBeNull()
  })

  it('leaves everything at defaults when no theme data is available yet', () => {
    renderHook(() => useTenantDocumentHead({}))
    expect(document.title).toBe(originalTitle)
    expect(document.querySelector('link[rel="manifest"]')).toBeNull()
  })
})
