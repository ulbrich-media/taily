import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { UserListPage } from './UserListPage'
import type { UserResource } from '@/api/types/users'

function makeUser(overrides: Partial<UserResource> = {}): UserResource {
  return {
    id: crypto.randomUUID(),
    name: 'Erika Mustermann',
    email: 'erika@example.com',
    role: 'user',
    two_factor_enabled: false,
    last_login_at: null,
    created_at: '2026-01-15T10:00:00.000Z',
    updated_at: '2026-01-15T10:00:00.000Z',
    invitation: null,
    ...overrides,
  }
}

function rowFor(name: string) {
  return screen.getByText(name).closest('tr') as HTMLElement
}

describe('UserListPage', () => {
  it('shows an active 2FA badge for users with two-factor enabled', () => {
    render(
      <UserListPage
        users={[makeUser({ name: 'Anna', two_factor_enabled: true })]}
        isAdmin
      />
    )

    expect(within(rowFor('Anna')).getByText('Aktiv')).toBeInTheDocument()
  })

  it('shows an inactive 2FA badge for users without two-factor', () => {
    render(
      <UserListPage
        users={[makeUser({ name: 'Ben', two_factor_enabled: false })]}
        isAdmin
      />
    )

    expect(within(rowFor('Ben')).getByText('Inaktiv')).toBeInTheDocument()
  })

  it('renders the account creation date', () => {
    render(
      <UserListPage
        users={[
          makeUser({ name: 'Clara', created_at: '2026-01-15T10:00:00.000Z' }),
        ]}
      />
    )

    expect(within(rowFor('Clara')).getByText('15.01.2026')).toBeInTheDocument()
  })

  it('hides the 2FA and last-login columns for non-admins', () => {
    // The API omits these fields for regular users; the table must not show
    // empty security columns to them.
    render(<UserListPage users={[makeUser({ name: 'Dana' })]} />)

    expect(screen.queryByText('2FA')).not.toBeInTheDocument()
    expect(screen.queryByText('Letzter Login')).not.toBeInTheDocument()
    expect(screen.getByText('Registriert')).toBeInTheDocument()
  })

  it('shows the 2FA and last-login columns for admins', () => {
    render(<UserListPage users={[makeUser({ name: 'Emil' })]} isAdmin />)

    expect(screen.getByText('2FA')).toBeInTheDocument()
    expect(screen.getByText('Letzter Login')).toBeInTheDocument()
  })
})
