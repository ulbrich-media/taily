import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { TwoFactorChallengePage } from './TwoFactorChallengePage'
import { useAuth } from '@/lib/auth.hook'

vi.mock('@/lib/auth.hook', () => ({
  useAuth: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const useAuthMock = vi.mocked(useAuth)
const completeTwoFactorChallenge = vi.fn()

function renderPage(
  overrides: Partial<React.ComponentProps<typeof TwoFactorChallengePage>> = {}
) {
  useAuthMock.mockReturnValue({
    completeTwoFactorChallenge,
  } as unknown as ReturnType<typeof useAuth>)

  const props = { onBackToLogin: vi.fn(), ...overrides }
  render(<TwoFactorChallengePage {...props} />)
  return props
}

describe('TwoFactorChallengePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits the authenticator code', async () => {
    completeTwoFactorChallenge.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Code'), '123456')
    await user.click(screen.getByRole('button', { name: 'Anmelden' }))

    expect(completeTwoFactorChallenge).toHaveBeenCalledWith({ code: '123456' })
  })

  it('switches to recovery-code mode and submits a recovery code', async () => {
    completeTwoFactorChallenge.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()

    await user.click(
      screen.getByRole('button', { name: 'Wiederherstellungscode verwenden' })
    )

    await user.type(
      screen.getByLabelText('Wiederherstellungscode'),
      'recovery-code-aaa'
    )
    await user.click(screen.getByRole('button', { name: 'Anmelden' }))

    expect(completeTwoFactorChallenge).toHaveBeenCalledWith({
      recovery_code: 'recovery-code-aaa',
    })
  })

  it('shows an error when the code is rejected', async () => {
    completeTwoFactorChallenge.mockRejectedValue(new Error('invalid'))
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Code'), '000000')
    await user.click(screen.getByRole('button', { name: 'Anmelden' }))

    expect(toast.error).toHaveBeenCalledWith(
      'Der Code ist ungültig. Bitte versuche es erneut.'
    )
  })

  it('returns to the login screen', async () => {
    const user = userEvent.setup()
    const { onBackToLogin } = renderPage()

    await user.click(
      screen.getByRole('button', { name: 'Zurück zur Anmeldung' })
    )

    expect(onBackToLogin).toHaveBeenCalled()
  })
})
