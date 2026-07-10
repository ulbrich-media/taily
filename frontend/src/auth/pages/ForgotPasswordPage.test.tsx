import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ForgotPasswordPage } from './ForgotPasswordPage'
import { requestPasswordResetLink } from '@/lib/password-reset.api'
import { ApiValidationError } from '@/lib/api'

vi.mock('@/lib/password-reset.api', () => ({
  requestPasswordResetLink: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const requestPasswordResetLinkMock = vi.mocked(requestPasswordResetLink)

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates the email before submitting', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordPage onBackToLogin={vi.fn()} />)

    await user.type(screen.getByLabelText('E-Mail'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Link senden' }))

    expect(
      await screen.findByText('Bitte gib eine gültige E-Mail Adresse ein')
    ).toBeInTheDocument()
    expect(requestPasswordResetLinkMock).not.toHaveBeenCalled()
  })

  it('requests a reset link and shows the confirmation', async () => {
    requestPasswordResetLinkMock.mockResolvedValue({ message: 'ok' })

    const user = userEvent.setup()
    render(<ForgotPasswordPage onBackToLogin={vi.fn()} />)

    await user.type(screen.getByLabelText('E-Mail'), 'jane@example.com')
    await user.click(screen.getByRole('button', { name: 'Link senden' }))

    expect(
      await screen.findByText(
        'Wir haben dir eine E-Mail mit einem Link zum Zurücksetzen deines Passworts gesendet.'
      )
    ).toBeInTheDocument()
    expect(requestPasswordResetLinkMock).toHaveBeenCalledWith(
      'jane@example.com'
    )
  })

  it('maps a backend error for an unknown email to a German message', async () => {
    requestPasswordResetLinkMock.mockRejectedValue(
      new ApiValidationError('passwords.user', {
        email: ['passwords.user'],
      })
    )

    const user = userEvent.setup()
    render(<ForgotPasswordPage onBackToLogin={vi.fn()} />)

    await user.type(screen.getByLabelText('E-Mail'), 'nobody@example.com')
    await user.click(screen.getByRole('button', { name: 'Link senden' }))

    expect(
      await screen.findByText(
        'Zu dieser E-Mail-Adresse wurde kein Benutzer gefunden.'
      )
    ).toBeInTheDocument()
  })

  it('navigates back to the login page', async () => {
    const onBackToLogin = vi.fn()
    const user = userEvent.setup()
    render(<ForgotPasswordPage onBackToLogin={onBackToLogin} />)

    await user.click(
      screen.getByRole('button', { name: 'Zurück zur Anmeldung' })
    )

    expect(onBackToLogin).toHaveBeenCalled()
  })
})
