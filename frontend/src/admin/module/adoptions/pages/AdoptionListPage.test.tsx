import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdoptionListPage } from './AdoptionListPage'
import { adoptionListSearchDefaults } from '../adoption-list.search'
import type { AdoptionListResource } from '@/api/types/adoptions'

// Radix controls measure themselves; jsdom has no ResizeObserver.
beforeAll(() => {
  // jsdom has no layout and no scrollIntoView.
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

function makeAdoption(id: string, animalName: string): AdoptionListResource {
  return {
    id,
    status: 'in_progress',
    created_at: '2026-01-02T10:00:00Z',
    pre_inspection_status: 'finished',
    contract_status: 'pending',
    transport_status: 'not_started',
    handover_status: 'not_started',
    animal: { name: animalName, old_name: '', animal_type: { title: 'Hund' } },
    applicant: { full_name: 'Anna Adoptantin' },
    mediator: null,
  } as unknown as AdoptionListResource
}

function renderPage(
  overrides: Partial<Parameters<typeof AdoptionListPage>[0]> = {}
) {
  const onSearchChange = vi.fn()
  render(
    <AdoptionListPage
      adoptions={{
        data: [makeAdoption('1', 'Bello'), makeAdoption('2', 'Luna')],
        meta: { current_page: 2, last_page: 4, per_page: 25, total: 80 },
      }}
      search={{ ...adoptionListSearchDefaults, page: 2 }}
      mediators={[]}
      animalTypes={[]}
      onSearchChange={onSearchChange}
      createAction={null}
      {...overrides}
    />
  )
  return { onSearchChange }
}

afterEach(() => vi.restoreAllMocks())

describe('AdoptionListPage', () => {
  it('renders every adoption as table row and as card', () => {
    renderPage()
    // Both renderers are in the DOM; CSS decides which one is visible.
    expect(screen.getAllByText('Bello')).toHaveLength(2)
    expect(screen.getAllByText('Luna')).toHaveLength(2)
  })

  it('sorts through the table headers', async () => {
    const { onSearchChange } = renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Tier' }))
    expect(onSearchChange).toHaveBeenCalledWith({ sort: 'animal_name' })
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
        ...adoptionListSearchDefaults,
        status: ['done'],
        search: 'luna',
        sort: 'animal_name',
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
      mediator_id: undefined,
    })
    // A patch only changes what it names: sort and view stay as they are.
    expect(patch).not.toHaveProperty('sort')
    expect(patch).not.toHaveProperty('view')
  })

  describe('moving to the next page', () => {
    function mockListTop(top: number) {
      const scrollIntoView = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoView
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
        top,
      } as DOMRect)
      return scrollIntoView
    }

    it('scrolls the list into view when its top is out of view', async () => {
      const scrollIntoView = mockListTop(-300)
      const { onSearchChange } = renderPage()

      await userEvent.click(screen.getByRole('button', { name: 'Seite 3' }))

      expect(scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ block: 'start' })
      )
      expect(onSearchChange).toHaveBeenCalledWith({ page: 3 })
    })

    it('does not move when the list top is already visible', async () => {
      // Below the sticky header (96px), so the list top is in view.
      const scrollIntoView = mockListTop(200)
      renderPage()

      await userEvent.click(screen.getByRole('button', { name: 'Seite 3' }))

      expect(scrollIntoView).not.toHaveBeenCalled()
    })
  })

  it('shows the progress bar only while the list is updating', async () => {
    const { unmount } = render(
      <AdoptionListPage
        adoptions={{
          data: [makeAdoption('1', 'Bello')],
          meta: { current_page: 1, last_page: 1, per_page: 25, total: 1 },
        }}
        search={adoptionListSearchDefaults}
        mediators={[]}
        animalTypes={[]}
        isUpdating
        onSearchChange={vi.fn()}
        createAction={null}
      />
    )
    // The table card and the cards each have one; it appears after a short delay.
    expect(await screen.findAllByRole('progressbar')).not.toHaveLength(0)
    unmount()

    renderPage()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('explains an empty filtered result', () => {
    renderPage({
      adoptions: {
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 },
      },
      search: { ...adoptionListSearchDefaults, search: 'xyz' },
    })
    expect(
      screen.getByText('Mit den gewählten Filtern gibt es keine Treffer.')
    ).toBeInTheDocument()
  })

  it('offers a reset in the empty message only while filters are active', async () => {
    const empty = {
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 },
    }
    const { onSearchChange } = renderPage({
      adoptions: empty,
      search: { ...adoptionListSearchDefaults, status: ['done'], search: 'x' },
    })

    const buttons = screen.getAllByRole('button', {
      name: 'Filter zurücksetzen',
    })
    // The toolbar's icon button and the one in the empty message.
    expect(buttons).toHaveLength(2)
    await userEvent.click(buttons[1])
    expect(onSearchChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: [], search: '' })
    )
  })

  it('has no reset in the empty message of an unfiltered list', () => {
    renderPage({
      adoptions: {
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 },
      },
    })
    // Only the (disabled) toolbar button.
    expect(
      screen.getAllByRole('button', { name: 'Filter zurücksetzen' })
    ).toHaveLength(1)
  })
})
