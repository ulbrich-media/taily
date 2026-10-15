import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnimalListPage } from './AnimalListPage'
import { animalListSearchDefaults } from '../animal-list.search'
import type { AnimalListResource } from '@/api/types/animals'

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

function makeAnimal(id: string, name: string): AnimalListResource {
  return {
    id,
    name,
    animal_number: `T-${id}`,
    breed: 'Mischling',
    color: 'braun',
    date_of_birth: null,
    do_publish: true,
    is_reserved: false,
    profile_picture_url: null,
    animal_type_id: 'type-1',
    animal_type: { title: 'Hund' },
  } as unknown as AnimalListResource
}

const page = (data: AnimalListResource[], total = data.length) => ({
  data,
  meta: { current_page: 1, last_page: 1, per_page: 25, total },
})

function renderPage(
  overrides: Partial<Parameters<typeof AnimalListPage>[0]> = {}
) {
  const onSearchChange = vi.fn()
  render(
    <AnimalListPage
      animals={{
        data: [makeAnimal('1', 'Bello'), makeAnimal('2', 'Luna')],
        meta: { current_page: 2, last_page: 4, per_page: 25, total: 80 },
      }}
      search={{ ...animalListSearchDefaults, page: 2 }}
      mediators={[]}
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

describe('AnimalListPage', () => {
  it('renders every animal as table row and as card', () => {
    renderPage()
    expect(screen.getAllByText('Bello')).toHaveLength(2)
    expect(screen.getAllByText('Luna')).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Bearbeiten' })).toHaveLength(
      4
    )
  })

  it('sorts through the table headers', async () => {
    const { onSearchChange } = renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Name' }))
    expect(onSearchChange).toHaveBeenCalledWith({ sort: 'name' })
    await userEvent.click(screen.getByRole('button', { name: 'Rasse' }))
    expect(onSearchChange).toHaveBeenCalledWith({ sort: 'breed' })
  })

  it('switches the view without leaving the page', async () => {
    const { onSearchChange } = renderPage()
    await userEvent.click(screen.getByRole('radio', { name: 'Karten' }))
    expect(onSearchChange).toHaveBeenCalledWith({ view: 'cards', page: 2 })
  })

  it('changes the page through the pagination', async () => {
    const { onSearchChange } = renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Seite 3' }))
    expect(onSearchChange).toHaveBeenCalledWith({ page: 3 })
  })

  it('disables the reset button without active filters', () => {
    renderPage()
    expect(
      screen.getByRole('button', { name: 'Filter zurücksetzen' })
    ).toBeDisabled()
  })

  it('resets search and filters but keeps sort and view', async () => {
    const { onSearchChange } = renderPage({
      search: {
        ...animalListSearchDefaults,
        status: ['adopted'],
        boarding: '1',
        search: 'luna',
        sort: 'name',
        view: 'cards',
      },
    })
    await userEvent.click(
      screen.getByRole('button', { name: 'Filter zurücksetzen' })
    )
    const patch = onSearchChange.mock.calls[0][0]
    expect(patch).toMatchObject({
      status: [],
      search: '',
      boarding: undefined,
      assigned_agent_id: undefined,
    })
    expect(patch).not.toHaveProperty('sort')
    expect(patch).not.toHaveProperty('view')
  })

  it('shows the progress bar only while the list is updating', async () => {
    const { unmount } = render(
      <AnimalListPage
        animals={page([makeAnimal('1', 'Bello')])}
        search={animalListSearchDefaults}
        mediators={[]}
        animalTypes={[]}
        isUpdating
        onSearchChange={vi.fn()}
        createAction={null}
        renderRowActions={() => null}
      />
    )
    expect(await screen.findAllByRole('progressbar')).not.toHaveLength(0)
    unmount()

    renderPage()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('invites to add an animal when the unfiltered list is empty', () => {
    renderPage({ animals: page([]) })
    expect(screen.getByText('Keine Tiere gefunden')).toBeInTheDocument()
    expect(screen.getByText('Füge jetzt ein Tier hinzu!')).toBeInTheDocument()
    // Only the (disabled) toolbar button.
    expect(
      screen.getAllByRole('button', { name: 'Filter zurücksetzen' })
    ).toHaveLength(1)
  })

  it('explains an empty filtered result and offers a reset', async () => {
    const { onSearchChange } = renderPage({
      animals: page([]),
      search: { ...animalListSearchDefaults, search: 'xyz', neutered: '1' },
    })
    expect(
      screen.getByText('Mit den gewählten Filtern gibt es keine Treffer.')
    ).toBeInTheDocument()
    const buttons = screen.getAllByRole('button', {
      name: 'Filter zurücksetzen',
    })
    expect(buttons).toHaveLength(2)
    await userEvent.click(buttons[1])
    expect(onSearchChange).toHaveBeenCalledWith(
      expect.objectContaining({ neutered: undefined, search: '' })
    )
  })
})
