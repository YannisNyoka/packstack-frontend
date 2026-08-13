import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppointmentsPage } from '../AppointmentsPage.jsx'
import * as appointmentsApi from '../../api/appointments.js'
import * as staffApi from '../../api/staff.js'
import * as servicesApi from '../../api/services.js'
import * as paymentsApi from '../../api/payments.js'

vi.mock('../../api/appointments.js')
vi.mock('../../api/staff.js')
vi.mock('../../api/services.js')
vi.mock('../../api/payments.js')

const appointment = {
  _id: 'apt-1',
  startTime: '2026-09-01T10:00:00.000Z',
  status: 'booked',
  paymentStatus: 'unpaid',
  priceSnapshot: 250,
  customerId: { name: 'Alice Client' },
  staffMemberId: { name: 'Jane Stylist' },
  serviceIds: [{ name: 'Manicure' }],
}

function mockLoadSuccess(appointments = [appointment]) {
  appointmentsApi.listAppointments.mockResolvedValue(appointments)
  staffApi.listStaff.mockResolvedValue([])
  servicesApi.listServices.mockResolvedValue([])
}

describe('AppointmentsPage - payments', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('shows the payment status badge for each appointment', async () => {
    mockLoadSuccess()
    render(<AppointmentsPage />)

    await waitFor(() => expect(screen.getByText('Alice Client')).toBeInTheDocument())
    expect(screen.getByText('Unpaid')).toBeInTheDocument()
  })

  it('expands the payments panel, lists payment history, and pre-fills the amount from priceSnapshot', async () => {
    mockLoadSuccess()
    paymentsApi.listPayments.mockResolvedValue([
      { _id: 'pay-1', amount: 100, method: 'card', provider: 'yoco', status: 'succeeded', createdAt: '2026-08-01T09:00:00.000Z' },
    ])
    const user = userEvent.setup()
    render(<AppointmentsPage />)
    await waitFor(() => expect(screen.getByText('Alice Client')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Payments' }))

    await waitFor(() => expect(paymentsApi.listPayments).toHaveBeenCalledWith('apt-1'))
    expect(await screen.findByText('R100.00')).toBeInTheDocument()
    expect(screen.getByText('card · yoco')).toBeInTheDocument()
    expect(screen.getByLabelText('Amount (ZAR)')).toHaveValue(250)
  })

  it('shows an honest empty state when there are no payments yet', async () => {
    mockLoadSuccess()
    paymentsApi.listPayments.mockResolvedValue([])
    const user = userEvent.setup()
    render(<AppointmentsPage />)
    await waitFor(() => expect(screen.getByText('Alice Client')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Payments' }))

    expect(await screen.findByText('No payments recorded yet for this appointment.')).toBeInTheDocument()
  })

  it('collapses the panel when Payments is clicked again', async () => {
    mockLoadSuccess()
    paymentsApi.listPayments.mockResolvedValue([])
    const user = userEvent.setup()
    render(<AppointmentsPage />)
    await waitFor(() => expect(screen.getByText('Alice Client')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Payments' }))
    await screen.findByText('No payments recorded yet for this appointment.')

    await user.click(screen.getByRole('button', { name: 'Payments' }))
    expect(screen.queryByText('No payments recorded yet for this appointment.')).not.toBeInTheDocument()
  })

  it('records a payment with the form values and refreshes both the payment list and the appointment badge', async () => {
    mockLoadSuccess()
    paymentsApi.recordPayment.mockResolvedValue({ payment: {}, appointment: {} })
    // First call (opening the panel) is empty; second (after recording) has the new payment.
    paymentsApi.listPayments.mockResolvedValueOnce([]).mockResolvedValueOnce([
      { _id: 'pay-1', amount: 250, method: 'card', provider: 'manual', status: 'succeeded', createdAt: '2026-08-01T09:00:00.000Z' },
    ])
    // First call (initial load) has the unpaid appointment; second (post-payment reload) is paid.
    appointmentsApi.listAppointments.mockResolvedValueOnce([appointment]).mockResolvedValueOnce([
      { ...appointment, paymentStatus: 'paid_card' },
    ])

    const user = userEvent.setup()
    render(<AppointmentsPage />)
    await waitFor(() => expect(screen.getByText('Alice Client')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Payments' }))
    await screen.findByText('No payments recorded yet for this appointment.')

    await user.selectOptions(screen.getByLabelText('Method'), 'card')
    await user.selectOptions(screen.getByLabelText('Provider'), 'manual')
    await user.click(screen.getByRole('button', { name: 'Record payment' }))

    await waitFor(() =>
      expect(paymentsApi.recordPayment).toHaveBeenCalledWith('apt-1', {
        amount: 250,
        method: 'card',
        provider: 'manual',
        providerTransactionId: undefined,
      })
    )

    expect(await screen.findByText('R250.00')).toBeInTheDocument()
    expect(await screen.findByText('Paid (card)')).toBeInTheDocument()
  })

  it('shows an error and keeps the form open if recording a payment fails', async () => {
    mockLoadSuccess()
    paymentsApi.listPayments.mockResolvedValue([])
    paymentsApi.recordPayment.mockRejectedValue(new Error('Amount must be positive'))
    const user = userEvent.setup()
    render(<AppointmentsPage />)
    await waitFor(() => expect(screen.getByText('Alice Client')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Payments' }))
    await screen.findByText('No payments recorded yet for this appointment.')

    await user.click(screen.getByRole('button', { name: 'Record payment' }))

    expect(await screen.findByText('Failed to record payment.')).toBeInTheDocument()
  })
})
