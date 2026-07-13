import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'
import { SessionsSection } from './SessionsSection'
import * as requests from '@/admin/module/security/api/requests'
import { ApiValidationError } from '@/lib/api'
import type { Session } from '@/admin/module/security/api/types'

vi.mock('@/admin/module/security/api/requests')
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const currentDevice: Session = {
  id: 'current-id',
  ip_address: '127.0.0.1',
  browser: 'Chrome',
  platform: 'macOS',
  is_current_device: true,
  last_active_at: '2026-01-01T00:00:00Z',
}

const otherDevice: Session = {
  id: 'other-id',
  ip_address: '203.0.113.5',
  browser: 'Firefox',
  platform: 'Windows',
  is_current_device: false,
  last_active_at: '2026-01-01T00:00:00Z',
}

function renderSection(sessions: Session[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <SessionsSection sessions={sessions} />
    </QueryClientProvider>
  )
}

describe('SessionsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('signs out a specific session after confirming the password', async () => {
    vi.mocked(requests.deleteSession).mockResolvedValue()

    const user = userEvent.setup()
    renderSection([currentDevice, otherDevice])

    await user.click(screen.getByRole('button', { name: 'Sitzung abmelden' }))

    const dialog = await screen.findByRole('alertdialog')
    await user.type(screen.getByLabelText('Passwort'), 'CorrectPassword1')
    await user.click(screen.getByRole('button', { name: 'Ja, abmelden' }))

    await waitFor(() =>
      expect(requests.deleteSession).toHaveBeenCalledWith(
        'other-id',
        'CorrectPassword1'
      )
    )
    await waitFor(() => expect(toast.success).toHaveBeenCalled())
    expect(dialog).not.toBeVisible()
  })

  it('signs out all other sessions after confirming the password', async () => {
    vi.mocked(requests.deleteOtherSessions).mockResolvedValue()

    const user = userEvent.setup()
    renderSection([currentDevice, otherDevice])

    await user.click(
      screen.getByRole('button', { name: 'Alle anderen Sitzungen abmelden' })
    )
    await user.type(screen.getByLabelText('Passwort'), 'CorrectPassword1')
    await user.click(screen.getByRole('button', { name: 'Ja, abmelden' }))

    await waitFor(() =>
      expect(requests.deleteOtherSessions).toHaveBeenCalledWith(
        'CorrectPassword1'
      )
    )
    await waitFor(() => expect(toast.success).toHaveBeenCalled())
  })

  it('does not sign out anything when the dialog is cancelled', async () => {
    const user = userEvent.setup()
    renderSection([currentDevice, otherDevice])

    await user.click(screen.getByRole('button', { name: 'Sitzung abmelden' }))
    await screen.findByRole('alertdialog')
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }))

    expect(requests.deleteSession).not.toHaveBeenCalled()
  })

  it('shows a field error when the password is wrong', async () => {
    vi.mocked(requests.deleteSession).mockRejectedValue(
      new ApiValidationError('Validation failed', {
        password: ['The password is incorrect.'],
      })
    )

    const user = userEvent.setup()
    renderSection([currentDevice, otherDevice])

    await user.click(screen.getByRole('button', { name: 'Sitzung abmelden' }))
    await user.type(screen.getByLabelText('Passwort'), 'WrongPassword1')
    await user.click(screen.getByRole('button', { name: 'Ja, abmelden' }))

    expect(
      await screen.findByText('Das Passwort ist falsch.')
    ).toBeInTheDocument()
  })

  it('does not show a sign-out button for the current device', () => {
    renderSection([currentDevice])

    expect(
      screen.queryByRole('button', { name: 'Sitzung abmelden' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Alle anderen Sitzungen abmelden' })
    ).not.toBeInTheDocument()
  })
})
