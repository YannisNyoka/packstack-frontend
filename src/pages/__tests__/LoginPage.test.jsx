import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { LoginPage } from '../LoginPage.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { ApiError } from '../../api/client.js'

vi.mock('../../auth/AuthContext.jsx')

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<div>dashboard page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  let loginMock

  beforeEach(() => {
    loginMock = vi.fn()
    useAuth.mockReturnValue({ login: loginMock })
  })

  it('submits the entered credentials and navigates to /dashboard on success', async () => {
    loginMock.mockResolvedValue({ email: 'owner@example.com', role: 'owner' })
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText('Email'), 'owner@example.com')
    await user.type(screen.getByLabelText('Password'), 'correct-horse-battery-staple')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(loginMock).toHaveBeenCalledWith('owner@example.com', 'correct-horse-battery-staple')
    await waitFor(() => expect(screen.getByText('dashboard page')).toBeInTheDocument())
  })

  it('shows the ApiError message on failed login and stays on the page', async () => {
    loginMock.mockRejectedValue(new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS'))
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText('Email'), 'owner@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() => expect(screen.getByText('Invalid email or password')).toBeInTheDocument())
    expect(screen.queryByText('dashboard page')).not.toBeInTheDocument()
  })

  it('falls back to a generic message for a non-ApiError failure', async () => {
    loginMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText('Email'), 'owner@example.com')
    await user.type(screen.getByLabelText('Password'), 'correct-horse-battery-staple')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() => expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument())
  })

  it('disables the submit button while the request is in flight', async () => {
    let resolveLogin
    loginMock.mockReturnValue(new Promise((resolve) => { resolveLogin = resolve }))
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText('Email'), 'owner@example.com')
    await user.type(screen.getByLabelText('Password'), 'correct-horse-battery-staple')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(screen.getByRole('button', { name: 'Logging in…' })).toBeDisabled()
    resolveLogin({ email: 'owner@example.com', role: 'owner' })
    await waitFor(() => expect(screen.getByText('dashboard page')).toBeInTheDocument())
  })
})
