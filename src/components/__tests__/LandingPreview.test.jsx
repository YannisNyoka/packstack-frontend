import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LandingPreview } from '../LandingPreview.jsx'
import * as bookingApi from '../../api/publicBooking.js'

vi.mock('../../api/publicBooking.js')

const ALL_TEMPLATES = [
  'classic',
  'modern',
  'elegant',
  'bold',
  'minimal',
  'editorial',
  'luxe',
  'boutique',
  'studio',
  'glow',
  'heritage',
  'loft',
  'petal',
  'noir',
  'horizon',
  'aura',
  'marble',
  'canvas',
  'velvet',
  'pulse',
  'linen',
  'sidebar',
  'neon',
  'terrazzo',
  'neumorphic',
  'flare',
]

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

  it.each(ALL_TEMPLATES)(
    'renders the %s template without throwing',
    async (template) => {
      renderPreview({ ...baseTheme, template })
      await waitFor(() => expect(screen.getByTestId(`landing-template-${template}`)).toBeInTheDocument())
      // Every template shows the business name at least once (nav and/or
      // hero) - getAllByText since most show it in both.
      expect(screen.getAllByText('Test Salon').length).toBeGreaterThan(0)
    }
  )

  it.each(ALL_TEMPLATES)(
    'hides the business name from the hero (keeps it in the nav) for %s when businessNamePosition is "nav"',
    async (template) => {
      renderPreview({ ...baseTheme, template, businessNamePosition: 'nav' })
      await waitFor(() => expect(screen.getByTestId(`landing-template-${template}`)).toBeInTheDocument())
      expect(within(document.querySelector('nav')).getByText('Test Salon')).toBeInTheDocument()
      expect(within(document.querySelector('header')).queryByText('Test Salon')).toBeNull()
    }
  )

  it.each(ALL_TEMPLATES)(
    'hides the business name from the nav (keeps it in the hero) for %s when businessNamePosition is "hero"',
    async (template) => {
      renderPreview({ ...baseTheme, template, businessNamePosition: 'hero' })
      await waitFor(() => expect(screen.getByTestId(`landing-template-${template}`)).toBeInTheDocument())
      expect(within(document.querySelector('nav')).queryByText('Test Salon')).toBeNull()
      expect(within(document.querySelector('header')).getByText('Test Salon')).toBeInTheDocument()
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

  it('shows a "Get Directions" link to Google Maps once an address is set, and not before', async () => {
    const { rerender } = renderPreview({ ...baseTheme, template: 'classic' })
    await waitFor(() => expect(screen.getByTestId('landing-template-classic')).toBeInTheDocument())
    expect(screen.queryByText('Get Directions →')).not.toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <LandingPreview theme={{ ...baseTheme, template: 'classic', contactInfo: { address: '1948 Mahalefele Rd, Dube, Soweto' } }} />
      </MemoryRouter>
    )
    const link = await screen.findByText('Get Directions →')
    expect(link).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=1948%20Mahalefele%20Rd%2C%20Dube%2C%20Soweto'
    )
    expect(link).toHaveAttribute('target', '_blank')
  })
})
