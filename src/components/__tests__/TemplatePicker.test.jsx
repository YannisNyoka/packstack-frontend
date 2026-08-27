import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TemplatePicker } from '../TemplatePicker.jsx'

const colors = { primary: '#111827', secondary: '#6B7280', accent: '#D946EF' }

describe('TemplatePicker', () => {
  it('renders all 6 template options', () => {
    render(<TemplatePicker value="classic" colors={colors} onChange={() => {}} />)
    expect(screen.getAllByRole('radio')).toHaveLength(6)
    for (const name of ['Classic', 'Modern', 'Elegant', 'Bold', 'Minimal', 'Editorial']) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })

  it('marks the current value as checked', () => {
    render(<TemplatePicker value="modern" colors={colors} onChange={() => {}} />)
    expect(screen.getByRole('radio', { name: /Modern/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: /Classic/ })).toHaveAttribute('aria-checked', 'false')
  })

  it('calls onChange with the clicked template key', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<TemplatePicker value="classic" colors={colors} onChange={onChange} />)

    await user.click(screen.getByRole('radio', { name: /Bold/ }))

    expect(onChange).toHaveBeenCalledWith('bold')
  })
})
