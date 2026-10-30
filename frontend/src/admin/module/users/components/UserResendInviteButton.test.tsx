import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserResendInviteButton } from './UserResendInviteButton'
import { apiRequest } from '@/lib/api'
import type { UserResource } from '@/api/types/users'

vi.mock('@/lib/api', () => ({ apiRequest: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

afterEach(() => vi.clearAllMocks())

function makeUser(overrides: Partial<UserResource> = {}): UserResource {
  return {
    id: 'user-1',
    name: 'Erika Mustermann',
    email: 'erika@example.com',
    role: 'user',
    person_id: null,
    two_factor_enabled: false,
    last_login_at: null,
    created_at: '2026-01-15T10:00:00.000Z',
    updated_at: '2026-01-15T10:00:00.000Z',
    invitation: null,
    ...overrides,
  }
}

function renderButton(user: UserResource) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <UserResendInviteButton user={user} />
    </QueryClientProvider>
  )
}

describe('UserResendInviteButton', () => {
  it('is hidden for users who have already logged in', () => {
    renderButton(makeUser({ last_login_at: '2026-02-01T10:00:00.000Z' }))

    expect(
      screen.queryByRole('button', { name: 'Einladung erneut senden' })
    ).not.toBeInTheDocument()
  })

  it('asks for confirmation before sending and can be cancelled', async () => {
    renderButton(makeUser())

    await userEvent.click(
      screen.getByRole('button', { name: 'Einladung erneut senden' })
    )
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(apiRequest).not.toHaveBeenCalled()
  })

  it('sends the invitation after confirming', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ message: 'Einladung gesendet' })
    renderButton(makeUser())

    await userEvent.click(
      screen.getByRole('button', { name: 'Einladung erneut senden' })
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Einladung senden' })
    )

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        'users/user-1/resend-invitation',
        {
          method: 'POST',
        }
      )
    )
  })
})
