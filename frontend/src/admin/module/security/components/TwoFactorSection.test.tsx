import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TwoFactorSection } from './TwoFactorSection'
import { useAuth } from '@/lib/auth.hook'
import * as requests from '@/admin/module/security/api/requests'

vi.mock('@/lib/auth.hook', () => ({ useAuth: vi.fn() }))
vi.mock('@/admin/module/security/api/requests')
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const useAuthMock = vi.mocked(useAuth)
const refreshProfile = vi.fn()

function renderSection(twoFactorEnabled: boolean) {
  useAuthMock.mockReturnValue({
    user: { two_factor_enabled: twoFactorEnabled },
    refreshProfile,
  } as unknown as ReturnType<typeof useAuth>)

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <TwoFactorSection />
    </QueryClientProvider>
  )
}

describe('TwoFactorSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('walks through the enrolment flow in a dialog', async () => {
    // Password already confirmed within the window, so no re-auth prompt.
    vi.mocked(requests.getConfirmedPasswordStatus).mockResolvedValue({
      confirmed: true,
    })
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
    renderSection(false)

    // Disabled state: enrolment can be started.
    expect(
      screen.getByRole('button', { name: 'Aktivieren' })
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Aktivieren' }))

    // Enrolment materials appear in the setup dialog.
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
    vi.mocked(requests.getConfirmedPasswordStatus).mockResolvedValue({
      confirmed: true,
    })
    renderSection(true)

    // Enabled state: no enrolment action, only management actions.
    expect(
      screen.queryByRole('button', { name: 'Aktivieren' })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Deaktivieren' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Neue Codes generieren' })
    ).toBeInTheDocument()
  })

  it('prompts for the password before a gated action when not confirmed', async () => {
    // Not confirmed yet: the password prompt must appear before codes load.
    vi.mocked(requests.getConfirmedPasswordStatus).mockResolvedValue({
      confirmed: false,
    })
    vi.mocked(requests.confirmPassword).mockResolvedValue()
    vi.mocked(requests.getRecoveryCodes).mockResolvedValue([
      'recovery-code-aaa',
    ])

    const user = userEvent.setup()
    renderSection(true)

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
      expect(requests.confirmPassword).toHaveBeenCalledWith('CorrectPassword1')
    )
    await waitFor(() => expect(requests.getRecoveryCodes).toHaveBeenCalled())
  })
})
