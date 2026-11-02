import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type {
  CaseFileField,
  CaseFileGroup,
  CaseFileResource,
  Checklist,
} from '@/api/types/case-file'
import { ApiValidationError } from '@/lib/api'
import { CaseFileGroupEditDialog } from './pages/CaseFileGroupEditDialog'
import { CaseFileCard } from './components/CaseFileCard'
import { updateCaseFile } from './api/requests'

vi.mock('./api/requests', () => ({ updateCaseFile: vi.fn() }))
vi.mock('@/components/form/FormBlocker', () => ({ FormBlocker: () => null }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const updateCaseFileMock = vi.mocked(updateCaseFile)

// Radix radio groups measure themselves; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function field(overrides: Partial<CaseFileField>): CaseFileField {
  return {
    key: 'field',
    label: 'Feld',
    help: '',
    type: 'text',
    options: null,
    built_in: false,
    collect_at: 'application',
    required_for: null,
    effective_required_for: null,
    in_contract: false,
    condition: null,
    applies: true,
    requires_review: false,
    visible_to_applicant: true,
    visible_to_inspector: true,
    value: null,
    review_status: null,
    override: null,
    status: null,
    updated_at: null,
    ...overrides,
  }
}

const homeGroup: CaseFileGroup = {
  id: 'home',
  title: 'Wohnsituation',
  intro: '',
  fields: [
    field({
      key: 'living_space_sqm',
      label: 'Wohnfläche (m²)',
      type: 'integer',
      required_for: 'application',
      effective_required_for: 'application',
      value: 200,
      status: 'done',
    }),
    field({
      key: 'has_garden',
      label: 'Garten vorhanden',
      type: 'boolean',
      value: false,
    }),
    field({
      key: 'garden_size_sqm',
      label: 'Größe des Gartens (m²)',
      type: 'integer',
      effective_required_for: 'application',
      condition: { field: 'has_garden', equals: true },
      applies: false,
    }),
    field({ key: 'home_video', label: 'Hausvideo', type: 'video' }),
  ],
}

function checklist(step: Checklist['step'], missing = 0): Checklist {
  return {
    step,
    complete: missing === 0,
    missing,
    awaiting_review: 0,
    done: 1,
    items:
      missing > 0
        ? [
            {
              key: 'id_card_number',
              label: 'Ausweisnummer',
              required_for: 'contract',
              status: 'missing',
              subject: 'case_file',
            },
          ]
        : [],
  }
}

// One client per test, not per render, so a mutation survives re-renders.
let client: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('CaseFileGroupEditDialog', () => {
  beforeEach(() => {
    updateCaseFileMock.mockReset()
    client = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
  })

  function renderDialog() {
    return render(
      <CaseFileGroupEditDialog
        adoptionId="a1"
        group={homeGroup}
        allFields={homeGroup.fields}
        onClose={vi.fn()}
      />,
      { wrapper }
    )
  }

  it('shows a conditional field only once its condition is met', async () => {
    renderDialog()

    expect(screen.queryByLabelText(/Größe des Gartens/)).toBeNull()

    await userEvent.click(screen.getByLabelText('Ja'))

    expect(screen.getByLabelText(/Größe des Gartens/)).toBeInTheDocument()
  })

  it('saves only the fields that apply, with numbers as numbers', async () => {
    updateCaseFileMock.mockResolvedValue({
      message: 'Angaben gespeichert.',
      data: { groups: [], checklists: {} } as unknown as CaseFileResource,
    })
    renderDialog()

    await userEvent.click(screen.getByLabelText('Ja'))
    await userEvent.type(screen.getByLabelText(/Größe des Gartens/), '300')
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(updateCaseFileMock).toHaveBeenCalledWith('a1', {
      living_space_sqm: 200,
      has_garden: true,
      garden_size_sqm: 300,
    })
  })

  it('leaves a field that no longer applies out of the save', async () => {
    updateCaseFileMock.mockResolvedValue({
      message: 'Angaben gespeichert.',
      data: { groups: [], checklists: {} } as unknown as CaseFileResource,
    })
    renderDialog()

    await userEvent.click(screen.getByLabelText('Ja'))
    await userEvent.type(screen.getByLabelText(/Größe des Gartens/), '300')
    await userEvent.click(screen.getByLabelText('Nein'))
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(updateCaseFileMock).toHaveBeenCalledWith('a1', {
      living_space_sqm: 200,
      has_garden: false,
    })
  })

  it('shows server validation errors on the field', async () => {
    updateCaseFileMock.mockImplementation(() =>
      Promise.reject(
        new ApiValidationError('Ungültig', {
          'values.living_space_sqm': ['Wohnfläche muss mindestens 1 sein.'],
        })
      )
    )
    renderDialog()

    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(
      await screen.findByText('Wohnfläche muss mindestens 1 sein.')
    ).toBeInTheDocument()
  })
})

describe('CaseFileCard', () => {
  const caseFile: CaseFileResource = {
    groups: [
      homeGroup,
      {
        id: 'contract',
        title: 'Für den Vertrag',
        intro: '',
        fields: [
          field({
            key: 'id_card_number',
            label: 'Ausweisnummer',
            effective_required_for: 'contract',
            status: 'missing',
            in_contract: true,
            visible_to_inspector: false,
          }),
        ],
      },
    ],
    checklists: {
      application: checklist('application'),
      pre_inspection: checklist('pre_inspection'),
      contract: checklist('contract', 1),
      transport: checklist('transport', 1),
      handover: checklist('handover', 1),
    },
  }

  function renderCard() {
    return render(
      <CaseFileCard
        caseFile={caseFile}
        renderEditGroupAction={() => null}
        renderRequirementAction={() => null}
      />
    )
  }

  it('opens the checklist on the first incomplete step', () => {
    renderCard()

    expect(screen.getByText(/Für Vertrag fehlen 1 Angabe/)).toBeInTheDocument()
  })

  it('hides fields whose condition is not met', () => {
    renderCard()

    expect(screen.getByText('Wohnfläche (m²)')).toBeInTheDocument()
    expect(screen.queryByText('Größe des Gartens (m²)')).toBeNull()
  })

  it('filters down to open fields', async () => {
    renderCard()

    await userEvent.click(screen.getByLabelText('Nur offene Angaben'))

    expect(screen.queryByText('Wohnfläche (m²)')).toBeNull()
    const contractSection = screen
      .getByRole('heading', { name: 'Für den Vertrag' })
      .closest('section')!
    expect(within(contractSection).getByText('Fehlt')).toBeInTheDocument()
    expect(
      within(contractSection).getByText('Nicht für Kontrolleure')
    ).toBeInTheDocument()
  })
})
