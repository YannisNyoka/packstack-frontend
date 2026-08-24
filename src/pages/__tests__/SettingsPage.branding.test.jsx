import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { SettingsPage } from '../SettingsPage.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import * as themeApi from '../../api/theme.js'
import * as integrationsApi from '../../api/integrations.js'
import * as billingApi from '../../api/billing.js'
import * as domainsApi from '../../api/domains.js'
import * as tenantSettingsApi from '../../api/tenantSettings.js'

// SettingsPage's Branding section embeds a live preview (LandingPreview)
// that uses <Link>/useNavigate - needs a Router ancestor, same as it always
// gets for real inside App.jsx's BrowserRouter.
function renderSettingsPage() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>
  )
}

vi.mock('../../auth/AuthContext.jsx')
vi.mock('../../api/theme.js')
vi.mock('../../api/integrations.js')
vi.mock('../../api/billing.js')
vi.mock('../../api/domains.js')
vi.mock('../../api/tenantSettings.js')

const baseTheme = {
  businessName: 'Verify Test Salon',
  tagline: '',
  logoUrl: '',
  bannerUrl: '',
  colors: { primary: '#111827', secondary: '#6B7280', accent: '#D946EF' },
  contactInfo: { phone: '', email: '', address: '' },
  socialLinks: { instagram: '', facebook: '', whatsapp: '' },
}

function mockUnrelatedSectionsSoTheyDontError() {
  integrationsApi.listIntegrations.mockResolvedValue([])
  billingApi.getSubscription.mockResolvedValue(null)
  billingApi.listPlans.mockResolvedValue([])
  domainsApi.listDomains.mockResolvedValue([])
  tenantSettingsApi.getBookingRules.mockResolvedValue({ depositRequired: false, depositAmountZAR: 0 })
}

describe('SettingsPage - Branding section', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    useAuth.mockReturnValue({ user: { role: 'owner', email: 'owner@example.com' } })
    mockUnrelatedSectionsSoTheyDontError()
  })

  it('is hidden from non-owner staff', () => {
    useAuth.mockReturnValue({ user: { role: 'staff', email: 'staff@example.com' } })
    renderSettingsPage()
    expect(screen.getByText('Only the business owner can view settings.')).toBeInTheDocument()
    expect(screen.queryByText('Branding')).not.toBeInTheDocument()
  })

  it('loads and displays the current branding', async () => {
    themeApi.getTheme.mockResolvedValue(baseTheme)
    renderSettingsPage()

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
    renderSettingsPage()
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
    renderSettingsPage()
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
    renderSettingsPage()
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
    renderSettingsPage()
    await waitFor(() => expect(screen.getByLabelText('Business name')).toHaveValue('Verify Test Salon'))

    const file = new File(['fake-bytes'], 'huge.png', { type: 'image/png' })
    const fileInput = document.getElementById('theme-logo-file')
    await user.upload(fileInput, file)

    expect(await screen.findByText('Failed to upload logo.')).toBeInTheDocument()
    expect(screen.getByLabelText('Logo URL')).toHaveValue('')
  })
})
