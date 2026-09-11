import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BillingSettingsPage } from '../BillingSettingsPage.jsx'
import { useAuth } from '../../../auth/AuthContext.jsx'
import * as billingApi from '../../../api/billing.js'

vi.mock('../../../auth/AuthContext.jsx')
vi.mock('../../../api/billing.js')

const standardPlan = {
  _id: 'plan-standard',
  name: 'Standard',
  priceZAR: 99,
  billingInterval: 'monthly',
  limits: { maxStaff: 50, maxAppointmentsPerMonth: 10000, whatsappMessagesPerMonth: 5000, customDomainAllowed: true },
}

beforeEach(() => {
  vi.resetAllMocks()
  useAuth.mockReturnValue({ user: { role: 'owner', email: 'owner@example.com' } })
  billingApi.listPlans.mockResolvedValue([standardPlan])
})

describe('BillingSettingsPage', () => {
  it('lets a tenant with no subscription yet subscribe', async () => {
    billingApi.getSubscription.mockResolvedValue(null)
    render(<BillingSettingsPage />)

    const button = await screen.findByRole('button', { name: 'Subscribe' })
    expect(button).not.toBeDisabled()
    expect(screen.queryByRole('button', { name: /cancel subscription/i })).not.toBeInTheDocument()
  })

  it('disables the plan button and shows Cancel once a payment method is actually attached', async () => {
    billingApi.getSubscription.mockResolvedValue({
      planId: standardPlan,
      status: 'active',
      billingProviderSubscriptionToken: 'pf-token-123',
    })
    render(<BillingSettingsPage />)

    const button = await screen.findByRole('button', { name: 'Current plan' })
    expect(button).toBeDisabled()
    expect(await screen.findByRole('button', { name: /cancel subscription/i })).toBeInTheDocument()
  })

  it('does not trap a tenant whose checkout was started but never completed (no PayFast token)', async () => {
    // Regression: a Subscription record is created as soon as checkout
    // starts (services/billingService.js), before PayFast has actually
    // captured a card. Treating "a record exists" as "already subscribed"
    // left a tenant with no way to pay (Subscribe disabled) and no way to
    // cancel (nothing to cancel without a token) - a dead end reported live
    // in production against a real tenant.
    billingApi.getSubscription.mockResolvedValue({
      planId: standardPlan,
      status: 'trialing',
      billingProviderSubscriptionToken: null,
    })
    render(<BillingSettingsPage />)

    const button = await screen.findByRole('button', { name: 'Complete subscription' })
    expect(button).not.toBeDisabled()
    expect(screen.queryByRole('button', { name: /cancel subscription/i })).not.toBeInTheDocument()

    button.click()
    await waitFor(() => expect(billingApi.createCheckout).toHaveBeenCalledWith(standardPlan._id))
  })
})
