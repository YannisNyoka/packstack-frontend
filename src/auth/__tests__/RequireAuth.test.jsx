import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '../RequireAuth.jsx'
import { useAuth } from '../AuthContext.jsx'

vi.mock('../AuthContext.jsx')

function renderAt(path, ownerOnly) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/dashboard" element={<div>Dashboard home</div>} />
        <Route
          path="/dashboard/settings"
          element={
            <RequireAuth ownerOnly={ownerOnly}>
              <div>Settings content</div>
            </RequireAuth>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('RequireAuth', () => {
  it('redirects to /login when there is no user', () => {
    useAuth.mockReturnValue({ user: null, booting: false })
    renderAt('/dashboard/settings', true)
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('redirects staff away from an ownerOnly route', () => {
    useAuth.mockReturnValue({ user: { role: 'staff', email: 'staff@example.com' }, booting: false })
    renderAt('/dashboard/settings', true)
    expect(screen.getByText('Dashboard home')).toBeInTheDocument()
    expect(screen.queryByText('Settings content')).not.toBeInTheDocument()
  })

  it('lets an owner through an ownerOnly route', () => {
    useAuth.mockReturnValue({ user: { role: 'owner', email: 'owner@example.com' }, booting: false })
    renderAt('/dashboard/settings', true)
    expect(screen.getByText('Settings content')).toBeInTheDocument()
  })

  it('renders nothing while the silent refresh is still booting', () => {
    useAuth.mockReturnValue({ user: null, booting: true })
    const { container } = renderAt('/dashboard/settings', true)
    expect(container).toBeEmptyDOMElement()
  })
})
