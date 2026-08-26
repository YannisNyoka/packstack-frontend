import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnalyticsPage } from '../AnalyticsPage.jsx'
import * as analyticsApi from '../../api/analytics.js'

vi.mock('../../api/analytics.js')

function summaryFor(range) {
  return {
    range,
    combinedRevenue: 4500,
    bookingsCount: 53,
    totalClients: 123,
    completionRate: 89,
    loyaltyMembers: 74,
    dailyBookings: [{ date: '2026-08-20', count: 4 }],
    dailyRevenue: [{ date: '2026-08-20', amount: 400 }],
  }
}

describe('AnalyticsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('loads the 30-day range by default and renders the stat tiles', async () => {
    analyticsApi.getSummary.mockResolvedValue(summaryFor('30d'))
    render(<AnalyticsPage />)

    await waitFor(() => expect(analyticsApi.getSummary).toHaveBeenCalledWith('30d'))
    expect(await screen.findByText('R4500.00')).toBeInTheDocument()
    expect(screen.getByText('53')).toBeInTheDocument()
    expect(screen.getByText('123')).toBeInTheDocument()
    expect(screen.getByText('89%')).toBeInTheDocument()
    expect(screen.getByText('74')).toBeInTheDocument()
    expect(screen.getByText('Daily bookings')).toBeInTheDocument()
    expect(screen.getByText('Daily revenue')).toBeInTheDocument()
  })

  it('re-fetches with the new range when a range button is clicked', async () => {
    analyticsApi.getSummary.mockResolvedValue(summaryFor('30d'))
    const user = userEvent.setup()
    render(<AnalyticsPage />)
    await waitFor(() => expect(analyticsApi.getSummary).toHaveBeenCalledWith('30d'))

    analyticsApi.getSummary.mockResolvedValue(summaryFor('7d'))
    await user.click(screen.getByRole('button', { name: '7 days' }))

    await waitFor(() => expect(analyticsApi.getSummary).toHaveBeenCalledWith('7d'))
  })

  it('shows an error message when the summary fails to load', async () => {
    analyticsApi.getSummary.mockRejectedValue(new Error('network exploded'))
    render(<AnalyticsPage />)
    expect(await screen.findByText('Failed to load analytics.')).toBeInTheDocument()
  })
})
