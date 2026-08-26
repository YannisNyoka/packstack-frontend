import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatCard } from '../StatCard.jsx'

describe('StatCard', () => {
  it('renders the label, value, and icon', () => {
    render(<StatCard label="Bookings today" value={5} icon="📅" tone="blue" />)
    expect(screen.getByText('Bookings today')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('📅')).toBeInTheDocument()
  })

  it('still renders its content with an unrecognized tone, rather than crashing', () => {
    render(<StatCard label="X" value={1} icon="📅" tone="not-a-real-tone" />)
    expect(screen.getByText('X')).toBeInTheDocument()
  })
})
