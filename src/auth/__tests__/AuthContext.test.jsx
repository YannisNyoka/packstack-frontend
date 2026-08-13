import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, renderHook } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../AuthContext.jsx'
import * as authApi from '../../api/auth.js'

vi.mock('../../api/auth.js')

function TestConsumer() {
  const { user, booting, login, logout } = useAuth()
  if (booting) return <div>booting</div>
  return (
    <div>
      <div>{user ? `logged in: ${user.email}` : 'logged out'}</div>
      <button onClick={() => login('owner@example.com', 'password123')}>log in</button>
      <button onClick={() => logout()}>log out</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('re-derives the session on boot when the refresh cookie is still valid', async () => {
    authApi.refreshAccessToken.mockResolvedValue(true)
    authApi.getCurrentUser.mockResolvedValue({ email: 'owner@example.com', role: 'owner' })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    expect(screen.getByText('booting')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('logged in: owner@example.com')).toBeInTheDocument())
  })

  it('finishes booting logged-out when there is no valid refresh cookie', async () => {
    authApi.refreshAccessToken.mockResolvedValue(false)

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByText('logged out')).toBeInTheDocument())
    expect(authApi.getCurrentUser).not.toHaveBeenCalled()
  })

  it('finishes booting logged-out if refresh succeeds but fetching the user fails', async () => {
    authApi.refreshAccessToken.mockResolvedValue(true)
    authApi.getCurrentUser.mockRejectedValue(new Error('boom'))

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByText('logged out')).toBeInTheDocument())
  })

  it('login() sets the user from the login response', async () => {
    authApi.refreshAccessToken.mockResolvedValue(false)
    authApi.login.mockResolvedValue({ email: 'staff@example.com', role: 'staff' })
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByText('logged out')).toBeInTheDocument())

    await user.click(screen.getByText('log in'))

    await waitFor(() => expect(screen.getByText('logged in: staff@example.com')).toBeInTheDocument())
    expect(authApi.login).toHaveBeenCalledWith('owner@example.com', 'password123')
  })

  it('logout() clears the user', async () => {
    authApi.refreshAccessToken.mockResolvedValue(true)
    authApi.getCurrentUser.mockResolvedValue({ email: 'owner@example.com', role: 'owner' })
    authApi.logout.mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByText('logged in: owner@example.com')).toBeInTheDocument())

    await user.click(screen.getByText('log out'))

    await waitFor(() => expect(screen.getByText('logged out')).toBeInTheDocument())
  })

  it('useAuth() throws when rendered outside an AuthProvider', () => {
    const { result } = renderHook(() => {
      try {
        return useAuth()
      } catch (err) {
        return err
      }
    })
    expect(result.current).toBeInstanceOf(Error)
    expect(result.current.message).toMatch(/must be used within an AuthProvider/)
  })
})
