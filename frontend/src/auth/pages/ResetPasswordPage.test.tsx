import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { ResetPasswordPage } from './ResetPasswordPage'
import { resetPassword } from '@/lib/password-reset.api'
import { ApiValidationError } from '@/lib/api'

vi.mock('@/lib/password-reset.api', () => ({
  resetPassword: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const resetPasswordMock = vi.mocked(resetPassword)

function renderPage(
  overrides: Partial<React.ComponentProps<typeof ResetPasswordPage>> = {}
) {
  const props = {
    token: 'valid-token',
    email: 'jane@example.com',
    onSuccess: vi.fn(),
    onRequestNewLink: vi.fn(),
    ...overrides,
  }
  render(<ResetPasswordPage {...props} />)

  return props
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows an invalid-link state when token or email is missing', async () => {
    const user = userEvent.setup()
    const { onRequestNewLink } = renderPage({ token: undefined })

    expect(screen.getByText('Ungültiger Link')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Neuen Link anfordern' })
    )
    expect(onRequestNewLink).toHaveBeenCalled()
  })

  it('validates that the passwords match before submitting', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Neues Passwort'), 'NewPassword2')
    await user.type(
      screen.getByLabelText('Passwort bestätigen'),
      'SomethingElse3'
    )
    await user.click(screen.getByRole('button', { name: 'Passwort speichern' }))

    expect(
      await screen.findByText('Die Passwörter stimmen nicht überein')
    ).toBeInTheDocument()
    expect(resetPasswordMock).not.toHaveBeenCalled()
  })

  it('resets the password with the token and email from the link', async () => {
    resetPasswordMock.mockResolvedValue({ message: 'ok' })

    const user = userEvent.setup()
    const { onSuccess } = renderPage()

    await user.type(screen.getByLabelText('Neues Passwort'), 'NewPassword2')
    await user.type(
      screen.getByLabelText('Passwort bestätigen'),
      'NewPassword2'
    )
    await user.click(screen.getByRole('button', { name: 'Passwort speichern' }))

    expect(resetPasswordMock).toHaveBeenCalledWith({
      token: 'valid-token',
      email: 'jane@example.com',
      password: 'NewPassword2',
      password_confirmation: 'NewPassword2',
    })
    expect(onSuccess).toHaveBeenCalled()
  })

  it('shows a German error for an invalid or expired token', async () => {
    resetPasswordMock.mockRejectedValue(
      new ApiValidationError('passwords.token', {
        email: ['passwords.token'],
      })
    )

    const user = userEvent.setup()
    const { onSuccess } = renderPage()

    await user.type(screen.getByLabelText('Neues Passwort'), 'NewPassword2')
    await user.type(
      screen.getByLabelText('Passwort bestätigen'),
      'NewPassword2'
    )
    await user.click(screen.getByRole('button', { name: 'Passwort speichern' }))

    expect(toast.error).toHaveBeenCalledWith(
      'Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen Link an.'
    )
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
