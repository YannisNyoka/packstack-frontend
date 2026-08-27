import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { BrandingSettingsPage } from '../BrandingSettingsPage.jsx'
import * as themeApi from '../../../api/theme.js'

// Embeds a live preview (LandingPreview) that uses <Link>/useNavigate -
// needs a Router ancestor, same as it always gets for real inside App.jsx's
// BrowserRouter.
function renderPage() {
  return render(
    <MemoryRouter>
      <BrandingSettingsPage />
    </MemoryRouter>
  )
}

vi.mock('../../../api/theme.js')

const baseTheme = {
  businessName: 'Verify Test Salon',
  tagline: '',
  logoUrl: '',
  bannerUrl: '',
  colors: { primary: '#111827', secondary: '#6B7280', accent: '#D946EF' },
  contactInfo: { phone: '', email: '', address: '' },
  socialLinks: { instagram: '', facebook: '', whatsapp: '' },
}

describe('BrandingSettingsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('loads and displays the current branding', async () => {
    themeApi.getTheme.mockResolvedValue(baseTheme)
    renderPage()

    await waitFor(() => expect(screen.getByLabelText('Business name')).toHaveValue('Verify Test Salon'))
    // The "primary"/"secondary"/"accent" labels are visually capitalized via
    // CSS text-transform only - the actual accessible/DOM text stays
    // lowercase, and each color has two inputs (a <input type="color">
    // swatch plus this text field) sharing one label, so the id is the only
    // unambiguous way to target the text field specifically.
    expect(document.getElementById('theme-color-primary')).toHaveValue('#111827')
  })

  it('saves edited branding fields, merging into the existing theme', async () => {
    themeApi.getTheme.mockResolvedValue(baseTheme)
    themeApi.updateTheme.mockResolvedValue({ ...baseTheme, tagline: 'Nails, hair, beauty.' })
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.getByLabelText('Business name')).toHaveValue('Verify Test Salon'))

    await user.type(screen.getByLabelText('Tagline'), 'Nails, hair, beauty.')
    await user.click(screen.getByRole('button', { name: 'Save branding' }))

    await waitFor(() =>
      expect(themeApi.updateTheme).toHaveBeenCalledWith(
        expect.objectContaining({ businessName: 'Verify Test Salon', tagline: 'Nails, hair, beauty.' })
      )
    )
    expect(await screen.findByText('Saved.')).toBeInTheDocument()
  })

  it('shows a save error without losing the in-progress edit', async () => {
    themeApi.getTheme.mockResolvedValue(baseTheme)
    themeApi.updateTheme.mockRejectedValue(new Error('network down'))
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.getByLabelText('Business name')).toHaveValue('Verify Test Salon'))

    await user.type(screen.getByLabelText('Tagline'), 'Draft tagline')
    await user.click(screen.getByRole('button', { name: 'Save branding' }))

    expect(await screen.findByText('Failed to save branding.')).toBeInTheDocument()
    expect(screen.getByLabelText('Tagline')).toHaveValue('Draft tagline')
  })

  it('uploads a logo file and updates the Logo URL field from the response', async () => {
    themeApi.getTheme.mockResolvedValue(baseTheme)
    themeApi.uploadLogo.mockResolvedValue({ ...baseTheme, logoUrl: 'https://res.cloudinary.com/demo/logo.png' })
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.getByLabelText('Business name')).toHaveValue('Verify Test Salon'))

    const file = new File(['fake-bytes'], 'logo.png', { type: 'image/png' })
    const fileInput = document.getElementById('theme-logo-file')
    await user.upload(fileInput, file)

    await waitFor(() => expect(themeApi.uploadLogo).toHaveBeenCalledWith(file))
    await waitFor(() => expect(screen.getByLabelText('Logo URL')).toHaveValue('https://res.cloudinary.com/demo/logo.png'))
  })

  it('shows an error if the upload fails server-side, without touching the Logo URL field', async () => {
    themeApi.getTheme.mockResolvedValue(baseTheme)
    // The <input accept="image/*"> only hints the OS file picker - real
    // validation happens server-side (mediaService.js), so this simulates a
    // same-mimetype file that the server still rejects (e.g. too large).
    themeApi.uploadLogo.mockRejectedValue(new Error('Image must be smaller than 5MB'))
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.getByLabelText('Business name')).toHaveValue('Verify Test Salon'))

    const file = new File(['fake-bytes'], 'huge.png', { type: 'image/png' })
    const fileInput = document.getElementById('theme-logo-file')
    await user.upload(fileInput, file)

    expect(await screen.findByText('Failed to upload logo.')).toBeInTheDocument()
    expect(screen.getByLabelText('Logo URL')).toHaveValue('')
  })
})
