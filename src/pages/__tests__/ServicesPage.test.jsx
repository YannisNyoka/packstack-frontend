import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ServicesPage } from '../ServicesPage.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import * as servicesApi from '../../api/services.js'

vi.mock('../../auth/AuthContext.jsx')
vi.mock('../../api/services.js')

const baseService = {
  _id: 'svc1',
  name: 'Haircut',
  durationMinutes: 30,
  price: 150,
  category: '',
  imageUrl: '',
  active: true,
}

describe('ServicesPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    useAuth.mockReturnValue({ user: { role: 'owner', email: 'owner@example.com' } })
  })

  it('shows a thumbnail for a service that has an image', async () => {
    servicesApi.listServices.mockResolvedValue([{ ...baseService, imageUrl: 'https://res.cloudinary.com/demo/svc1.png' }])
    render(<ServicesPage />)

    await waitFor(() => expect(screen.getByText('Haircut')).toBeInTheDocument())
    // alt="" is deliberate (a decorative thumbnail next to the name) - that
    // makes it a "presentation" role, not "img", in the accessibility tree,
    // so query the DOM directly rather than by role.
    expect(document.querySelector('img')).toHaveAttribute('src', 'https://res.cloudinary.com/demo/svc1.png')
  })

  it('hides the photo upload control while creating a brand-new service', async () => {
    servicesApi.listServices.mockResolvedValue([])
    const user = userEvent.setup()
    render(<ServicesPage />)

    await waitFor(() => expect(screen.getByText('No services yet.')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Add service' }))

    expect(screen.getByText('Save the service first, then edit it to add a photo.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Photo (optional)')).not.toBeInTheDocument()
  })

  it('uploads a photo while editing an existing service and shows the preview', async () => {
    servicesApi.listServices.mockResolvedValue([baseService])
    servicesApi.uploadServiceImage.mockResolvedValue({ ...baseService, imageUrl: 'https://res.cloudinary.com/demo/svc1.png' })
    const user = userEvent.setup()
    render(<ServicesPage />)

    await waitFor(() => expect(screen.getByText('Haircut')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Edit' }))

    const file = new File(['fake-bytes'], 'photo.png', { type: 'image/png' })
    const fileInput = document.getElementById('svc-image')
    await user.upload(fileInput, file)

    await waitFor(() => expect(servicesApi.uploadServiceImage).toHaveBeenCalledWith('svc1', file))
    await waitFor(() => expect(screen.getByAltText('Service preview')).toHaveAttribute('src', 'https://res.cloudinary.com/demo/svc1.png'))
  })

  it('includes imageUrl when saving edited service fields', async () => {
    servicesApi.listServices.mockResolvedValue([{ ...baseService, imageUrl: 'https://res.cloudinary.com/demo/svc1.png' }])
    servicesApi.updateService.mockResolvedValue({})
    const user = userEvent.setup()
    render(<ServicesPage />)

    await waitFor(() => expect(screen.getByText('Haircut')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() =>
      expect(servicesApi.updateService).toHaveBeenCalledWith(
        'svc1',
        expect.objectContaining({ imageUrl: 'https://res.cloudinary.com/demo/svc1.png' })
      )
    )
  })
})
