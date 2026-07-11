import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PasswordConfirmationDialog } from './PasswordConfirmationDialog'
import { confirmPassword } from '@/lib/password-confirmation.api'
import { ApiValidationError } from '@/lib/api'

vi.mock('@/lib/password-confirmation.api', () => ({
  confirmPassword: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const confirmPasswordMock = vi.mocked(confirmPassword)

function renderDialog(
  overrides: Partial<
    React.ComponentProps<typeof PasswordConfirmationDialog>
  > = {}
) {
  const props = {
    open: true,
    onConfirmed: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  }
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <PasswordConfirmationDialog {...props} />
    </QueryClientProvider>
  )
  return props
}

describe('PasswordConfirmationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('confirms with the entered password', async () => {
    confirmPasswordMock.mockResolvedValue()
    const user = userEvent.setup()
    const { onConfirmed } = renderDialog()

    await user.type(screen.getByLabelText('Passwort'), 'CorrectPassword1')
    await user.click(screen.getByRole('button', { name: 'Bestätigen' }))

    await waitFor(() =>
      expect(confirmPasswordMock).toHaveBeenCalledWith('CorrectPassword1')
    )
    await waitFor(() => expect(onConfirmed).toHaveBeenCalled())
  })

  it('shows an error for a wrong password without confirming', async () => {
    confirmPasswordMock.mockRejectedValue(
      new ApiValidationError('invalid', { password: ['wrong'] })
    )
    const user = userEvent.setup()
    const { onConfirmed } = renderDialog()

    await user.type(screen.getByLabelText('Passwort'), 'WrongPassword1')
    await user.click(screen.getByRole('button', { name: 'Bestätigen' }))

    expect(
      await screen.findByText('Das Passwort ist falsch.')
    ).toBeInTheDocument()
    expect(onConfirmed).not.toHaveBeenCalled()
  })

  it('cancels without confirming', async () => {
    const user = userEvent.setup()
    const { onCancel } = renderDialog()

    await user.click(screen.getByRole('button', { name: 'Abbrechen' }))

    expect(onCancel).toHaveBeenCalled()
    expect(confirmPasswordMock).not.toHaveBeenCalled()
  })
})
