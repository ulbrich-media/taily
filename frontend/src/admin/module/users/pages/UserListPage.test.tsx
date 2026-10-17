import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserListPage } from './UserListPage'
import { userListSearchDefaults } from '../user-list.search'
import type { UserResource } from '@/api/types/users'

beforeAll(() => {
  // jsdom has no layout, scrollIntoView or ResizeObserver.
  Element.prototype.scrollIntoView = vi.fn()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
})

afterEach(() => vi.restoreAllMocks())

function makeUser(overrides: Partial<UserResource> = {}): UserResource {
  return {
    id: crypto.randomUUID(),
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

function renderPage(
  users: UserResource[],
  props: Partial<Parameters<typeof UserListPage>[0]> = {}
) {
  const onSearchChange = vi.fn()
  render(
    <UserListPage
      users={{
        data: users,
        meta: {
          current_page: 2,
          last_page: 4,
          per_page: 25,
          total: 80,
        },
      }}
      search={{ ...userListSearchDefaults, page: 2 }}
      onSearchChange={onSearchChange}
      {...props}
    />
  )
  return { onSearchChange }
}

// Every user is rendered twice: as table row and as card.
function rowFor(name: string) {
  return screen.getAllByText(name)[0].closest('tr') as HTMLElement
}

describe('UserListPage', () => {
  it('shows an active 2FA badge for users with two-factor enabled', () => {
    renderPage([makeUser({ name: 'Anna', two_factor_enabled: true })], {
      isAdmin: true,
    })

    expect(within(rowFor('Anna')).getByText('Aktiv')).toBeInTheDocument()
  })

  it('shows an inactive 2FA badge for users without two-factor', () => {
    renderPage([makeUser({ name: 'Ben', two_factor_enabled: false })], {
      isAdmin: true,
    })

    expect(within(rowFor('Ben')).getByText('Inaktiv')).toBeInTheDocument()
  })

  it('renders the account creation date', () => {
    renderPage([
      makeUser({ name: 'Clara', created_at: '2026-01-15T10:00:00.000Z' }),
    ])

    expect(within(rowFor('Clara')).getByText('15.01.2026')).toBeInTheDocument()
  })

  it('shows the same data as a card', () => {
    renderPage([makeUser({ name: 'Gina', two_factor_enabled: true })], {
      isAdmin: true,
    })

    const card = screen.getAllByText('Gina')[1].closest('li') as HTMLElement
    expect(within(card).getByText('Aktiv')).toBeInTheDocument()
    expect(within(card).getByText('15.01.2026')).toBeInTheDocument()
  })

  it('hides the 2FA and last-login columns for non-admins', () => {
    // The API omits these fields for regular users; the table must not show
    // empty security columns to them.
    renderPage([makeUser({ name: 'Dana' })])

    expect(screen.queryByText('2FA')).not.toBeInTheDocument()
    expect(screen.queryByText('Letzter Login')).not.toBeInTheDocument()
    expect(screen.getAllByText('Registriert').length).toBeGreaterThan(0)
  })

  it('shows the 2FA and last-login columns for admins', () => {
    renderPage([makeUser({ name: 'Emil' })], { isAdmin: true })

    expect(screen.getAllByText('2FA').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Letzter Login').length).toBeGreaterThan(0)
  })

  it('sorts through the table headers', async () => {
    const { onSearchChange } = renderPage([makeUser()], { isAdmin: true })

    await userEvent.click(
      within(screen.getByRole('columnheader', { name: 'E-Mail' })).getByRole(
        'button'
      )
    )
    expect(onSearchChange).toHaveBeenCalledWith({ sort: 'email' })

    await userEvent.click(
      within(
        screen.getByRole('columnheader', { name: 'Letzter Login' })
      ).getByRole('button')
    )
    expect(onSearchChange).toHaveBeenCalledWith({ sort: 'last_login_at' })
  })

  it('changes the page through the pagination', async () => {
    const { onSearchChange } = renderPage([makeUser()])

    await userEvent.click(screen.getByRole('button', { name: 'Seite 3' }))
    expect(onSearchChange).toHaveBeenCalledWith({ page: 3 })
  })

  it('offers a reset when filters leave nothing', async () => {
    const onSearchChange = vi.fn()
    render(
      <UserListPage
        users={{
          data: [],
          meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 },
        }}
        search={{ ...userListSearchDefaults, role: ['admin'] }}
        onSearchChange={onSearchChange}
      />
    )

    expect(screen.getByText('Keine Benutzer gefunden')).toBeInTheDocument()
    await userEvent.click(
      screen.getAllByRole('button', { name: 'Filter zurücksetzen' }).at(-1)!
    )
    expect(onSearchChange).toHaveBeenCalledWith(
      expect.objectContaining({ role: [], search: '' })
    )
  })
})
