import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OverviewPage } from '../OverviewPage.jsx'
import * as analyticsApi from '../../api/analytics.js'
import * as appointmentsApi from '../../api/appointments.js'
import * as paymentsApi from '../../api/payments.js'

vi.mock('../../api/analytics.js')
vi.mock('../../api/appointments.js')
vi.mock('../../api/payments.js')

const overview = {
  bookingsToday: 3,
  upcomingCount: 10,
  revenueToday: 300,
  revenueWeek: 1950,
  revenueMonth: 4500,
  cancellationsToday: 2,
  noShowsToday: 0,
  unpaidCount: 1,
}

const unpaidAppointment = {
  _id: 'apt-1',
  startTime: '2026-09-05T09:00:00.000Z',
  // Deliberately distinct from overview.revenueToday (300) so table/stat-card
  // text assertions can't collide.
  priceSnapshot: 175,
  customerId: { name: 'Nomcebo Zulu' },
  staffMemberId: { name: 'Noxolo' },
  serviceIds: [{ name: 'Gel X' }],
}

function mockLoadSuccess(unpaid = [unpaidAppointment]) {
  analyticsApi.getOverview.mockResolvedValue(overview)
  analyticsApi.getUnpaidAppointments.mockResolvedValue(unpaid)
}

describe('OverviewPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders every stat card value', async () => {
    mockLoadSuccess()
    render(<OverviewPage />)

    await waitFor(() => expect(screen.getByText('Nomcebo Zulu')).toBeInTheDocument())
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('R300.00')).toBeInTheDocument()
    expect(screen.getByText('R1950.00')).toBeInTheDocument()
    expect(screen.getByText('R4500.00')).toBeInTheDocument()
  })

  it('shows an honest empty state when nothing is unpaid', async () => {
    mockLoadSuccess([])
    render(<OverviewPage />)
    expect(await screen.findByText('Nothing to review — every booking is paid up.')).toBeInTheDocument()
  })

  it('cancels an unpaid appointment via the existing cancelAppointment API', async () => {
    mockLoadSuccess()
    appointmentsApi.cancelAppointment.mockResolvedValue({})
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    render(<OverviewPage />)
    await waitFor(() => expect(screen.getByText('Nomcebo Zulu')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(appointmentsApi.cancelAppointment).toHaveBeenCalledWith('apt-1'))
  })

  it('marks an unpaid appointment as paid via the existing payments API', async () => {
    mockLoadSuccess()
    paymentsApi.recordPayment.mockResolvedValue({})
    const user = userEvent.setup()
    render(<OverviewPage />)
    await waitFor(() => expect(screen.getByText('Nomcebo Zulu')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Mark as paid' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(paymentsApi.recordPayment).toHaveBeenCalledWith('apt-1', { amount: 175, method: 'cash', provider: 'cash' })
    )
  })

  it('shows a fallback error message when the initial load fails with a non-ApiError', async () => {
    analyticsApi.getOverview.mockRejectedValue(new Error('network exploded'))
    analyticsApi.getUnpaidAppointments.mockResolvedValue([])
    render(<OverviewPage />)
    expect(await screen.findByText('Failed to load overview.')).toBeInTheDocument()
  })
})
