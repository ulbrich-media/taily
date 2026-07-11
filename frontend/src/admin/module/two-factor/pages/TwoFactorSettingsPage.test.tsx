import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TwoFactorSettingsPage } from './TwoFactorSettingsPage'
import { useAuth } from '@/lib/auth.hook'
import * as requests from '@/admin/module/two-factor/api/requests'
import * as passwordConfirmation from '@/lib/password-confirmation.api'

vi.mock('@/lib/auth.hook', () => ({ useAuth: vi.fn() }))
vi.mock('@/admin/module/two-factor/api/requests')
vi.mock('@/lib/password-confirmation.api')
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const useAuthMock = vi.mocked(useAuth)
const refreshProfile = vi.fn()

function renderPage(twoFactorEnabled: boolean) {
  useAuthMock.mockReturnValue({
    user: { two_factor_enabled: twoFactorEnabled },
    refreshProfile,
  } as unknown as ReturnType<typeof useAuth>)

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <TwoFactorSettingsPage />
    </QueryClientProvider>
  )
}

describe('TwoFactorSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('walks through the enrolment flow', async () => {
    // Password already confirmed within the window, so no re-auth prompt.
    vi.mocked(
      passwordConfirmation.getConfirmedPasswordStatus
    ).mockResolvedValue({ confirmed: true })
    vi.mocked(requests.enableTwoFactor).mockResolvedValue()
    vi.mocked(requests.getTwoFactorQrCode).mockResolvedValue({
      svg: '<svg data-testid="qr"></svg>',
      url: 'otpauth://totp/x',
    })
    vi.mocked(requests.getTwoFactorSecret).mockResolvedValue({
      secretKey: 'SECRET123',
    })
    vi.mocked(requests.getRecoveryCodes).mockResolvedValue([
      'recovery-code-aaa',
      'recovery-code-bbb',
    ])
    vi.mocked(requests.confirmTwoFactor).mockResolvedValue()

    const user = userEvent.setup()
    renderPage(false)

    // Disabled state.
    expect(screen.getByText('Nicht aktiviert')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Aktivieren' }))

    // Enrolment materials appear.
    expect(await screen.findByText('SECRET123')).toBeInTheDocument()
    expect(screen.getByText('recovery-code-aaa')).toBeInTheDocument()
    expect(requests.enableTwoFactor).toHaveBeenCalled()

    // Confirm the setup with a code.
    await user.type(screen.getByLabelText('Bestätigungscode'), '654321')
    await user.click(
      screen.getByRole('button', { name: 'Bestätigen und aktivieren' })
    )

    // react-query's mutate passes a context object as a second argument, so
    // assert on the first argument only.
    await waitFor(() =>
      expect(vi.mocked(requests.confirmTwoFactor).mock.calls[0]?.[0]).toEqual({
        code: '654321',
      })
    )
    // refreshProfile runs in the mutation's async onSuccess, so wait for it.
    await waitFor(() => expect(refreshProfile).toHaveBeenCalled())
  })

  it('shows management actions when already enabled', () => {
    vi.mocked(
      passwordConfirmation.getConfirmedPasswordStatus
    ).mockResolvedValue({ confirmed: true })
    renderPage(true)

    expect(screen.getByText('Aktiviert')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Deaktivieren' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Neue Codes generieren' })
    ).toBeInTheDocument()
  })

  it('prompts for the password before a gated action when not confirmed', async () => {
    // Not confirmed yet: the password prompt must appear before codes load.
    vi.mocked(
      passwordConfirmation.getConfirmedPasswordStatus
    ).mockResolvedValue({ confirmed: false })
    vi.mocked(passwordConfirmation.confirmPassword).mockResolvedValue()
    vi.mocked(requests.getRecoveryCodes).mockResolvedValue([
      'recovery-code-aaa',
    ])

    const user = userEvent.setup()
    renderPage(true)

    await user.click(
      screen.getByRole('button', { name: 'Wiederherstellungscodes anzeigen' })
    )

    // Recovery codes are not fetched until the password is confirmed.
    expect(requests.getRecoveryCodes).not.toHaveBeenCalled()

    const dialog = await screen.findByRole('dialog')
    await user.type(
      within(dialog).getByLabelText('Passwort'),
      'CorrectPassword1'
    )
    await user.click(within(dialog).getByRole('button', { name: 'Bestätigen' }))

    await waitFor(() =>
      expect(passwordConfirmation.confirmPassword).toHaveBeenCalledWith(
        'CorrectPassword1'
      )
    )
    await waitFor(() => expect(requests.getRecoveryCodes).toHaveBeenCalled())
  })
})
