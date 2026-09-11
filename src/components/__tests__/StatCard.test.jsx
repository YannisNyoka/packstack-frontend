import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalendarDays } from 'lucide-react'
import { StatCard } from '../StatCard.jsx'

describe('StatCard', () => {
  it('renders the label, value, and icon', () => {
    const { container } = render(<StatCard label="Bookings today" value={5} icon={CalendarDays} tone="blue" />)
    expect(screen.getByText('Bookings today')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('still renders its content with an unrecognized tone, rather than crashing', () => {
    render(<StatCard label="X" value={1} icon={CalendarDays} tone="not-a-real-tone" />)
    expect(screen.getByText('X')).toBeInTheDocument()
  })
})
