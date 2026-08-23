import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Calendar } from '../Calendar.jsx'

// Fixed "today" so month-grid assertions are deterministic regardless of
// when the test suite actually runs. Plain fireEvent (not userEvent) is used
// throughout - Calendar's click handlers are synchronous, and userEvent's
// internal delays don't play well with vi.useFakeTimers().
const FIXED_TODAY = new Date(2026, 2, 15) // 15 March 2026

beforeEach(() => {
  vi.useFakeTimers().setSystemTime(FIXED_TODAY)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Calendar', () => {
  it('renders the current month with today enabled and selectable', () => {
    const onChange = vi.fn()
    render(<Calendar value={null} onChange={onChange} />)

    expect(screen.getByText('March 2026')).toBeInTheDocument()

    const todayCell = screen.getByRole('button', { name: '15' })
    expect(todayCell).not.toBeDisabled()
    fireEvent.click(todayCell)
    expect(onChange).toHaveBeenCalledWith('2026-03-15')
  })

  it('disables days before minDate', () => {
    render(<Calendar value={null} onChange={() => {}} minDate="2026-03-15" />)

    expect(screen.getByRole('button', { name: '10' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '20' })).not.toBeDisabled()
  })

  it('navigates to the next and previous month', () => {
    render(<Calendar value={null} onChange={() => {}} />)

    fireEvent.click(screen.getByLabelText('Next month'))
    expect(screen.getByText('April 2026')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Previous month'))
    fireEvent.click(screen.getByLabelText('Previous month'))
    expect(screen.getByText('February 2026')).toBeInTheDocument()
  })

  it('highlights the selected value', () => {
    render(<Calendar value="2026-03-20" onChange={() => {}} />)

    const selected = screen.getByRole('button', { name: '20' })
    expect(selected.className).toMatch(/selected/)
  })
})
