import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type {
  ContractFieldOptions,
  ContractTemplateResource,
} from '@/api/types/contract-templates'
import { ApiValidationError } from '@/lib/api'
import { ContractTemplateFormPage } from './pages/ContractTemplateFormPage'
import { createContractTemplate, updateContractTemplate } from './api/requests'

vi.mock('./api/requests', () => ({
  createContractTemplate: vi.fn(),
  updateContractTemplate: vi.fn(),
}))
vi.mock('@/components/form/FormBlocker', () => ({ FormBlocker: () => null }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const createMock = vi.mocked(createContractTemplate)
const updateMock = vi.mocked(updateContractTemplate)

// Radix Select measures and scrolls; jsdom does neither.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.scrollIntoView ??= () => {}

const animalTypes = [
  { id: 'dog', title: 'Hund' },
  { id: 'cat', title: 'Katze' },
]

const options: ContractFieldOptions = {
  animal: [
    { key: 'animal.name', label: 'Name des Tieres' },
    { key: 'animal.tasso_id', label: 'Tasso-ID des Tieres' },
  ],
  mediator: [{ key: 'mediator.full_name', label: 'Vermittler:in' }],
  adopter: [
    {
      animal_type_id: 'dog',
      fields: [
        { key: 'first_name', label: 'Vorname' },
        { key: 'id_card_number', label: 'Ausweisnummer' },
      ],
    },
    {
      animal_type_id: 'cat',
      fields: [{ key: 'first_name', label: 'Vorname' }],
    },
  ],
}

const template: ContractTemplateResource = {
  id: 'tpl',
  name: 'Schutzvertrag Hund',
  title: 'Schutzvertrag',
  body: 'Text',
  animal_types: [{ id: 'dog', title: 'Hund' }],
  animal_fields: [
    { key: 'animal.name', required: true },
    { key: 'animal.tasso_id', required: false },
  ],
  mediator_fields: [],
  adopter_fields: [{ key: 'id_card_number', required: true }],
  archived_at: null,
  updated_at: '2026-11-02T00:00:00Z',
}

function renderPage(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

function section(title: string) {
  return screen
    .getByText(title, { selector: '[data-slot="card-title"]' })
    .closest('[data-slot="card"]') as HTMLElement
}

beforeEach(() => {
  createMock.mockReset()
  updateMock.mockReset()
})

describe('ContractTemplateFormPage', () => {
  it('creates a template with fields added per section', async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    createMock.mockResolvedValue({ message: 'ok', data: template })

    renderPage(
      <ContractTemplateFormPage
        animalTypes={animalTypes}
        options={options}
        onDone={onDone}
      />
    )

    await user.type(screen.getByLabelText(/^Name/), 'Schutzvertrag Hund')
    // The adopter section needs an animal type first.
    expect(
      within(section('Adoptant:in')).getByText(/Wähle zuerst die Tierarten/)
    ).toBeInTheDocument()
    await user.click(screen.getByLabelText('Hund'))

    await user.click(
      within(section('Adoptant:in')).getByRole('combobox', {
        name: 'Feld zum Abschnitt hinzufügen',
      })
    )
    await user.click(screen.getByRole('option', { name: 'Ausweisnummer' }))

    await user.click(
      within(section('Tier')).getByRole('combobox', {
        name: 'Feld zum Abschnitt hinzufügen',
      })
    )
    await user.click(screen.getByRole('option', { name: 'Name des Tieres' }))

    await user.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(createMock).toHaveBeenCalledWith({
      name: 'Schutzvertrag Hund',
      title: 'Schutzvertrag',
      body: '',
      animal_type_ids: ['dog'],
      animal_fields: [{ key: 'animal.name', required: true }],
      mediator_fields: [],
      adopter_fields: [{ key: 'id_card_number', required: true }],
    })
    expect(onDone).toHaveBeenCalled()
  })

  it('reorders, makes optional and removes fields', async () => {
    const user = userEvent.setup()
    updateMock.mockResolvedValue({ message: 'ok', data: template })

    renderPage(
      <ContractTemplateFormPage
        template={template}
        animalTypes={animalTypes}
        options={options}
        onDone={vi.fn()}
      />
    )

    const animal = section('Tier')
    await user.click(
      within(animal).getByRole('button', {
        name: 'Tasso-ID des Tieres nach oben',
      })
    )
    await user.click(within(animal).getAllByRole('switch')[1])
    await user.click(
      within(section('Adoptant:in')).getByRole('button', {
        name: 'Ausweisnummer entfernen',
      })
    )
    await user.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(updateMock).toHaveBeenCalledWith(
      'tpl',
      expect.objectContaining({
        animal_fields: [
          { key: 'animal.tasso_id', required: false },
          { key: 'animal.name', required: false },
        ],
        adopter_fields: [],
      })
    )
  })

  it('flags an adopter field another chosen animal type lacks and shows the server error', async () => {
    const user = userEvent.setup()
    updateMock.mockRejectedValue(
      new ApiValidationError('invalid', {
        'adopter_fields.0.key': ['Das Feld fehlt in den Angaben für: Katze.'],
      })
    )

    renderPage(
      <ContractTemplateFormPage
        template={template}
        animalTypes={animalTypes}
        options={options}
        onDone={vi.fn()}
      />
    )

    const adopter = section('Adoptant:in')
    expect(within(adopter).queryByText('Nicht verfügbar')).toBeNull()
    await user.click(screen.getByLabelText('Katze'))
    expect(within(adopter).getByText('Nicht verfügbar')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Speichern' }))
    expect(
      await within(adopter).findByText(
        'Das Feld fehlt in den Angaben für: Katze.'
      )
    ).toBeInTheDocument()
  })
})
