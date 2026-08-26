import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../tenant.js', () => ({
  getTenantSlug: () => 'test-salon',
}))

// Imported after the mock above is registered, and reset per-test via
// vi.resetModules() so each test starts with a clean in-memory accessToken -
// client.js keeps it in module-level state (see its own comment on why:
// memory-only, never localStorage), which would otherwise leak between tests.
async function freshClient() {
  vi.resetModules()
  return import('../client.js')
}

describe('api/client.js', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock
    // client.js reads import.meta.env.VITE_API_BASE_URL once at module load -
    // stub it explicitly so these assertions don't depend on whatever
    // .env.local happens to be pointed at on whoever's machine runs this.
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:4000')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('apiFetch calls the tenant-scoped URL with no Authorization header when logged out', async () => {
    const { apiFetch } = await freshClient()
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) })

    await apiFetch('/appointments')

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:4000/api/t/test-salon/appointments')
    expect(options.headers.Authorization).toBeUndefined()
    expect(options.credentials).toBe('include')
  })

  it('apiFetch attaches the Authorization header once a token is set', async () => {
    const { apiFetch, setAccessToken } = await freshClient()
    setAccessToken('token-123')
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) })

    await apiFetch('/appointments')

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer token-123')
  })

  it('JSON-encodes the body and sets Content-Type when a body is given', async () => {
    const { apiFetch } = await freshClient()
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })

    await apiFetch('/customers', { method: 'POST', body: { name: 'Jane' } })

    const [, options] = fetchMock.mock.calls[0]
    expect(options.method).toBe('POST')
    expect(options.headers['Content-Type']).toBe('application/json')
    expect(options.body).toBe(JSON.stringify({ name: 'Jane' }))
  })

  it('throws an ApiError carrying the server message on a non-ok response', async () => {
    const { apiFetch, ApiError } = await freshClient()
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: 'Not found', code: 'NOT_FOUND' } }),
    })

    await expect(apiFetch('/customers/missing')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      code: 'NOT_FOUND',
      message: 'Not found',
    })
    await expect(apiFetch('/customers/missing')).rejects.toBeInstanceOf(ApiError)
  })

  it('on a 401, refreshes once and retries the original request', async () => {
    const { apiFetch, setAccessToken } = await freshClient()
    setAccessToken('stale-token')

    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) }) // original request
      .mockResolvedValueOnce({ ok: true, json: async () => ({ accessToken: 'fresh-token' }) }) // refresh
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ retried: true }) }) // retried request

    const result = await apiFetch('/appointments')

    expect(result).toEqual({ retried: true })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    // The retried request must carry the newly-refreshed token, not the stale one.
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer fresh-token')
  })

  it('gives up after a 401 if the refresh itself fails', async () => {
    const { apiFetch, ApiError } = await freshClient()

    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) }) // original request
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) }) // refresh fails

    await expect(apiFetch('/appointments')).rejects.toBeInstanceOf(ApiError)
    expect(fetchMock).toHaveBeenCalledTimes(2) // no third (retried) call
  })

  it('returns null for a 204 response instead of parsing a body', async () => {
    const { apiFetch } = await freshClient()
    fetchMock.mockResolvedValue({ ok: true, status: 204 })

    await expect(apiFetch('/appointments/1', { method: 'DELETE' })).resolves.toBeNull()
  })

  it('apiUpload sends the FormData body without a Content-Type header', async () => {
    const { apiUpload, setAccessToken } = await freshClient()
    setAccessToken('token-123')
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ logoUrl: 'https://cdn/img.png' }) })

    const formData = new FormData()
    formData.append('image', new Blob(['x']), 'logo.png')
    const result = await apiUpload('/settings/theme/logo', formData)

    expect(result).toEqual({ logoUrl: 'https://cdn/img.png' })
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:4000/api/t/test-salon/settings/theme/logo')
    expect(options.method).toBe('POST')
    expect(options.body).toBe(formData)
    expect(options.headers['Content-Type']).toBeUndefined()
    expect(options.headers.Authorization).toBe('Bearer token-123')
  })

  it('refreshAccessToken clears the token when the refresh call fails', async () => {
    const { refreshAccessToken, setAccessToken, getAccessToken } = await freshClient()
    setAccessToken('will-be-cleared')
    fetchMock.mockResolvedValue({ ok: false })

    const refreshed = await refreshAccessToken()

    expect(refreshed).toBe(false)
    expect(getAccessToken()).toBeNull()
  })
})
