import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FieldDefinitionPage } from './FieldDefinitionPage'
import { createFieldDefinition, updateFieldDefinition } from '../api/requests'
import { ApiValidationError } from '@/lib/api'
import type {
  CatalogueField,
  CatalogueResource,
} from '@/api/types/case-file-catalogue'

vi.mock('../api/requests', () => ({
  createFieldDefinition: vi.fn(),
  updateFieldDefinition: vi.fn(),
}))
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
)
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/components/form/FormBlocker', () => ({ FormBlocker: () => null }))

const createMock = vi.mocked(createFieldDefinition)
const updateMock = vi.mocked(updateFieldDefinition)

const catalogue = {
  animal_type: { id: 'type-1', title: 'Hund' },
  groups: [{ id: 'group-1', title: 'Wohnen', fields: [] }],
} as unknown as CatalogueResource

const selectField = {
  id: 'field-1',
  key: 'housing',
  type: 'select',
  label: 'Wohnform',
  built_in: false,
  options: {
    choices: [
      { value: 'apartment', label: 'Wohnung' },
      { value: '', label: '' },
    ],
  },
} as unknown as CatalogueField

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <FieldDefinitionPage
        catalogue={catalogue}
        groupId="group-1"
        field={selectField}
        onDone={vi.fn()}
      />
    </QueryClientProvider>
  )
}

describe('FieldDefinitionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits again after a server error on the choices', async () => {
    updateMock.mockRejectedValueOnce(
      new ApiValidationError('invalid', {
        'options.choices.1.value': [
          'Jede Auswahlmöglichkeit braucht einen Wert.',
        ],
      })
    )
    updateMock.mockResolvedValue({ data: catalogue, message: 'ok' } as never)
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Speichern' }))
    expect(
      await screen.findByText('Jede Auswahlmöglichkeit braucht einen Wert.')
    ).toBeInTheDocument()
    expect(updateMock).toHaveBeenCalledTimes(1)

    await user.click(
      screen.getByRole('button', { name: 'Auswahlmöglichkeit 2 entfernen' })
    )
    await user.click(screen.getByRole('button', { name: 'Speichern' }))

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(2))
    expect(createMock).not.toHaveBeenCalled()
  })
})
