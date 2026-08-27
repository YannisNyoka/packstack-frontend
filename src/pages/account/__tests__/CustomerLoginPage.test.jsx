import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { CustomerLoginPage } from '../CustomerLoginPage.jsx'
import { useCustomerAuth } from '../../../auth/CustomerAuthContext.jsx'
import { useAuth } from '../../../auth/AuthContext.jsx'
import * as bookingApi from '../../../api/publicBooking.js'
import { ApiError } from '../../../api/client.js'

vi.mock('../../../auth/CustomerAuthContext.jsx')
vi.mock('../../../auth/AuthContext.jsx')
vi.mock('../../../api/publicBooking.js')

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/account/login']}>
      <Routes>
        <Route path="/account/login" element={<CustomerLoginPage />} />
        <Route path="/book" element={<div>Booking wizard</div>} />
        <Route path="/dashboard" element={<div>Owner dashboard</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('CustomerLoginPage', () => {
  let customerLogin
  let dashboardLogin

  beforeEach(() => {
    vi.resetAllMocks()
    bookingApi.getTheme.mockResolvedValue(null)
    customerLogin = vi.fn()
    dashboardLogin = vi.fn()
    useCustomerAuth.mockReturnValue({ login: customerLogin })
    useAuth.mockReturnValue({ login: dashboardLogin })
  })

  async function submit(user) {
    await user.type(screen.getByLabelText('Email'), 'someone@example.com')
    await user.type(screen.getByLabelText('Password'), 'whatever-password')
    await user.click(screen.getByRole('button', { name: 'Log in' }))
  }

  it('routes to /dashboard on a successful owner login, without ever trying the customer login', async () => {
    dashboardLogin.mockResolvedValue({ id: 'u1', email: 'owner@example.com', role: 'owner' })
    const user = userEvent.setup()
    renderPage()

    await submit(user)

    await waitFor(() => expect(screen.getByText('Owner dashboard')).toBeInTheDocument())
    expect(customerLogin).not.toHaveBeenCalled()
  })

  it('routes staff logins to /dashboard too, without trying the customer login', async () => {
    dashboardLogin.mockResolvedValue({ id: 'u2', email: 'staff@example.com', role: 'staff' })
    const user = userEvent.setup()
    renderPage()

    await submit(user)

    await waitFor(() => expect(screen.getByText('Owner dashboard')).toBeInTheDocument())
    expect(customerLogin).not.toHaveBeenCalled()
  })

  it('falls back to the customer login and routes to /book when the dashboard login fails', async () => {
    dashboardLogin.mockRejectedValue(new ApiError(401, 'Invalid email or password'))
    customerLogin.mockResolvedValue({ id: 'c1', email: 'someone@example.com' })
    const user = userEvent.setup()
    renderPage()

    await submit(user)

    await waitFor(() => expect(screen.getByText('Booking wizard')).toBeInTheDocument())
  })

  it('prefers the dashboard login even when the same email/password also validates as a customer', async () => {
    // An owner can easily also hold a customer account on their own site
    // (e.g. from testing the booking flow themselves) - if the dashboard
    // login succeeds, the customer login must never even be attempted, so
    // there's no way a coincidentally-valid customer account could win.
    dashboardLogin.mockResolvedValue({ id: 'u1', email: 'owner@example.com', role: 'owner' })
    customerLogin.mockResolvedValue({ id: 'c1', email: 'owner@example.com' })
    const user = userEvent.setup()
    renderPage()

    await submit(user)

    await waitFor(() => expect(screen.getByText('Owner dashboard')).toBeInTheDocument())
    expect(customerLogin).not.toHaveBeenCalled()
  })

  it('shows one generic error when both logins fail, never the dashboard-specific reason', async () => {
    dashboardLogin.mockRejectedValue(
      new ApiError(403, 'Account temporarily locked due to repeated failed login attempts', 'ACCOUNT_LOCKED')
    )
    customerLogin.mockRejectedValue(new ApiError(401, 'Invalid email or password'))
    const user = userEvent.setup()
    renderPage()

    await submit(user)

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument()
    expect(screen.queryByText(/locked/)).not.toBeInTheDocument()
  })

  it('shows a generic network-error message and never attempts the customer login on an unexpected failure', async () => {
    dashboardLogin.mockRejectedValue(new TypeError('Failed to fetch'))
    const user = userEvent.setup()
    renderPage()

    await submit(user)

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
    expect(customerLogin).not.toHaveBeenCalled()
  })
})
