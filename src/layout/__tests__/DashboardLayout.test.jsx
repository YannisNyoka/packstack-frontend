import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DashboardLayout, trialBanner } from '../DashboardLayout.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'

vi.mock('../../auth/AuthContext.jsx')

const DAY_MS = 24 * 60 * 60 * 1000

describe('trialBanner()', () => {
  it('returns null when the tenant is not on trial', () => {
    expect(trialBanner('active', new Date(Date.now() + 5 * DAY_MS))).toBeNull()
  })

  it('returns null when there is no trialEndsAt at all', () => {
    expect(trialBanner('trial', null)).toBeNull()
  })

  it('shows a neutral banner with more than a week left', () => {
    const result = trialBanner('trial', new Date(Date.now() + 20 * DAY_MS))
    expect(result.tone).toBe('neutral')
    expect(result.message).toMatch(/20 days left/)
  })

  it('switches to a warning tone inside the last 7 days', () => {
    const result = trialBanner('trial', new Date(Date.now() + 6 * DAY_MS + 1000))
    expect(result.tone).toBe('warning')
    expect(result.message).toMatch(/7 days left/) // rounds up, not down
  })

  it('uses singular "day" for exactly one day left', () => {
    const result = trialBanner('trial', new Date(Date.now() + 12 * 60 * 60 * 1000)) // 12h -> rounds up to 1 day
    expect(result.message).toBe('1 day left in your free trial.')
  })

  it('shows the expired message once trialEndsAt is in the past', () => {
    const result = trialBanner('trial', new Date(Date.now() - DAY_MS))
    expect(result.tone).toBe('danger')
    expect(result.message).toMatch(/trial has ended/)
  })
})

describe('DashboardLayout banner', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('prefers the suspended/past_due banner over a trial banner if both would apply', () => {
    useAuth.mockReturnValue({
      user: { role: 'owner', email: 'owner@example.com', tenantStatus: 'suspended', trialEndsAt: new Date(Date.now() + DAY_MS) },
      logout: vi.fn(),
    })
    render(
      <MemoryRouter>
        <DashboardLayout />
      </MemoryRouter>
    )
    expect(screen.getByText(/account is suspended/)).toBeInTheDocument()
  })

  it('shows the trial countdown for a trialing tenant', () => {
    useAuth.mockReturnValue({
      user: { role: 'owner', email: 'owner@example.com', tenantStatus: 'trial', trialEndsAt: new Date(Date.now() + 10 * DAY_MS) },
      logout: vi.fn(),
    })
    render(
      <MemoryRouter>
        <DashboardLayout />
      </MemoryRouter>
    )
    expect(screen.getByText(/10 days left in your free trial/)).toBeInTheDocument()
  })

  it('shows no banner for an active, fully-paid tenant', () => {
    useAuth.mockReturnValue({
      user: { role: 'owner', email: 'owner@example.com', tenantStatus: 'active', trialEndsAt: null },
      logout: vi.fn(),
    })
    render(
      <MemoryRouter>
        <DashboardLayout />
      </MemoryRouter>
    )
    expect(screen.queryByText(/trial/)).not.toBeInTheDocument()
    expect(screen.queryByText(/suspended/)).not.toBeInTheDocument()
  })
})
