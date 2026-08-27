import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LandingPreview } from '../LandingPreview.jsx'
import * as bookingApi from '../../api/publicBooking.js'

vi.mock('../../api/publicBooking.js')

const baseTheme = {
  businessName: 'Test Salon',
  tagline: 'Look good, feel good.',
  logoUrl: '',
  bannerUrl: '',
  heroEnabled: true,
  heroMediaType: 'image',
  heroVideoUrls: [],
  colors: { primary: '#111827', secondary: '#6B7280', accent: '#D946EF' },
  contactInfo: {},
  socialLinks: {},
}

function renderPreview(theme) {
  return render(
    <MemoryRouter>
      <LandingPreview theme={theme} />
    </MemoryRouter>
  )
}

describe('LandingPreview', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    bookingApi.listServices.mockResolvedValue([])
    bookingApi.listStaff.mockResolvedValue([])
  })

  it.each(['classic', 'modern', 'elegant', 'bold', 'minimal', 'editorial'])(
    'renders the %s template without throwing',
    async (template) => {
      renderPreview({ ...baseTheme, template })
      await waitFor(() => expect(screen.getByTestId(`landing-template-${template}`)).toBeInTheDocument())
      // Every template shows the business name at least once (nav and/or
      // hero) - getAllByText since most show it in both.
      expect(screen.getAllByText('Test Salon').length).toBeGreaterThan(0)
    }
  )

  it('falls back to Classic for an unknown or missing template value', async () => {
    renderPreview({ ...baseTheme, template: 'not-a-real-one' })
    await waitFor(() => expect(screen.getByTestId('landing-template-classic')).toBeInTheDocument())
  })

  it('falls back to Classic when theme is null (still loading)', () => {
    renderPreview(null)
    expect(screen.getByTestId('landing-template-classic')).toBeInTheDocument()
  })
})
