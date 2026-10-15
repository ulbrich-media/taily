import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PersonListPage } from './PersonListPage'
import { personListSearchDefaults } from '../person-list.search'
import type { PersonListResource } from '@/api/types/people'

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

function makePerson(id: string, first: string, last: string) {
  return {
    id,
    first_name: first,
    last_name: last,
    full_name: `${first} ${last}`,
    email: `${first.toLowerCase()}@example.com`,
    organization: { name: 'Tierhilfe' },
    organization_role: 'Vorstand',
    postal_code: '10115',
    city: 'Berlin',
    country_code: 'DE',
    roles: ['Vermittler'],
    profile_picture_url: null,
  } as unknown as PersonListResource
}

function renderPage(
  overrides: Partial<Parameters<typeof PersonListPage>[0]> = {}
) {
  const onSearchChange = vi.fn()
  render(
    <PersonListPage
      people={{
        data: [
          makePerson('1', 'Anna', 'Adler'),
          makePerson('2', 'Max', 'Meier'),
        ],
        meta: { current_page: 2, last_page: 4, per_page: 25, total: 80 },
      }}
      search={{ ...personListSearchDefaults, page: 2 }}
      organizations={[]}
      animalTypes={[]}
      onSearchChange={onSearchChange}
      createAction={null}
      renderRowActions={() => <button>Bearbeiten</button>}
      {...overrides}
    />
  )
  return { onSearchChange }
}

afterEach(() => vi.restoreAllMocks())

describe('PersonListPage', () => {
  it('renders every person as table row and as card with the same data', () => {
    renderPage()
    expect(screen.getAllByText('Anna Adler')).toHaveLength(2)
    expect(screen.getAllByText('Max Meier')).toHaveLength(2)
    expect(screen.getAllByText('Vorstand')).toHaveLength(4)
    expect(screen.getAllByText('10115 Berlin (DE)')).toHaveLength(4)
    expect(screen.getAllByText('Vermittler')).toHaveLength(4)
  })

  it('sorts through the table headers', async () => {
    const { onSearchChange } = renderPage()
    const sortBy = async (column: string) =>
      userEvent.click(
        within(screen.getByRole('columnheader', { name: column })).getByRole(
          'button'
        )
      )
    await sortBy('Organisation')
    expect(onSearchChange).toHaveBeenCalledWith({ sort: 'organization' })
    await sortBy('Rollen')
    expect(onSearchChange).toHaveBeenCalledWith({ sort: 'roles' })
    await sortBy('Herkunft')
    expect(onSearchChange).toHaveBeenCalledWith({ sort: 'city' })
  })

  it('changes the page through the pagination', async () => {
    const { onSearchChange } = renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Seite 3' }))
    expect(onSearchChange).toHaveBeenCalledWith({ page: 3 })
  })

  it('offers a reset when filters leave nothing', async () => {
    const { onSearchChange } = renderPage({
      people: {
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 },
      },
      search: { ...personListSearchDefaults, role: ['none'] },
    })
    expect(screen.getByText('Keine Personen gefunden')).toBeInTheDocument()
    await userEvent.click(
      screen.getAllByRole('button', { name: 'Filter zurücksetzen' }).at(-1)!
    )
    expect(onSearchChange).toHaveBeenCalledWith(
      expect.objectContaining({ role: [], search: '' })
    )
  })
})
