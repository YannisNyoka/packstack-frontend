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

  it('routes to /book on a successful customer login, without trying the dashboard login', async () => {
    customerLogin.mockResolvedValue({ id: 'c1', email: 'someone@example.com' })
    const user = userEvent.setup()
    renderPage()

    await submit(user)

    await waitFor(() => expect(screen.getByText('Booking wizard')).toBeInTheDocument())
    expect(dashboardLogin).not.toHaveBeenCalled()
  })

  it('falls back to the dashboard login and routes to /dashboard when the customer login fails', async () => {
    customerLogin.mockRejectedValue(new ApiError(401, 'Invalid email or password'))
    dashboardLogin.mockResolvedValue({ id: 'u1', email: 'owner@example.com', role: 'owner' })
    const user = userEvent.setup()
    renderPage()

    await submit(user)

    await waitFor(() => expect(screen.getByText('Owner dashboard')).toBeInTheDocument())
  })

  it('routes staff logins to /dashboard too', async () => {
    customerLogin.mockRejectedValue(new ApiError(401, 'Invalid email or password'))
    dashboardLogin.mockResolvedValue({ id: 'u2', email: 'staff@example.com', role: 'staff' })
    const user = userEvent.setup()
    renderPage()

    await submit(user)

    await waitFor(() => expect(screen.getByText('Owner dashboard')).toBeInTheDocument())
  })

  it('shows one generic error when both logins fail, never the dashboard-specific reason', async () => {
    customerLogin.mockRejectedValue(new ApiError(401, 'Invalid email or password'))
    dashboardLogin.mockRejectedValue(
      new ApiError(403, 'Account temporarily locked due to repeated failed login attempts', 'ACCOUNT_LOCKED')
    )
    const user = userEvent.setup()
    renderPage()

    await submit(user)

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument()
    expect(screen.queryByText(/locked/)).not.toBeInTheDocument()
  })

  it('shows a generic network-error message and never attempts the dashboard login on an unexpected failure', async () => {
    customerLogin.mockRejectedValue(new TypeError('Failed to fetch'))
    const user = userEvent.setup()
    renderPage()

    await submit(user)

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
    expect(dashboardLogin).not.toHaveBeenCalled()
  })
})
