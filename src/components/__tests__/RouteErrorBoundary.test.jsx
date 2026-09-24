import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RouteErrorBoundary } from '../RouteErrorBoundary.jsx'

function Bomb() {
  throw new Error('boom')
}

describe('RouteErrorBoundary', () => {
  it('renders its children normally when nothing throws', () => {
    render(
      <RouteErrorBoundary>
        <p>All good</p>
      </RouteErrorBoundary>
    )
    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  it('catches a render-time crash and shows a recovery UI instead of leaving a blank page', () => {
    // React logs the caught error to console.error itself (its own dev-mode
    // warning, plus the error) - expected noise for this test, not a real failure.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <RouteErrorBoundary>
        <Bomb />
      </RouteErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()

    consoleError.mockRestore()
  })
})
