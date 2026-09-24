import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitForElementToBeRemoved } from '@testing-library/react'
import { InstallAppPrompt } from '../InstallAppPrompt.jsx'

const DISMISS_KEY = 'packstack-install-prompt-dismissed-at'

function stubUserAgent(ua) {
  Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true })
}

function stubMatchMedia(matches) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches }))
}

const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36'
const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/605.1.15'

describe('InstallAppPrompt', () => {
  const originalUA = window.navigator.userAgent

  beforeEach(() => {
    localStorage.removeItem(DISMISS_KEY)
    stubMatchMedia(false)
    stubUserAgent(ANDROID_UA)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    stubUserAgent(originalUA)
    localStorage.removeItem(DISMISS_KEY)
  })

  it('renders nothing on Android before beforeinstallprompt has fired', () => {
    render(<InstallAppPrompt businessName="Nailsbynaledi" />)
    expect(screen.queryByText(/Install/)).not.toBeInTheDocument()
  })

  it('shows the banner with an Install button once beforeinstallprompt fires, and calls prompt() on click', async () => {
    render(<InstallAppPrompt businessName="Nailsbynaledi" />)

    const promptSpy = vi.fn()
    const event = new Event('beforeinstallprompt', { cancelable: true })
    event.prompt = promptSpy
    event.userChoice = Promise.resolve({ outcome: 'accepted' })
    window.dispatchEvent(event)

    expect(await screen.findByText(/Install the Nailsbynaledi app/)).toBeInTheDocument()
    const installBtn = screen.getByRole('button', { name: 'Install' })

    fireEvent.click(installBtn)
    expect(promptSpy).toHaveBeenCalled()

    // The click handler awaits userChoice before hiding - banner disappears
    // and the dismissal is remembered either way, since 'appinstalled' above
    // is the real success signal, not the resolved outcome here.
    await waitForElementToBeRemoved(() => screen.queryByText(/Install the Nailsbynaledi app/))
    expect(localStorage.getItem(DISMISS_KEY)).not.toBeNull()
  })

  it('shows iOS-specific instructions with no Install button when on iOS', () => {
    stubUserAgent(IOS_UA)
    render(<InstallAppPrompt businessName="Nailsbynaledi" />)

    expect(screen.getByText(/Install the Nailsbynaledi app/)).toBeInTheDocument()
    expect(screen.getByText(/Add to Home Screen/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument()
  })

  it('dismissing hides the banner and remembers the dismissal', () => {
    stubUserAgent(IOS_UA)
    render(<InstallAppPrompt businessName="Nailsbynaledi" />)

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(screen.queryByText(/Install/)).not.toBeInTheDocument()
    expect(localStorage.getItem(DISMISS_KEY)).not.toBeNull()
  })

  it('stays hidden on a later render within the dismissal cooldown window', () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    stubUserAgent(IOS_UA)
    render(<InstallAppPrompt businessName="Nailsbynaledi" />)
    expect(screen.queryByText(/Install/)).not.toBeInTheDocument()
  })

  it('reappears once the dismissal cooldown has expired', () => {
    const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000
    localStorage.setItem(DISMISS_KEY, String(fifteenDaysAgo))
    stubUserAgent(IOS_UA)
    render(<InstallAppPrompt businessName="Nailsbynaledi" />)
    expect(screen.getByText(/Install the Nailsbynaledi app/)).toBeInTheDocument()
  })

  it('never shows when already running standalone (already installed)', () => {
    stubMatchMedia(true) // (display-mode: standalone) matches
    stubUserAgent(IOS_UA)
    render(<InstallAppPrompt businessName="Nailsbynaledi" />)
    expect(screen.queryByText(/Install/)).not.toBeInTheDocument()
  })

  it('falls back to generic wording with no business name', () => {
    stubUserAgent(IOS_UA)
    render(<InstallAppPrompt />)
    expect(screen.getByText('Install this app')).toBeInTheDocument()
  })
})
