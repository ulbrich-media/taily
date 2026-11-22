import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useController, type Control } from 'react-hook-form'
import type { ReactNode } from 'react'
import type { RelatedAdoption } from '@/api/types/adoptions'
import { AdoptionCreatePage } from './pages/AdoptionCreatePage'
import { RelatedAdoptionsCard } from './components/RelatedAdoptionsCard'
import { createAdoption } from './api/requests'

vi.mock('./api/requests', () => ({ createAdoption: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// The real selects load and search lists; a plain input stands in for them.
function FakeSelect({
  name,
  control,
  label,
}: {
  name: string
  control: Control
  label: string
}) {
  const { field } = useController({ name, control })
  return (
    <label>
      {label}
      <input
        value={field.value ?? ''}
        onChange={(event) => field.onChange(event.target.value)}
      />
    </label>
  )
}
vi.mock('@/components/field/AnimalSelect.tsx', () => ({
  AnimalSelect: FakeSelect,
}))
vi.mock('@/components/field/PersonSelect.tsx', () => ({
  PersonSelect: FakeSelect,
}))

const createMock = vi.mocked(createAdoption)

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

function renderCreatePage() {
  const onCreated = vi.fn()
  renderWithClient(
    <AdoptionCreatePage
      persons={[]}
      mediators={[]}
      onCreated={onCreated}
      onClose={vi.fn()}
    />
  )
  return { onCreated }
}

beforeEach(() => {
  createMock.mockReset()
  createMock.mockResolvedValue({
    message: 'ok',
    data: { id: 'new' },
  } as Awaited<ReturnType<typeof createAdoption>>)
})

describe('AdoptionCreatePage', () => {
  it('stores the applicant data on the adoption', async () => {
    const user = userEvent.setup()
    const { onCreated } = renderCreatePage()

    await user.type(screen.getByLabelText('Tier'), 'animal-1')
    await user.type(screen.getByLabelText(/^Vorname/), ' Anna ')
    await user.type(screen.getByLabelText(/^Nachname/), 'Neu')
    await user.type(screen.getByLabelText(/^E-Mail/), 'anna@example.com')
    await user.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(createMock.mock.calls.at(-1)?.[0]).toEqual({
      animal_id: 'animal-1',
      mediator_id: null,
      applicant_first_name: 'Anna',
      applicant_last_name: 'Neu',
      applicant_email: 'anna@example.com',
      applicant_phone: '',
    })
    expect(onCreated).toHaveBeenCalledWith('new')
  })

  it('requires a name unless a known person is chosen', async () => {
    const user = userEvent.setup()
    renderCreatePage()

    await user.type(screen.getByLabelText('Tier'), 'animal-1')
    await user.click(screen.getByRole('button', { name: 'Speichern' }))
    expect(createMock).not.toHaveBeenCalled()
    expect(screen.getAllByText('Pflichtfeld')).toHaveLength(2)

    await user.click(screen.getByRole('radio', { name: 'Bekannte Person' }))
    await user.type(screen.getByLabelText('Person'), 'person-1')
    await user.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(createMock.mock.calls.at(-1)?.[0]).toEqual({
      animal_id: 'animal-1',
      mediator_id: null,
      applicant_person_id: 'person-1',
    })
  })
})

function related(overrides: Partial<RelatedAdoption>): RelatedAdoption {
  return {
    id: 'a1',
    status: 'done',
    created_at: '2025-03-12T10:00:00Z',
    applicant: { full_name: 'Anna Adopter', email: 'anna@example.com' },
    animal: { id: 'x', name: 'Bello', animal_type: 'Hund' },
    matched_by: ['email'],
    pre_inspection_status: 'finished',
    contract_signed: true,
    handed_over_at: null,
    ...overrides,
  }
}

describe('RelatedAdoptionsCard', () => {
  it('is hidden without related adoptions', () => {
    const { container } = render(
      <RelatedAdoptionsCard
        related={[]}
        renderOpenLink={() => null}
        renderImportAction={() => null}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('says why an adoption counts as the same applicant', () => {
    render(
      <RelatedAdoptionsCard
        related={[
          related({ id: 'a1' }),
          related({ id: 'a2', animal: null, matched_by: ['person'] }),
          related({ id: 'a3', matched_by: ['email', 'person'] }),
        ]}
        renderOpenLink={(adoption) => <a href="#">Öffnen {adoption.id}</a>}
        renderImportAction={() => null}
      />
    )

    expect(screen.getByText(/· gleiche E-Mail$/)).toBeInTheDocument()
    expect(screen.getByText(/· gleiche Person$/)).toBeInTheDocument()
    expect(screen.getByText(/gleiche E-Mail und Person/)).toBeInTheDocument()
    expect(screen.getByText('Unbekanntes Tier')).toBeInTheDocument()
    expect(screen.getByText('Öffnen a2')).toBeInTheDocument()
  })
})
