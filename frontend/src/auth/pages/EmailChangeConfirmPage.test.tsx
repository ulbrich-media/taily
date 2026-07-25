import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EmailChangeConfirmPage } from './EmailChangeConfirmPage'
import {
  confirmEmailChange,
  getEmailChangeDetails,
} from '@/lib/email-change.api'
import { ApiValidationError } from '@/lib/api'

vi.mock('@/lib/email-change.api', () => ({
  getEmailChangeDetails: vi.fn(),
  confirmEmailChange: vi.fn(),
}))

const getEmailChangeDetailsMock = vi.mocked(getEmailChangeDetails)
const confirmEmailChangeMock = vi.mocked(confirmEmailChange)

function renderPage(token?: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const onGoToLogin = vi.fn()

  render(
    <QueryClientProvider client={queryClient}>
      <EmailChangeConfirmPage token={token} onGoToLogin={onGoToLogin} />
    </QueryClientProvider>
  )

  return { onGoToLogin }
}

describe('EmailChangeConfirmPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows an invalid-link state when no token is present', () => {
    renderPage(undefined)

    expect(screen.getByText('Ungültiger Link')).toBeInTheDocument()
    expect(getEmailChangeDetailsMock).not.toHaveBeenCalled()
  })

  it('previews the old and new address without submitting automatically', async () => {
    getEmailChangeDetailsMock.mockResolvedValue({
      old_email: 'old@example.com',
      new_email: 'new@example.com',
      expires_at: '2026-01-01T00:00:00Z',
    })

    renderPage('valid-token')

    expect(await screen.findByText('old@example.com')).toBeInTheDocument()
    expect(screen.getByText('new@example.com')).toBeInTheDocument()
    expect(confirmEmailChangeMock).not.toHaveBeenCalled()
  })

  it('confirms the change only once the user clicks the button', async () => {
    getEmailChangeDetailsMock.mockResolvedValue({
      old_email: 'old@example.com',
      new_email: 'new@example.com',
      expires_at: '2026-01-01T00:00:00Z',
    })
    confirmEmailChangeMock.mockResolvedValue({ message: 'ok' })

    const user = userEvent.setup()
    renderPage('valid-token')

    const confirmButton = await screen.findByRole('button', {
      name: 'Bestätigen',
    })
    await user.click(confirmButton)

    expect(confirmEmailChangeMock).toHaveBeenCalledWith('valid-token')
    expect(
      await screen.findByText('E-Mail-Adresse geändert')
    ).toBeInTheDocument()
  })

  it('shows an invalid-link state when the token cannot be resolved', async () => {
    getEmailChangeDetailsMock.mockRejectedValue(
      new ApiValidationError('Bestätigungslink nicht gefunden oder abgelaufen.')
    )

    renderPage('valid-token')

    expect(await screen.findByText('Ungültiger Link')).toBeInTheDocument()
  })

  it('surfaces the backend error message when confirmation fails', async () => {
    getEmailChangeDetailsMock.mockResolvedValue({
      old_email: 'old@example.com',
      new_email: 'new@example.com',
      expires_at: '2026-01-01T00:00:00Z',
    })
    confirmEmailChangeMock.mockRejectedValue(
      new ApiValidationError('Diese E-Mail-Adresse wird bereits verwendet.')
    )

    const user = userEvent.setup()
    renderPage('valid-token')

    const confirmButton = await screen.findByRole('button', {
      name: 'Bestätigen',
    })
    await user.click(confirmButton)

    expect(
      await screen.findByText('Diese E-Mail-Adresse wird bereits verwendet.')
    ).toBeInTheDocument()
  })
})
